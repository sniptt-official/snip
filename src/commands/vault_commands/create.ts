import ora from 'ora';

import { Builder, Handler } from './create.types';
import * as prompts from './create.prompts';
import * as outputs from './create.outputs';
import { baseOptions } from '../../shared';
import api from '../../services/api';
import { readUserConfig } from '../../services/config';
import crypto from '../../services/crypto';

export const command: string = 'create [name]';
export const desc: string = 'Create vault named [name]';

export const builder: Builder = (yargs) =>
  yargs
    .options({
      ...baseOptions,
      curve: {
        type: 'string',
        desc: 'ecc curve name used to generate account keys if new account',
        alias: 'c',
        choices: crypto.constants.ECC_CURVES,
        default: 'curve25519' as const,
      },
    })
    .positional('name', { type: 'string' });

export const handler: Handler = async (argv) => {
  const spinner = ora({
    isSilent: argv.quiet,
  });

  const {
    profile,
    name: vaultName = await prompts.confirmVaultName(),
    curve,
    json,
  } = argv;

  const userConfig = await readUserConfig(profile);

  // TODO: Check if a vault with this name already exists for
  // given user before we attempt to create it. Better UX innit.

  const { accountPublicKey, accountPrivateKey } =
    await prompts.promptForExistingMasterPassword({
      accountPublicKey: userConfig.Account.PublicKey,
      accountEncryptedPrivateKey: userConfig.Account.EncryptedPrivateKey,
      accountEncryptionKeySalt: userConfig.Account.EncryptionKeySalt,
      useKeychain: userConfig.Device.UseKeychain,
      profile,
    });

  spinner.start('Generating vault keys');
  const vaultKeyPair = await crypto.generateVaultKeys({
    accountEmail: userConfig.Account.Email,
    accountName: userConfig.Account.Name,
    accountPublicKey,
    accountPrivateKey,
    curve,
  });
  spinner.succeed();

  spinner.start('Creating vault');
  const { VaultId: vaultId } = await api.createVault(
    {
      VaultName: vaultName,
      VaultPublicKey: vaultKeyPair.publicKey,
      VaultEncryptedPrivateKey: vaultKeyPair.encryptedPrivateKey,
    },
    { ApiKey: userConfig.Account.ApiKey },
  );
  spinner.succeed();

  outputs.vaultCreated({
    vaultId,
    vaultName,
    json,
  });
};