import * as faker from 'faker'

const config = () => ({
  AccountName: faker.random.words(),
  AccountId: faker.datatype.uuid(),
  ApiKey: faker.datatype.uuid(),
  AccountPublicKey: faker.finance.ethereumAddress(),
  AccountEncryptedPrivateKey: faker.finance.ethereumAddress(),
})

const secret = () => ({
  Name: faker.random.word(),
  Value: faker.finance.ethereumAddress(),
})

const workspace = () => ({
  Id: faker.datatype.uuid(),
  Name: 'Personal Workspace',
  PublicKey: faker.finance.ethereumAddress(),
  EncryptedContent: 'encrypted_binary_message',
  EncryptedPrivateKey: 'encrypted_secret_private_key',
})

export {
  config,
  secret,
  workspace,
}
