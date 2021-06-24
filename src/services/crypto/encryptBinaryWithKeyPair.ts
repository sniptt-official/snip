import { createMessage, encrypt, readKey, readPrivateKey } from 'openpgp';

type Params = {
  binary: Buffer;
  publicKey: string;
  privateKey: string;
};

export default async ({
  binary,
  publicKey,
  privateKey,
}: Params): Promise<string> => {
  const encryptedContent = await encrypt({
    message: await createMessage({ binary }),
    encryptionKeys: [await readKey({ armoredKey: publicKey })],
    // NOTE: Below only used for embedding a signature.
    // Can be used later to verify the signature(s).
    signingKeys: [await readPrivateKey({ armoredKey: privateKey })],
  });

  return encryptedContent;
};
