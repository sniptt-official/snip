import {
  uniqueNamesGenerator,
  adjectives,
  colors,
  animals,
} from 'unique-names-generator';
import { prompt } from 'enquirer';
import * as yup from 'yup';

import crypto from '../services/crypto';

const generateName = () =>
  uniqueNamesGenerator({
    dictionaries: [adjectives, colors, animals],
    separator: ' ',
    style: 'capital',
  });

export const promptForEmail = async (): Promise<string> => {
  const accountEmailSchema = yup.string().email().required();

  const { accountEmail } = await prompt<{ accountEmail: string }>({
    type: 'input',
    name: 'accountEmail',
    message: 'What email address should we use to verify your identity?',
    required: true,
    validate: async (value) => {
      try {
        await accountEmailSchema.validate(value);
        return true;
      } catch (error) {
        return error.message;
      }
    },
  });

  return accountEmail;
};

export const promptForOtp = async ({
  email,
}: {
  email: string;
}): Promise<string> => {
  const otpSchema = yup.string().length(8).required();

  const { otp } = await prompt<{ otp: string }>({
    type: 'invisible',
    name: 'otp',
    message: `Please enter the verification code sent to ${email}`,
    required: true,
    validate: async (value) => {
      try {
        await otpSchema.validate(value);
        return true;
      } catch (error) {
        return error.message;
      }
    },
  });

  return otp;
};

export const promptForAccountName = async (): Promise<string> => {
  const accountNameSchema = yup.string().min(1).max(64).required();

  const { accountName } = await prompt<{ accountName: string }>({
    type: 'input',
    name: 'accountName',
    message: 'What should we name your account?',
    required: true,
    initial: generateName(),
    validate: async (value) => {
      try {
        await accountNameSchema.validate(value);
        return true;
      } catch (error) {
        return error.message;
      }
    },
  });

  return accountName;
};

export const promptForMasterPassword = async (): Promise<{
  accountEncryptionKey: string;
  accountEncryptionKeySalt: string;
}> => {
  const accountPassphraseSchema = yup.string().min(12).max(256).required();

  // TODO: Check for passphrase strength.

  let result: {
    accountEncryptionKey: string;
    accountEncryptionKeySalt: string;
  };

  await prompt<{ masterPassword: string }>({
    type: 'invisible',
    name: 'masterPassword',
    message:
      'What master password would you like to use to encrypt your content? (12 characters or more)',
    required: true,
    validate: async (value) => {
      try {
        await accountPassphraseSchema.validate(value);

        // NOTE: Not the prettiest way to do this but want to avoid over-engineering.
        const {
          encryptionKey: accountEncryptionKey,
          encryptionKeySalt: accountEncryptionKeySalt,
        } = crypto.deriveEncryptionKey({
          passphrase: value,
        });

        result = {
          accountEncryptionKey,
          accountEncryptionKeySalt,
        };

        return true;
      } catch (error) {
        return error.message;
      }
    },
  });

  return result!;
};

export const promptForConfirmMasterPassword = async ({
  accountEncryptionKey,
  accountEncryptionKeySalt,
}: {
  accountEncryptionKey: string;
  accountEncryptionKeySalt: string;
}): Promise<{
  accountEncryptionKey: string;
  accountEncryptionKeySalt: string;
}> => {
  await prompt<{
    confirmMasterPassword: string;
  }>({
    type: 'invisible',
    name: 'confirmMasterPassword',
    message: 'Please confirm master password to continue',
    required: true,
    validate: (value) => {
      const result = crypto.deriveEncryptionKey({
        passphrase: value,
        salt: Buffer.from(accountEncryptionKeySalt, 'base64'),
      });

      if (result.encryptionKey === accountEncryptionKey) {
        return true;
      }

      return 'Passwords do not match, please try again';
    },
  });

  return {
    accountEncryptionKey,
    accountEncryptionKeySalt,
  };
};

export const promptForExistingMasterPassword = async ({
  accountPublicKey,
  accountEncryptedPrivateKey,
  accountEncryptionKeySalt,
}: {
  accountPublicKey: string;
  accountEncryptedPrivateKey: string;
  accountEncryptionKeySalt: string;
}): Promise<{ accountEncryptionKey: string }> => {
  const accountPassphraseSchema = yup.string().min(12).max(256).required();

  let result: { accountEncryptionKey: string };

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
        await crypto.decryptAccountEncryptedPrivateKey({
          accountPublicKey,
          accountEncryptedPrivateKey,
          accountEncryptionKey,
        });

        // NOTE: Not the prettiest way to do this but want to avoid over-engineering.
        result = { accountEncryptionKey };

        return true;
      } catch (error) {
        return error.message;
      }
    },
  });

  return result!;
};

export const promptUseKeychain = async (): Promise<boolean> => {
  const { confirmUseKeychain } = await prompt<{ confirmUseKeychain: boolean }>({
    type: 'confirm',
    name: 'confirmUseKeychain',
    message:
      'Would you like us to store your master password securely in Keychain?',
    required: true,
    initial: true,
  });

  return confirmUseKeychain;
};
