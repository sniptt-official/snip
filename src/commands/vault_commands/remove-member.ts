import ora from 'ora';

import { Builder, Handler } from './remove-member.types';
import * as prompts from './remove-member.prompts';
import * as outputs from './remove-member.outputs';
import { baseOptions } from '../../shared';
import api from '../../services/api';
import { readUserConfig } from '../../services/config';
import crypto from '../../services/crypto';

export const command = 'remove-member <name>';
export const desc = 'Remove member from vault';

export const builder: Builder = (yargs) =>
  yargs
    .options({
      ...baseOptions,
      email: { type: 'string', alias: 'e', demandOption: true },
    })
    .positional('name', { type: 'string', demandOption: true })
    .example([
      // ['$0 vault remove-member'],
      // ['$0 vault remove-member devs'],
      ['$0 vault remove-member devs -e alice@example.com'],
    ]);

export const handler: Handler = async (argv) => {
  const spinner = ora({
    isSilent: argv.quiet,
  });

  const { profile, name: vaultName, email, json } = argv;

  const userConfig = await readUserConfig(profile);

  spinner.start(`Fetching public key for ${email}`);
  const { AccountPublicKey: counterpartAccountPublicKey } =
    await api.retrieveAccountPublicKey(
      { AccountEmail: email },
      { ApiKey: userConfig.Account.ApiKey },
    );
  spinner.succeed();

  spinner.start('Fetching existing vault memberships');
  const vaultMemberships = await api.searchVaultMemberships(
    { VaultName: vaultName },
    { ApiKey: userConfig.Account.ApiKey },
  );
  spinner.succeed();

  const vaultId = await prompts.confirmVaultId({ vaultMemberships });

  // TODO: Check if a member is already NOT a member of the vault
  // before we attempt to remove the email. Better UX innit.

  spinner.start(`Fetching vault members for ${vaultName}`);
  const vaultKeys = await api.retrieveVaultKeys(
    { VaultId: vaultId },
    { ApiKey: userConfig.Account.ApiKey },
  );
  const vaultMembers = await api.listVaultMembers(
    { VaultId: vaultId },
    { ApiKey: userConfig.Account.ApiKey },
  );
  const existingPublicKeys = vaultMembers.map(
    ({ AccountPublicKey }) => AccountPublicKey,
  );
  spinner.succeed();

  const { accountPrivateKey } = await prompts.promptForExistingMasterPassword({
    accountPublicKey: userConfig.Account.PublicKey,
    accountEncryptedPrivateKey: userConfig.Account.EncryptedPrivateKey,
    accountEncryptionKeySalt: userConfig.Account.EncryptionKeySalt,
    useKeychain: userConfig.Device.UseKeychain,
    profile,
  });

  spinner.start('Re-encrypting vault keys');
  const vaultKeyPair = await crypto.decryptVaultEncryptedPrivateKey({
    accountPrivateKey: accountPrivateKey,
    vaultPublicKey: vaultKeys.VaultPublicKey,
    vaultEncryptedPrivateKey: vaultKeys.VaultEncryptedPrivateKey,
  });

  const { encryptedPrivateKey: vaultEncryptedPrivateKey } =
    await crypto.updateVaultPrivateKey({
      existingPublicKeys,
      vaultPrivateKey: vaultKeyPair.privateKey,
      publicKey: counterpartAccountPublicKey,
      action: 'remove',
    });
  spinner.succeed();

  spinner.start('Updating remote vault configuration');
  await api.removeMemberFromVault(
    {
      VaultId: vaultId,
      VaultEncryptedPrivateKey: vaultEncryptedPrivateKey,
      AccountEmail: email,
    },
    { ApiKey: userConfig.Account.ApiKey },
  );
  spinner.succeed();

  outputs.memberRemoved({
    email,
    vaultId,
    vaultName,
    vaultEncryptedPrivateKey,
    json,
  });
};
