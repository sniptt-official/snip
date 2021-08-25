import {
  decrypt,
  readKey,
  readMessage,
  PrivateKey,
  PublicKey,
  readPrivateKey,
} from 'openpgp';

type Params = {
  accountPrivateKey: PrivateKey;
  vaultPublicKey: string;
  vaultEncryptedPrivateKey: string;
};

export default async ({
  accountPrivateKey,
  vaultPublicKey,
  vaultEncryptedPrivateKey,
}: Params): Promise<{ publicKey: PublicKey; privateKey: PrivateKey }> => {
  const { data: vaultPrivateKey } = await decrypt({
    message: await readMessage({ armoredMessage: vaultEncryptedPrivateKey }),
    decryptionKeys: [accountPrivateKey],
  });

  const publicKey = await readKey({ armoredKey: vaultPublicKey });
  const privateKey = await readPrivateKey({ armoredKey: vaultPrivateKey });

  return { publicKey, privateKey };
};
