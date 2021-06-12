import { randomBytes, pbkdf2Sync } from 'crypto';

type Params = {
  passphrase?: string;
  keySize?: number;
  salt?: Buffer;
  encoding?: BufferEncoding;
};

type Response = {
  encryptionKeySalt: string;
  encryptionKey: string;
};

const deriveEncryptionKey = (params: Params): Response => {
  const {
    passphrase = randomBytes(64).toString('base64'),
    keySize = 64,
    salt = randomBytes(64),
    encoding = 'base64',
  } = params;

  const rounds = 100_000;
  const digest = 'sha512';

  const key = pbkdf2Sync(passphrase, salt, rounds, keySize, digest);

  return {
    encryptionKeySalt: salt.toString(encoding),
    encryptionKey: Buffer.concat([salt, key]).toString(encoding),
  };
};

export default deriveEncryptionKey;
