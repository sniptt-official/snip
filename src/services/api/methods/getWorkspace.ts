
import {object, string} from 'yup'
import client from '../httpClient'
import {Header, SnipttOpts} from '../types'
import {validateAttributes} from '../validators'

type GetWorkspaceParams = {
  WorkspaceId: string;
};

const ResponseSchema = object({
  WorkspaceName: string().required(),
  WorkspacePublicKey: string().required(),
  WorkspaceEncryptedPrivateKey: string().required(),
}).required()

const getWorkspace = async (params: GetWorkspaceParams, opts: SnipttOpts) => {
  if (!opts.ApiKey) {
    throw new Error('missing api key')
  }

  const body = {
    ...params,
  }

  const response = await client
  .post('getWorkspace', {
    headers: {
      [Header.ApiKey]: opts.ApiKey,
    },
    json: body,
  })
  .json<Array<unknown>>()

  return validateAttributes(response, ResponseSchema)
}

export default getWorkspace
