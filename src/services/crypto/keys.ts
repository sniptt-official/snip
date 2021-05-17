import * as openpgp from 'openpgp'

export const getUserPublicKeys = async ({
  armouredPublicKeys,
}: {
  armouredPublicKeys: Array<string>;
}) => Promise.all(
  armouredPublicKeys.map(async armouredPublicKey => {
    return openpgp.readKey({armoredKey: armouredPublicKey})
  })
)

export const getUserPrivateKeys = async ({armouredPrivateKeys, passphrase}: {
  armouredPrivateKeys: Array<string>;
  passphrase?: string;
}) => Promise.all(
  armouredPrivateKeys.map(async armouredPrivateKey => {
    const privateKey = await openpgp.readKey({
      armoredKey: armouredPrivateKey,
    })

    if (passphrase) {
      await privateKey.decrypt(passphrase)
    }

    return privateKey
  })
)
