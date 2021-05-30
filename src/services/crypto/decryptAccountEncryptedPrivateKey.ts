import { decrypt, readKey, readMessage, Key } from 'openpgp';

type Params = {
  accountPublicKey: string;
  accountEncryptedPrivateKey: string;
  accountEncryptionKey: string;
};

export default async ({
  accountPublicKey,
  accountEncryptedPrivateKey,
  accountEncryptionKey,
}: Params): Promise<{ publicKey: Key; privateKey: Key }> => {
  const { data: privateKey } = await decrypt({
    message: await readMessage({ armoredMessage: accountEncryptedPrivateKey }),
    passwords: [accountEncryptionKey],
  });

  return {
    publicKey: await readKey({ armoredKey: accountPublicKey }),
    privateKey: await readKey({ armoredKey: privateKey }),
  };
};
