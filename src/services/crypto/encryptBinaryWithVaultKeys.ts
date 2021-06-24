import { createMessage, encrypt, PrivateKey, PublicKey } from 'openpgp';

type Params = {
  binary: Buffer;
  vaultPublicKey: PublicKey;
  vaultPrivateKey: PrivateKey;
};

export default async ({
  binary,
  vaultPublicKey,
  vaultPrivateKey,
}: Params): Promise<string> => {
  const encryptedContent = await encrypt({
    message: await createMessage({ binary }),
    encryptionKeys: [vaultPublicKey],
    // NOTE: Below only used for embedding a signature.
    // Can be used later to verify the signature(s).
    signingKeys: [vaultPrivateKey],
  });

  return encryptedContent;
};
