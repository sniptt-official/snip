import { decrypt, readKey, readMessage, Key } from 'openpgp';

type Params = {
  accountPrivateKey: Key;
  vaultPublicKey: string;
  vaultEncryptedPrivateKey: string;
};

export default async ({
  accountPrivateKey,
  vaultPublicKey,
  vaultEncryptedPrivateKey,
}: Params): Promise<{ publicKey: Key; privateKey: Key }> => {
  const { data: vaultPrivateKey } = await decrypt({
    message: await readMessage({ armoredMessage: vaultEncryptedPrivateKey }),
    privateKeys: [accountPrivateKey],
  });

  const publicKey = await readKey({ armoredKey: vaultPublicKey });
  const privateKey = await readKey({ armoredKey: vaultPrivateKey });

  return { publicKey, privateKey };
};
