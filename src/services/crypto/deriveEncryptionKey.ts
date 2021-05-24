import {randomBytes, pbkdf2Sync, scryptSync} from 'crypto'

type Params = {
  passphrase: string;
  kdf?: 'scrypt' | 'pbkdf2';
  keySize?: number;
  salt?: Buffer;
  encoding?: BufferEncoding;
}

type Response = {
  encryptionKeySalt: string;
  encryptionKey: string;
}

const deriveEncryptionKey = (params: Params): Response => {
  const {passphrase, kdf = 'scrypt', keySize = 64, salt = randomBytes(64), encoding = 'base64'} = params

  let key = Buffer.alloc(0)

  if (kdf === 'scrypt') {
    key = scryptSync(passphrase, salt, keySize)
  }

  if (kdf === 'pbkdf2') {
    const rounds = 100_000
    const digest = 'sha512'

    key = pbkdf2Sync(passphrase, salt, rounds, keySize, digest)
  }

  return {
    encryptionKeySalt: salt.toString(encoding),
    encryptionKey: Buffer.concat([salt, key]).toString(encoding),
  }
}

export default deriveEncryptionKey
