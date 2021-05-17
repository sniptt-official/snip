import client from '../httpClient'
import {Header, SnipttOpts} from '../types'

type AddMemberToWorkspaceParams = {
  AccountEmail: string;
  WorkspaceId: string;
  WorkspaceEncryptedPrivateKey: string;
};

const addMemberToWorkspace = async (params: AddMemberToWorkspaceParams, opts: SnipttOpts) => {
  if (!opts.ApiKey) {
    throw new Error('missing api key')
  }

  const body = {
    ...params,
  }

  await client
  .post('addMemberToWorkspace', {
    headers: {
      [Header.ApiKey]: opts.ApiKey,
    },
    json: body,
  })
  .json()
}

export default addMemberToWorkspace
