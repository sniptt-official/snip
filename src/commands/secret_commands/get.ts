import ora from 'ora';

import { Builder, Handler } from './get.types';
import * as prompts from './get.prompts';
import * as outputs from './get.outputs';
import { baseOptions } from '../../shared';
import api from '../../services/api';
import { readUserConfig } from '../../services/config';
import crypto from '../../services/crypto';

export const command: string = 'get <name>';
export const desc: string =
  'Fetch and decrypt end-to-end encrypted secret from vault';

export const builder: Builder = (yargs) =>
  yargs
    .options({
      ...baseOptions,
      out: { type: 'string', alias: 'o', conflicts: 'json' },
      vault: { type: 'string', alias: 'v' },
    })
    .positional('name', { type: 'string', demandOption: true })
    .example([
      // ['$0 get'],
      ['$0 get DB_PASSWORD --profile project:phoenix'],
      ['$0 get .env.prod --vault devs'],
      ['$0 get .env.prod -v devs -q --json | jq -r .SecretContent | base64 -d'],
      ['$0 get alice.csv -v creds:aws -o'],
    ]);

export const handler: Handler = async (argv) => {
  const spinner = ora({
    isSilent: argv.quiet,
  });

  const { profile, name: secretName, vault: vaultName, json, out } = argv;

  const userConfig = await readUserConfig(profile);

  let vaultId = userConfig.PersonalVault.Id;

  if (vaultName) {
    spinner.start('Fetching existing vault memberships');
    const vaultMemberships = await api.searchVaultMemberships(
      { VaultName: vaultName },
      { ApiKey: userConfig.Account.ApiKey },
    );
    spinner.succeed();

    vaultId = await prompts.confirmVaultId({ vaultMemberships });
  }

  // TODO: Can likely be moved to the if block above.
  spinner.start('Fetching vault keys');
  const vaultKeys = await api.retrieveVaultKeys(
    { VaultId: vaultId },
    { ApiKey: userConfig.Account.ApiKey },
  );
  spinner.succeed();

  // TODO: Might be better to have `searchSecrets` api call
  // and prompt for selection if more than one matches.
  spinner.start('Fetching secret from vault');
  const {
    SecretId: secretId,
    SecretEncryptedContent: encryptedContent,
    SecretContentType: contentType,
  } = await api.retrieveSecret(
    {
      SecretName: secretName,
      VaultId: vaultId,
    },
    { ApiKey: userConfig.Account.ApiKey },
  );
  spinner.succeed();

  const { accountPrivateKey } = await prompts.promptForExistingMasterPassword({
    accountPublicKey: userConfig.Account.PublicKey,
    accountEncryptedPrivateKey: userConfig.Account.EncryptedPrivateKey,
    accountEncryptionKeySalt: userConfig.Account.EncryptionKeySalt,
    useKeychain: userConfig.Device.UseKeychain,
    profile,
  });

  spinner.start('Decrypting contents');
  const vaultKeyPair = await crypto.decryptVaultEncryptedPrivateKey({
    accountPrivateKey,
    vaultPublicKey: vaultKeys.VaultPublicKey,
    vaultEncryptedPrivateKey: vaultKeys.VaultEncryptedPrivateKey,
  });

  const binary = await crypto.decryptBinaryWithVaultKeys({
    encryptedContent,
    vaultPublicKey: vaultKeyPair.publicKey,
    vaultPrivateKey: vaultKeyPair.privateKey,
  });
  spinner.succeed();

  outputs.secretRetrieved({
    secretId,
    secretName,
    secretContent: binary,
    secretContentType: contentType,
    vaultName,
    json,
    out,
  });
};
