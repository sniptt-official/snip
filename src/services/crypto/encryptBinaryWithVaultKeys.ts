import { createMessage, encrypt, Key } from 'openpgp';

type Params = {
  binary: Buffer;
  vaultPublicKey: Key;
  vaultPrivateKey: Key;
};

export default async ({
  binary,
  vaultPublicKey,
  vaultPrivateKey,
}: Params): Promise<string> => {
  const encryptedContent = await encrypt({
    message: await createMessage({ binary }),
    publicKeys: [vaultPublicKey],
    // NOTE: Below only used for embedding a signature.
    // Can be used later to verify the signature(s).
    privateKeys: [vaultPrivateKey],
  });

  return encryptedContent;
};
