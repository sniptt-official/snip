import { encrypt, createMessage, Key, readKey } from 'openpgp';

type Params = {
  action: 'add' | 'remove';
  existingPublicKeys: Array<string>;
  publicKey: string;
  vaultPrivateKey: Key;
};

type Response = {
  publicKeys: Array<Key>;
  encryptedPrivateKey: string;
};

export default async (params: Params): Promise<Response> => {
  const { existingPublicKeys, vaultPrivateKey, publicKey, action } = params;

  const publicKeysSet = new Set(existingPublicKeys);

  if (action === 'add') {
    publicKeysSet.add(publicKey);
  }

  if (action === 'remove') {
    publicKeysSet.delete(publicKey);
  }

  const publicKeys = await Promise.all(
    [...publicKeysSet].map((armoredKey) => readKey({ armoredKey })),
  );

  const vaultEncryptedPrivateKey = await encrypt({
    message: await createMessage({ text: vaultPrivateKey.armor() }),
    publicKeys,
    // NOTE: Think about adding signature verification. Might be
    // a bit problematic given vault owners can transfer ownership.
    // privateKeys: [accountPrivateKey],
  });

  return {
    publicKeys,
    encryptedPrivateKey: vaultEncryptedPrivateKey,
  };
};
