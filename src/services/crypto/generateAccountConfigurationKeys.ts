import {EllipticCurveName, generateKey, Message, readKey, encrypt} from 'openpgp'
import deriveEncryptionKey from './deriveEncryptionKey'

type Params = {
  passphrase: string;
  email: string;
  name: string;
  curve: EllipticCurveName;
}

type Response = {
  accountKeyPair: {
    encryptionKeySalt: string;
    publicKey: string;
    encryptedPrivateKey: string;
  };
  personalWorkspaceKeyPair: {
    publicKey: string;
    encryptedPrivateKey: string;
  };
}

const generateAccountConfigurationKeys = async (params: Params): Promise<Response> => {
  const {passphrase, email, name, curve} = params

  const {encryptionKeySalt, encryptionKey} = deriveEncryptionKey({passphrase})

  const accountKeyPair = await generateKey({
    type: 'ecc',
    curve,
    userIds: [{email, name}],
    // Passphrase not used as account private keys will be
    // encrypted as messages with encryption keys created
    // using a scrypt or pbkdf2 Key Derivation Function.
  })

  const accountEncryptedPrivateKey = await encrypt({
    message: Message.fromText(accountKeyPair.privateKeyArmored),
    passwords: [encryptionKey],
  })

  const personalWorkspaceKeyPair = await generateKey({
    type: 'ecc',
    curve,
    userIds: [{email, name}],
    // Passphrase not used as workspace private keys will be
    // encrypted as messages with multiple public keys.
  })

  const personalWorkspaceEncryptedPrivateKey = await encrypt({
    message: Message.fromText(personalWorkspaceKeyPair.privateKeyArmored),
    publicKeys: [
      await readKey({armoredKey: accountKeyPair.publicKeyArmored}),
    ],
  })

  return {
    accountKeyPair: {
      encryptionKeySalt,
      publicKey: accountKeyPair.publicKeyArmored,
      encryptedPrivateKey: accountEncryptedPrivateKey,
    },
    personalWorkspaceKeyPair: {
      publicKey: personalWorkspaceKeyPair.publicKeyArmored,
      encryptedPrivateKey: personalWorkspaceEncryptedPrivateKey,
    },
  }
}

export default generateAccountConfigurationKeys
