import {
  EllipticCurveName,
  generateKey,
  readKey,
  encrypt,
  createMessage,
} from 'openpgp';

type Params = {
  accountEmail: string;
  accountName: string;
  accountEncryptionKey: string;
  curve: EllipticCurveName;
};

type Response = {
  accountKeyPair: {
    publicKey: string;
    encryptedPrivateKey: string;
  };
  personalVaultKeyPair: {
    publicKey: string;
    encryptedPrivateKey: string;
  };
};

const generateAccountConfigurationKeys = async (
  params: Params,
): Promise<Response> => {
  const {
    accountEmail: email,
    accountName: name,
    accountEncryptionKey,
    curve,
  } = params;

  const accountKeyPair = await generateKey({
    type: 'ecc',
    curve,
    userIDs: [{ email, name }],
    // Passphrase not used as account private keys will be
    // encrypted as messages with encryption keys created
    // using a scrypt or pbkdf2 Key Derivation Function.
  });

  const accountEncryptedPrivateKey = await encrypt({
    message: await createMessage({ text: accountKeyPair.privateKeyArmored }),
    passwords: [accountEncryptionKey],
  });

  const personalVaultKeyPair = await generateKey({
    type: 'ecc',
    curve,
    userIDs: [{ email, name }],
    // Passphrase not used as workspace private keys will be
    // encrypted as messages with multiple public keys.
  });

  const personalVaultEncryptedPrivateKey = await encrypt({
    message: await createMessage({
      text: personalVaultKeyPair.privateKeyArmored,
    }),
    publicKeys: [
      await readKey({ armoredKey: accountKeyPair.publicKeyArmored }),
    ],
    // NOTE: Think about adding signature verification. Might be
    // a bit problematic given vault owners can transfer ownership.
    // privateKeys: [
    //   await readKey({ armoredKey: accountKeyPair.privateKeyArmored }),
    // ],
  });

  return {
    accountKeyPair: {
      publicKey: accountKeyPair.publicKeyArmored,
      encryptedPrivateKey: accountEncryptedPrivateKey,
    },
    personalVaultKeyPair: {
      publicKey: personalVaultKeyPair.publicKeyArmored,
      encryptedPrivateKey: personalVaultEncryptedPrivateKey,
    },
  };
};

export default generateAccountConfigurationKeys;
