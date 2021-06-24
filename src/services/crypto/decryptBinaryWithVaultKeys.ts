import { decrypt, PrivateKey, PublicKey, readMessage } from 'openpgp';

type Params = {
  encryptedContent: string;
  vaultPublicKey: PublicKey;
  vaultPrivateKey: PrivateKey;
};

export default async ({
  encryptedContent,
  vaultPublicKey,
  vaultPrivateKey,
}: Params): Promise<Buffer> => {
  const { data: binary } = await decrypt({
    message: await readMessage({ armoredMessage: encryptedContent }),
    decryptionKeys: [vaultPrivateKey],
    // NOTE: Below only used for signature verification.
    // Can be used later to verify the signature(s).
    verificationKeys: [vaultPublicKey],
    // TODO: Implement as an option.
    // expectSigned: true,
    format: 'binary',
  });

  return Buffer.from(binary);
};
