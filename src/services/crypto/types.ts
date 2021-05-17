interface BaseOptions {
  armouredPublicKeys: Array<string>;
  armouredPrivateKeys: Array<string>;
  passphrase?: string;
}

export interface EncryptBinaryOptions extends BaseOptions {
  cleartextBinary: Buffer;
}

export interface DecryptBinaryOptions extends BaseOptions {
  encryptedBinary: Buffer;
}

export interface EncryptContentOptions {
  content: string;
  armouredPublicKeys: Array<string>;
}

export interface DecryptContentOptions {
  content: string;
  armouredPrivateKey: string;
  passphrase?: string;
}
