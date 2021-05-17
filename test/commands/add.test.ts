import {expect, test} from '@oclif/test'
import * as faker from 'faker'
import config from '../../src/services/config'
const {BASE_URI = 'api.beta.snipt.io'} = process.env
import * as mocks from '../mocks'

// Setup test mocks.
const mockConfig = mocks.config()
const mockWorkspace = mocks.workspace()
const mockSecret = mocks.secret()

// Setup expected API responses from api.sniptt.com.
const replies = {
  addSecret: {
    Id: faker.datatype.uuid(),
    Name: mockSecret.Name,
    WorkspaceId: mockWorkspace.Id,
  },
  findWorkspaceAddress: {
    Id: mockWorkspace.Id,
    Name: mockWorkspace.Name,
    PublicKey: mockWorkspace.PublicKey,
  },
}

describe('Add new snip', () => {
  test
  .stub(config, 'read', () => mockConfig)
  .nock(`https://${BASE_URI}/v1`,
    api => api
    .post('/findWorkspaceAddress')
    .matchHeader('x-api-key', mockConfig.ApiKey)
    .reply(200, replies.findWorkspaceAddress))
  .nock(
    `https://${BASE_URI}/v1`,
    api => api
    .post('/addSecret', {
      Name: mockSecret.Name,
      WorkspaceId: mockWorkspace.Id,
      PublicKey: mockConfig.AccountPublicKey,
      EncryptedContent: mockWorkspace.EncryptedContent,
      EncryptedPrivateKey: mockWorkspace.EncryptedPrivateKey,
    })
    .matchHeader('x-api-key', mockConfig.ApiKey)
    .reply(200, replies.addSecret)
  )
  .stdout()
  .command(['add', mockSecret.Name, '-v', mockSecret.Value])
  .it('adds new secret to default workspace', ctx => {
    expect(ctx.stdout).to.contain(`${mockSecret.Name}: ${mockSecret.Value}`)
  })
})
