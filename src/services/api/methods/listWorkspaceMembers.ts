
import {object, string} from 'yup'
import client from '../httpClient'
import {Header, SnipttOpts} from '../types'
import {validateAttributes} from '../validators'

type ListWorkspaceMembershipsParams = {
  WorkspaceId: string;
};

const ResponseSchema = object({
  Role: string().required(),
  AccountId: string().required(),
  AccountPublicKey: string().required(),
}).required()

const listWorkspaceMembers = async (params: ListWorkspaceMembershipsParams, opts: SnipttOpts) => {
  if (!opts.ApiKey) {
    throw new Error('missing api key')
  }

  const body = {
    ...params,
  }

  const response = await client
  .post('listWorkspaceMembers', {
    headers: {
      [Header.ApiKey]: opts.ApiKey,
    },
    json: body,
  })
  .json<Array<unknown>>()

  return Promise.all(response.map(item => validateAttributes(item, ResponseSchema)))
}

export default listWorkspaceMembers
