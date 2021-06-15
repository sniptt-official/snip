import anyTest, { TestInterface } from 'ava';
import { randomBytes } from 'crypto';
import { internet, name, random } from 'faker';
import { createMessage, encrypt, generateKey, readKey, Key } from 'openpgp';

import crypto from '../../../src/services/crypto';

type TextContext = {
  content: Buffer;
  encryptedContent: string;
  vaultPublicKey: Key;
  vaultPrivateKey: Key;
};

const test = anyTest as TestInterface<TextContext>;

test.beforeEach(async (t) => {
  const userId = { email: internet.email(), name: name.firstName() };
  const curve = random.arrayElement(crypto.constants.ECC_CURVES);

  const vaultKeyPair = await generateKey({
    type: 'ecc',
    curve,
    userIDs: [userId],
  });

  t.context.content = randomBytes(64);
  t.context.vaultPublicKey = await readKey({
    armoredKey: vaultKeyPair.publicKeyArmored,
  });
  t.context.vaultPrivateKey = await readKey({
    armoredKey: vaultKeyPair.privateKeyArmored,
  });

  t.context.encryptedContent = await encrypt({
    message: await createMessage({ binary: t.context.content }),
    publicKeys: [t.context.vaultPublicKey],
  });
});

test('decrypt binary using vault keys', async (t) => {
  const params = {
    ...t.context,
  };

  const content = await crypto.decryptBinaryWithVaultKeys(params);

  t.deepEqual(content, t.context.content);
});

test('fail to decrypt binary using invalid vault keys', async (t) => {
  const vaultKeyPair = await generateKey({
    type: 'ecc',
    userIDs: [{ email: internet.email(), name: name.firstName() }],
  });

  const params = {
    ...t.context,
    // TODO: Use for signature verification?
    // vaultPublicKey: await readKey(),
    vaultPrivateKey: await readKey({
      armoredKey: vaultKeyPair.publicKeyArmored,
    }),
  };

  await t.throwsAsync(crypto.decryptBinaryWithVaultKeys(params), {
    instanceOf: Error,
    message: 'Error decrypting message: Session key decryption failed.',
  });
});
