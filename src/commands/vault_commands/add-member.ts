import ora from 'ora';

import { Builder, Handler } from './add-member.types';
import * as prompts from './add-member.prompts';
import * as outputs from './add-member.outputs';
import { baseOptions } from '../../shared';
import api from '../../services/api';
import { readUserConfig } from '../../services/config';
import crypto from '../../services/crypto';

export const command: string = 'add-member <name>';
export const desc: string = 'Add member to vault';

export const builder: Builder = (yargs) =>
  yargs
    .options({
      ...baseOptions,
      email: { type: 'string', alias: 'e', demandOption: true },
      role: {
        type: 'string',
        alias: 'r',
        default: 'read' as const,
        choices: ['read', 'admin'],
      },
    })
    .positional('name', { type: 'string', demandOption: true })
    .example([
      // ['$0 vault add-member'],
      // ['$0 vault add-member devs'],
      ['$0 vault add-member devs -e alice@example.com'],
      ['$0 vault add-member creds:aws -e alice@example.com -r admin'],
    ]);

export const handler: Handler = async (argv) => {
  const spinner = ora({
    isSilent: argv.quiet,
  });

  const { profile, name: vaultName, email, role, json } = argv;

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

  // TODO: Check if a member is already a member of the vault
  // before we attempt to add the email. Better UX innit.

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
      action: 'add',
    });
  spinner.succeed();

  spinner.start('Updating remote vault configuration');
  await api.addMemberToVault(
    {
      VaultId: vaultId,
      VaultEncryptedPrivateKey: vaultEncryptedPrivateKey,
      AccountEmail: email,
      Role: role === 'read' ? 'Read' : 'Admin',
    },
    { ApiKey: userConfig.Account.ApiKey },
  );
  spinner.succeed();

  outputs.memberAdded({
    email,
    vaultId,
    vaultName,
    vaultEncryptedPrivateKey,
    json,
  });
};
