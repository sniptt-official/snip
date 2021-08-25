import {
  EllipticCurveName,
  generateKey,
  encrypt,
  createMessage,
} from 'openpgp';

type Params = {
  accountEmail: string;
  accountName: string;
  encryptionKey: string;
  curve: EllipticCurveName;
};

type Response = {
  publicKey: string;
  privateKey: string;
  encryptedPrivateKey: string;
};

export default async (params: Params): Promise<Response> => {
  const {
    accountEmail: email,
    accountName: name,
    encryptionKey,
    curve,
  } = params;

  const keyPair = await generateKey({
    type: 'ecc',
    curve,
    userIDs: [{ email, name }],
    // Passphrase not used as vault private keys will be
    // encrypted as messages with members' public keys.
  });

  const encryptedPrivateKey = await encrypt({
    message: await createMessage({ text: keyPair.privateKeyArmored }),
    passwords: [encryptionKey],
  });

  return {
    publicKey: keyPair.publicKeyArmored,
    privateKey: keyPair.privateKeyArmored,
    encryptedPrivateKey,
  };
};
