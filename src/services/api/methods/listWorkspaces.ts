
import {object, string} from 'yup'
import client from '../httpClient'
import {Header, SnipttOpts} from '../types'
import {validateAttributes} from '../validators'

type ListWorkspacesParams = {
};

const ResponseSchema = object({
  Role: string().required(),
  WorkspaceId: string().required(),
  WorkspaceName: string().required(),
}).required()

const listWorkspaceMembers = async (params: ListWorkspacesParams, opts: SnipttOpts) => {
  if (!opts.ApiKey) {
    throw new Error('missing api key')
  }

  const body = {
    ...params,
  }

  const response = await client
  .post('listWorkspaces', {
    headers: {
      [Header.ApiKey]: opts.ApiKey,
    },
    json: body,
  })
  .json<Array<unknown>>()

  return Promise.all(response.map(item => validateAttributes(item, ResponseSchema)))
}

export default listWorkspaceMembers
