import {EllipticCurveName, encrypt, generateKey, Message, readKey} from 'openpgp'

type Params = {
  email: string;
  name: string;
  curve: EllipticCurveName;
  accountPublicKey: string;
}

type Response = {
  publicKey: string;
  encryptedPrivateKey: string;
}

const generateWorkspaceKeys = async (params: Params): Promise<Response> => {
  const {email, name, curve} = params

  const workspaceKeyPair = await generateKey({
    type: 'ecc',
    curve,
    userIds: [{email, name}],
    // Passphrase not used as workspace private keys will be
    // encrypted as messages with multiple public keys.
  })

  const workspaceEncryptedPrivateKey = await encrypt({
    message: Message.fromText(workspaceKeyPair.privateKeyArmored),
    publicKeys: [
      await readKey({armoredKey: params.accountPublicKey}),
    ],
  })

  return {
    publicKey: workspaceKeyPair.publicKeyArmored,
    encryptedPrivateKey: workspaceEncryptedPrivateKey,
  }
}

export default generateWorkspaceKeys
