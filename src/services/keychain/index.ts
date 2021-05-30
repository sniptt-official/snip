import { setPassword, getPassword } from 'keytar';

import { keychainServiceName } from './constants';

export const saveAccountEncryptionKey = async ({
  profile,
  accountEncryptionKey,
}: {
  profile: string;
  accountEncryptionKey: string;
}): Promise<void> => {
  await setPassword(keychainServiceName, profile, accountEncryptionKey);
};

export const getAccountEncryptionKey = async ({
  profile,
}: {
  profile: string;
}): Promise<string> => {
  const maybeAccountEncryptionKey = await getPassword(
    keychainServiceName,
    profile,
  );

  if (!maybeAccountEncryptionKey) {
    throw new Error(
      `could not retrieve item from keychain for profile ${profile}`,
    );
  }

  return maybeAccountEncryptionKey;
};
