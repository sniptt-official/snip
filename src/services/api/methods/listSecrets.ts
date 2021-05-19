
import {object, string} from 'yup'
import client from '../httpClient'
import {Header, SnipttOpts} from '../types'
import {validateAttributes} from '../validators'

type ListSecretsParams = {
  WorkspaceId: string;
};

const ResponseSchema = object({
  SecretId: string().required(),
  SecretName: string().required(),
  AccountId: string().required(),
  AccountName: string().required(),
  AccountEmail: string().required(),
}).required()

const listSecrets = async (params: ListSecretsParams, opts: SnipttOpts) => {
  if (!opts.ApiKey) {
    throw new Error('missing api key')
  }

  const body = {
    ...params,
  }

  const response = await client
  .post('listSecrets', {
    headers: {
      [Header.ApiKey]: opts.ApiKey,
    },
    json: body,
  })
  .json<Array<unknown>>()

  return Promise.all(response.map(item => validateAttributes(item, ResponseSchema)))
}

export default listSecrets
