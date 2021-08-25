import {
  decrypt,
  readKey,
  readMessage,
  PublicKey,
  PrivateKey,
  readPrivateKey,
} from 'openpgp';

type Params = {
  accountPublicKey: string;
  accountEncryptedPrivateKey: string;
  accountEncryptionKey: string;
};

export default async ({
  accountPublicKey,
  accountEncryptedPrivateKey,
  accountEncryptionKey,
}: Params): Promise<{ publicKey: PublicKey; privateKey: PrivateKey }> => {
  const { data: privateKey } = await decrypt({
    message: await readMessage({ armoredMessage: accountEncryptedPrivateKey }),
    passwords: [accountEncryptionKey],
  });

  return {
    publicKey: await readKey({ armoredKey: accountPublicKey }),
    privateKey: await readPrivateKey({ armoredKey: privateKey }),
  };
};
