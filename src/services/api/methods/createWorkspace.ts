
import {object, string} from 'yup'
import client from '../httpClient'
import {Header, SnipttOpts} from '../types'
import {validateAttributes} from '../validators'

type CreateWorkspaceParams = {
  WorkspaceName: string;
  WorkspacePublicKey: string;
  WorkspaceEncryptedPrivateKey: string;
};

const ResponseSchema = object({
  WorkspaceId: string().required(),
}).required()

const createWorkspace = async (params: CreateWorkspaceParams, opts: SnipttOpts) => {
  if (!opts.ApiKey) {
    throw new Error('missing api key')
  }

  const body = {
    ...params,
  }

  const response = await client
  .post('createWorkspace', {
    headers: {
      [Header.ApiKey]: opts.ApiKey,
    },
    json: body,
  })
  .json()

  return validateAttributes(response, ResponseSchema)
}

export default createWorkspace
