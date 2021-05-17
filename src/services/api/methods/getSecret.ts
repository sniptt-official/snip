
import {object, string} from 'yup'
import client from '../httpClient'
import {Header, SnipttOpts} from '../types'
import {validateAttributes} from '../validators'

type GetSecretParams = {
  SecretName: string;
  WorkspaceId: string;
};

const ResponseSchema = object({
  SecretId: string().length(22).required(),
  SecretEncryptedContent: string().required(),
  WorkspaceEncryptedPrivateKey: string().required(),
}).required()

const getSecret = async (params: GetSecretParams, opts: SnipttOpts) => {
  if (!opts.ApiKey) {
    throw new Error('missing api key')
  }

  const body = {
    ...params,
  }

  const response = await client
  .post('getSecret', {
    headers: {
      [Header.ApiKey]: opts.ApiKey,
    },
    json: body,
  })
  .json()

  return validateAttributes(response, ResponseSchema)
}

export default getSecret
