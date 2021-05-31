import ora from 'ora';
import { hostname } from 'os';

import crypto from '../services/crypto';
import api from '../services/api';
import { baseOptions } from '../shared';
import * as prompts from './configure.prompts';
import * as outputs from './configure.outputs';
import { Builder, Handler } from './configure.types';
import { readUserConfig, writeUserConfig } from '../services/config';
import { saveAccountEncryptionKey } from '../services/keychain';

export const command: string = 'configure';
export const desc: string = 'Configure device';

export const builder: Builder = (yargs) =>
  yargs.options({
    ...baseOptions,
    email: { type: 'string', desc: 'account email', alias: 'e' },
    name: {
      type: 'string',
      desc: 'account display name if new account',
      alias: 'n',
    },
    curve: {
      type: 'string',
      desc: 'ecc curve name used to generate account keys if new account',
      alias: 'c',
      choices: crypto.constants.ECC_CURVES,
      default: 'curve25519' as const,
    },
  });

export const handler: Handler = async (argv) => {
  const spinner = ora({
    isSilent: argv.quiet,
  });

  // TODO: Decide what to do with json output option.
  const { email, name, curve, profile } = argv;

  await readUserConfig(profile)
    .then((_) => outputs.userConfigFound(profile))
    .catch((_) => undefined);

  outputs.welcome();

  const accountEmail = email ?? (await prompts.promptForEmail());

  spinner.start('Sending email verification request');
  await api.sendEmailVerificationCode({
    Email: accountEmail,
  });
  spinner.succeed();

  const otp = await prompts.promptForOtp({ email: accountEmail });

  spinner.start('Registering device');
  const {
    ApiKey: apiKey,
    AccountId: accountId,
    DeviceId: deviceId,
    IsAccountConfigured: isAccountConfigured,
  } = await api.registerDevice({
    Code: otp,
    Email: accountEmail,
    DeviceName: hostname(),
  });
  spinner.succeed();

  if (isAccountConfigured) {
    spinner.start('Fetching existing account configuration');

    // NOTE: Artificial delay to avoid hitting Forbidden
    // in case the API Key is not activated yet. Might be
    // better to implement a specific retry policy for this case.
    // await new Promise((resolve) => setTimeout(resolve, 2_500));

    const accountConfiguration = await api.retrieveAccountConfiguration(
      {},
      { ApiKey: apiKey },
    );
    spinner.succeed();

    const { accountEncryptionKey } =
      await prompts.promptForExistingMasterPassword({
        accountPublicKey: accountConfiguration.AccountPublicKey,
        accountEncryptedPrivateKey:
          accountConfiguration.AccountEncryptedPrivateKey,
        accountEncryptionKeySalt: accountConfiguration.AccountEncryptionKeySalt,
      });

    const useKeychain = await prompts.promptUseKeychain();

    if (useKeychain) {
      await saveAccountEncryptionKey({ profile, accountEncryptionKey });
    }

    const configPath = await writeUserConfig(profile, {
      Device: {
        Id: deviceId,
        UseKeychain: useKeychain,
      },
      Account: {
        Id: accountId,
        ApiKey: apiKey,
        Email: accountEmail,
        Name: accountConfiguration.AccountName,
        PublicKey: accountConfiguration.AccountPublicKey,
        EncryptedPrivateKey: accountConfiguration.AccountEncryptedPrivateKey,
        EncryptionKeySalt: accountConfiguration.AccountEncryptionKeySalt,
      },
      PersonalVault: {
        Id: accountConfiguration.PersonalVaultId,
        PublicKey: accountConfiguration.PersonalVaultPublicKey,
        EncryptedPrivateKey:
          accountConfiguration.PersonalVaultEncryptedPrivateKey,
      },
    });

    outputs.deviceConfigured(configPath);
  }

  const accountName = name ?? (await prompts.promptForAccountName());

  const { accountEncryptionKey, accountEncryptionKeySalt } = await prompts
    .promptForMasterPassword()
    .then(prompts.promptForConfirmMasterPassword);

  const useKeychain = await prompts.promptUseKeychain();

  spinner.start('Generating account keys');
  const keys = await crypto.generateAccountConfigurationKeys({
    accountEmail,
    accountName,
    accountEncryptionKey,
    curve,
  });

  spinner.text = 'Configuring account';

  const { PersonalVaultId: personalVaultId } = await api.configureAccount(
    {
      AccountName: accountName,
      AccountEncryptionKeySalt: accountEncryptionKeySalt,
      AccountPublicKey: keys.accountKeyPair.publicKey,
      AccountEncryptedPrivateKey: keys.accountKeyPair.encryptedPrivateKey,
      PersonalVaultPublicKey: keys.personalVaultKeyPair.publicKey,
      PersonalVaultEncryptedPrivateKey:
        keys.personalVaultKeyPair.encryptedPrivateKey,
    },
    { ApiKey: apiKey },
  );
  spinner.succeed();

  if (useKeychain) {
    await saveAccountEncryptionKey({ profile, accountEncryptionKey });
  }

  const configPath = await writeUserConfig(profile, {
    Device: {
      Id: deviceId,
      UseKeychain: useKeychain,
    },
    Account: {
      Id: accountId,
      ApiKey: apiKey,
      Email: accountEmail,
      Name: accountName,
      PublicKey: keys.accountKeyPair.publicKey,
      EncryptedPrivateKey: keys.accountKeyPair.encryptedPrivateKey,
      EncryptionKeySalt: accountEncryptionKeySalt,
    },
    PersonalVault: {
      Id: personalVaultId,
      PublicKey: keys.personalVaultKeyPair.publicKey,
      EncryptedPrivateKey: keys.personalVaultKeyPair.encryptedPrivateKey,
    },
  });

  outputs.deviceConfigured(configPath);
};
