import anyTest, { TestInterface } from 'ava';
import { randomBytes } from 'crypto';
import { internet, name, random } from 'faker';
import { createMessage, encrypt, generateKey, readKey } from 'openpgp';

import crypto from '../../../src/services/crypto';

type TextContext = {
  accountPublicKey: string;
  accountPrivateKey: string;
  accountEncryptedPrivateKey: string;
  accountEncryptionKey: string;
};

const test = anyTest as TestInterface<TextContext>;

test.beforeEach(async (t) => {
  const userId = { email: internet.email(), name: name.firstName() };
  const curve = random.arrayElement(crypto.constants.ECC_CURVES);

  const accountKeyPair = await generateKey({
    type: 'ecc',
    curve,
    userIDs: [userId],
  });

  t.context.accountEncryptionKey = randomBytes(72).toString('base64');
  t.context.accountPublicKey = accountKeyPair.publicKeyArmored;
  t.context.accountPrivateKey = accountKeyPair.privateKeyArmored;

  t.context.accountEncryptedPrivateKey = await encrypt({
    message: await createMessage({ text: accountKeyPair.privateKeyArmored }),
    passwords: [t.context.accountEncryptionKey],
  });
});

test('decrypt account keys using encryption key', async (t) => {
  const params = {
    ...t.context,
  };

  const accountKeyPair = await crypto.decryptAccountEncryptedPrivateKey(params);

  t.deepEqual(
    accountKeyPair.publicKey,
    await readKey({ armoredKey: params.accountPublicKey }),
  );
  t.deepEqual(
    accountKeyPair.privateKey,
    await readKey({ armoredKey: params.accountPrivateKey }),
  );
});

test('fail to decrypt account keys using invalid encryption key', async (t) => {
  const params = {
    ...t.context,
    accountEncryptionKey: randomBytes(72).toString('base64'),
  };

  await t.throwsAsync(crypto.decryptAccountEncryptedPrivateKey(params), {
    instanceOf: Error,
    message: 'Error decrypting message: Session key decryption failed.',
  });
});
