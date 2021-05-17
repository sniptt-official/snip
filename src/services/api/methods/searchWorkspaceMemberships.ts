
import {object, string} from 'yup'
import client from '../httpClient'
import {Header, SnipttOpts} from '../types'
import {validateAttributes} from '../validators'

type SearchWorkspaceMembershipsParams = {
  WorkspaceName: string;
};

const ResponseSchema = object({
  WorkspaceId: string().required(),
  WorkspaceName: string().required(),
  Role: string().required(),
  AccountEmail: string().required(),
  AccountName: string().required(),
}).required()

const searchWorkspaceMemberships = async (params: SearchWorkspaceMembershipsParams, opts: SnipttOpts) => {
  if (!opts.ApiKey) {
    throw new Error('missing api key')
  }

  const body = {
    ...params,
  }

  const response = await client
  .post('searchWorkspaces', {
    headers: {
      [Header.ApiKey]: opts.ApiKey,
    },
    json: body,
  })
  .json<Array<unknown>>()

  return Promise.all(response.map(item => validateAttributes(item, ResponseSchema)))
}

export default searchWorkspaceMemberships
