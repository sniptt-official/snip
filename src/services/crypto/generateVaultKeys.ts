import {
  EllipticCurveName,
  generateKey,
  encrypt,
  createMessage,
  Key,
} from 'openpgp';

type Params = {
  accountEmail: string;
  accountName: string;
  accountPublicKey: Key;
  accountPrivateKey: Key;
  curve: EllipticCurveName;
};

type Response = {
  publicKey: string;
  encryptedPrivateKey: string;
};

export default async (params: Params): Promise<Response> => {
  const {
    accountEmail: email,
    accountName: name,
    accountPublicKey,
    curve,
  } = params;

  const vaultKeyPair = await generateKey({
    type: 'ecc',
    curve,
    userIDs: [{ email, name }],
    // Passphrase not used as vault private keys will be
    // encrypted as messages with members' public keys.
  });

  const vaultEncryptedPrivateKey = await encrypt({
    message: await createMessage({ text: vaultKeyPair.privateKeyArmored }),
    publicKeys: [accountPublicKey],
    // NOTE: Think about adding signature verification. Might be
    // a bit problematic given vault owners can transfer ownership.
    // privateKeys: [accountPrivateKey],
  });

  return {
    publicKey: vaultKeyPair.publicKeyArmored,
    encryptedPrivateKey: vaultEncryptedPrivateKey,
  };
};
