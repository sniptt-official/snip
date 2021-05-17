
import {Header, SnipttOpts} from '../types'
import client from '../httpClient'

type ConfigureAccountParams = {
  AccountName: string;
  AccountEncryptionKeySalt: string;
  AccountPublicKey: string;
  AccountEncryptedPrivateKey: string;
  PersonalWorkspacePublicKey: string;
  PersonalWorkspaceEncryptedPrivateKey: string;
};

const configureAccount = async (params: ConfigureAccountParams, opts: SnipttOpts) => {
  const body = {
    ...params,
  }

  await client
  .post('configureAccount', {
    headers: {
      [Header.ApiKey]: opts.ApiKey,
    },
    json: body,
  })
  .json()
}

export default configureAccount
