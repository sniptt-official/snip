import anyTest, { TestInterface } from 'ava';
import { internet, name, random } from 'faker';
import { readKey, readMessage, decrypt } from 'openpgp';

import crypto from '../../../src/services/crypto';

type TextContext = {};

const test = anyTest as TestInterface<TextContext>;

test('generate account and personal vault keys', async (t) => {
  const params = {
    accountEmail: internet.email(),
    accountName: name.firstName(),
    accountEncryptionKey: random.alphaNumeric(64),
    curve: random.arrayElement(crypto.constants.ECC_CURVES),
  };

  const userId = `${params.accountName} <${params.accountEmail}>`;

  const { accountKeyPair, personalVaultKeyPair } =
    await crypto.generateAccountConfigurationKeys(params);

  const accountPublicKey = await readKey({
    armoredKey: accountKeyPair.publicKey,
  });
  const accountEncryptedPrivateKey = await readMessage({
    armoredMessage: accountKeyPair.encryptedPrivateKey,
  });
  const accountPrivateKey = await readKey({
    armoredKey: (
      await decrypt({
        message: accountEncryptedPrivateKey,
        passwords: [params.accountEncryptionKey],
      })
    ).data,
  });

  t.deepEqual(accountPublicKey.getUserIDs(), [userId]);
  t.deepEqual(accountPrivateKey.getUserIDs(), [userId]);

  const personalVaultPublicKey = await readKey({
    armoredKey: personalVaultKeyPair.publicKey,
  });
  const personalVaultEncryptedPrivateKey = await readMessage({
    armoredMessage: personalVaultKeyPair.encryptedPrivateKey,
  });
  const personalVaultPrivateKey = await readKey({
    armoredKey: (
      await decrypt({
        message: personalVaultEncryptedPrivateKey,
        privateKeys: [accountPrivateKey],
      })
    ).data,
  });

  t.deepEqual(personalVaultPublicKey.getUserIDs(), [userId]);
  t.deepEqual(personalVaultPrivateKey.getUserIDs(), [userId]);
});
