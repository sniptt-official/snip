import anyTest, { TestInterface } from 'ava';
import { randomBytes } from 'crypto';
import { internet, name, random } from 'faker';
import {
  createMessage,
  encrypt,
  generateKey,
  readKey,
  readPrivateKey,
  PrivateKey,
  PublicKey,
} from 'openpgp';

import crypto from '../../../src/services/crypto';

type TextContext = {
  accountEncryptionKey: string;
  accountPublicKey: PublicKey;
  accountPrivateKey: PrivateKey;
  vaultPublicKey: string;
  vaultPrivateKey: string;
  vaultEncryptedPrivateKey: string;
};

const test = anyTest as TestInterface<TextContext>;

test.beforeEach(async (t) => {
  t.context.accountEncryptionKey = randomBytes(64).toString('base64');

  const accountKeyPair = await generateKey({
    type: 'ecc',
    curve: random.arrayElement(crypto.constants.ECC_CURVES),
    userIDs: [{ email: internet.email(), name: name.firstName() }],
  });

  t.context.accountPublicKey = await readKey({
    armoredKey: accountKeyPair.publicKeyArmored,
  });
  t.context.accountPrivateKey = await readPrivateKey({
    armoredKey: accountKeyPair.privateKeyArmored,
  });

  const vaultKeyPair = await generateKey({
    type: 'ecc',
    curve: random.arrayElement(crypto.constants.ECC_CURVES),
    userIDs: [{ email: internet.email(), name: name.firstName() }],
  });

  const vaultEncryptedPrivateKey = await encrypt({
    message: await createMessage({ text: vaultKeyPair.privateKeyArmored }),
    encryptionKeys: [t.context.accountPublicKey],
  });

  t.context.vaultPublicKey = vaultKeyPair.publicKeyArmored;
  t.context.vaultPrivateKey = vaultKeyPair.privateKeyArmored;
  t.context.vaultEncryptedPrivateKey = vaultEncryptedPrivateKey;
});

test('decrypt vault encrypted private key', async (t) => {
  const params = {
    accountPrivateKey: t.context.accountPrivateKey,
    vaultPublicKey: t.context.vaultPublicKey,
    vaultEncryptedPrivateKey: t.context.vaultEncryptedPrivateKey,
  };

  const vaultKeyPair = await crypto.decryptVaultEncryptedPrivateKey(params);

  t.deepEqual(vaultKeyPair, {
    publicKey: await readKey({ armoredKey: t.context.vaultPublicKey }),
    privateKey: await readKey({ armoredKey: t.context.vaultPrivateKey }),
  });
});

test('fail to decrypt vault encrypted private key using invalid account private key', async (t) => {
  const accountKeyPair = await generateKey({
    type: 'ecc',
    userIDs: [{ email: internet.email(), name: name.firstName() }],
  });

  const params = {
    accountPrivateKey: await readPrivateKey({
      armoredKey: accountKeyPair.privateKeyArmored,
    }),
    vaultPublicKey: t.context.vaultPublicKey,
    vaultEncryptedPrivateKey: t.context.vaultEncryptedPrivateKey,
  };

  await t.throwsAsync(crypto.decryptVaultEncryptedPrivateKey(params), {
    instanceOf: Error,
    message: 'Error decrypting message: Session key decryption failed.',
  });
});
