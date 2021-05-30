import { decrypt, Key, readMessage } from 'openpgp';

type Params = {
  encryptedContent: string;
  vaultPublicKey: Key;
  vaultPrivateKey: Key;
};

export default async ({
  encryptedContent,
  vaultPublicKey,
  vaultPrivateKey,
}: Params): Promise<Buffer> => {
  const { data: binary } = await decrypt({
    message: await readMessage({ armoredMessage: encryptedContent }),
    privateKeys: [vaultPrivateKey],
    // NOTE: Below only used for signature verification.
    // Can be used later to verify the signature(s).
    publicKeys: [vaultPublicKey],
    // TODO: Implement as an option.
    // expectSigned: true,
    format: 'binary',
  });

  return Buffer.from(binary);
};
