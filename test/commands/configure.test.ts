import {expect, test} from '@oclif/test'
import {cli} from 'cli-ux'
import * as faker from 'faker'
import config from '../../src/services/config'
const {BASE_URI = 'api.beta.snipt.io'} = process.env
import * as mocks from '../mocks'
import * as os from 'os'

// Setup test mocks.
const mockConfig = mocks.config()
const mockWorkspace = mocks.workspace()

// Prepare params.
const params = {
  email: 'test+001@sniptt.com',
  code: faker.random.alphaNumeric(6),
}

// Setup expected API responses from api.sniptt.com.
const replies = {
  sendEmailVerificationRequest: {
    AccountId: mockConfig.AccountId,
  },
  createApiKey: {
    ApiKey: faker.finance.ethereumAddress(),
    AccountId: mockConfig.AccountId,
  },
  configureAccount: {

  },
}

let promptCalls = 0

describe('Configure Sniptt', () => {
  test
  .stub(config, 'read', () => mockConfig)
  .command(['configure'])
  // Checks to ensure the command exits with status 100.
  .exit(100)
  .it('exits with status 100 if user config already exists')

  test
  .stdout()
  .stub(config, 'write', () => async () => Promise.resolve())
  .stub(cli, 'prompt', () => async () => {
    promptCalls++

    switch (promptCalls) {
    case 1:
      return mockConfig.AccountName
    case 2:
      return Promise.resolve(params.email)
    case 3:
      return Promise.resolve(params.code)
    }
  })
  .nock(`https://${BASE_URI}/v1`,
    api => api
    .post('/sendEmailVerificationRequest', {
      Email: params.email,
    })
    .reply(200, replies.sendEmailVerificationRequest))
  .nock(`https://${BASE_URI}/v1`,
    api => api
    .post('/createApiKey', {
      Code: params.code,
      DeviceName: os.hostname(),
      Email: params.email,
    })
    .reply(200, replies.createApiKey))
  .nock(`https://${BASE_URI}/v1`,
    api => api
    .post('/configureAccount', {
      AccountEncryptedPrivateKey: mockConfig.AccountEncryptedPrivateKey,
      AccountName: mockConfig.AccountName,
      AccountPublicKey: mockConfig.AccountPublicKey,
      WorkspaceEncryptedPrivateKeyMessage: mockWorkspace.EncryptedPrivateKey,
      WorkspacePublicKey: mockWorkspace.PublicKey,
    })
    .matchHeader('x-api-key', mockConfig.ApiKey)
    .reply(200, replies.configureAccount))
  .command(['configure'])
  .it('configures new Sniptt account for given email address', ctx => {
    expect(ctx.stdout).to.contain(`Configuration written to ${ctx.config.configDir}.`)
  })
})
