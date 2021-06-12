import type { Key } from 'openpgp';
import { prompt } from 'enquirer';
import * as yup from 'yup';

import crypto from '../../services/crypto';
import { getAccountEncryptionKey } from '../../services/keychain';

export const confirmVaultId = async ({
  vaultMemberships,
}: {
  vaultMemberships: Array<{
    Role: string;
    VaultId: string;
    VaultName: string;
    VaultOwnerAccountName: string;
    VaultOwnerAccountEmail: string;
  }>;
}): Promise<string> => {
  if (vaultMemberships.length === 0) {
    throw new Error('vault not found');
  }

  if (vaultMemberships.length === 1) {
    const [vaultMembership] = vaultMemberships;
    return vaultMembership.VaultId;
  }

  if (vaultMemberships.length > 1) {
    const { vaultId: result } = await prompt<{
      vaultId: { [k: string]: string };
    }>({
      type: 'select',
      name: 'vaultId',
      message:
        'You are a member of multiple vaults with this name. Which one did you mean?',
      // NOTE: Resulting type cast as any due to a bug in
      // type definitions (name is required although it should not be).
      choices: vaultMemberships.map((vaultMembership) => ({
        name: `${vaultMembership.VaultName} (${vaultMembership.Role})`,
        value: vaultMembership.VaultId,
        hint: `Created by ${vaultMembership.VaultOwnerAccountName} <${vaultMembership.VaultOwnerAccountEmail}>`,
      })),
      result(res) {
        // NOTE: See https://github.com/enquirer/enquirer/blob/8d626c206733420637660ac7c2098d7de45e8590/examples/multiselect/option-result.js
        // for relevant example. Had to dig in to get to the bottom of this.
        // If we do not do this, it's pretty much impossible to maintain
        // user-friendly display names in options and confirms.
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return this.map(res);
      },
      required: true,
    });

    const [vaultId] = Object.values(result);

    return vaultId;
  }

  throw new Error('unexpected result');
};

export const promptForExistingMasterPassword = async ({
  accountPublicKey,
  accountEncryptedPrivateKey,
  accountEncryptionKeySalt,
  useKeychain,
  profile,
}: {
  accountPublicKey: string;
  accountEncryptedPrivateKey: string;
  accountEncryptionKeySalt: string;
  useKeychain: boolean;
  profile: string;
}): Promise<{ accountPublicKey: Key; accountPrivateKey: Key }> => {
  if (useKeychain) {
    const accountEncryptionKey = await getAccountEncryptionKey({ profile });

    // Ensure the provided master password can
    // in fact be used to decrypt the master key.
    const { publicKey, privateKey } =
      await crypto.decryptAccountEncryptedPrivateKey({
        accountPublicKey,
        accountEncryptedPrivateKey,
        accountEncryptionKey,
      });

    return { accountPublicKey: publicKey, accountPrivateKey: privateKey };
  }

  const accountPassphraseSchema = yup.string().min(12).max(256).required();

  let result: { accountPublicKey: Key; accountPrivateKey: Key };

  await prompt<{ existingMasterPassword: string }>({
    type: 'invisible',
    name: 'existingMasterPassword',
    message: 'Please enter your (existing) master password',
    required: true,
    validate: async (value) => {
      try {
        await accountPassphraseSchema.validate(value);

        const { encryptionKey: accountEncryptionKey } =
          crypto.deriveEncryptionKey({
            passphrase: value,
            salt: Buffer.from(accountEncryptionKeySalt, 'base64'),
          });

        // Ensure the provided master password can
        // in fact be used to decrypt the master key.
        const { publicKey, privateKey } =
          await crypto.decryptAccountEncryptedPrivateKey({
            accountPublicKey,
            accountEncryptedPrivateKey,
            accountEncryptionKey,
          });

        // NOTE: Not the prettiest way to do this but want to avoid over-engineering.
        result = { accountPublicKey: publicKey, accountPrivateKey: privateKey };

        return true;
      } catch (error) {
        return error.message;
      }
    },
  });

  return result!;
};
