
import {object, string} from 'yup'
import client from '../httpClient'
import {Header, SnipttOpts} from '../types'
import {validateAttributes} from '../validators'

type AddSecretParams = {
  SecretEncryptedContent: string;
  SecretName: string;
  WorkspaceId: string;
};

// TODO: Update schema.
const ResponseSchema = object({
  SecretId: string().length(22).required(),
}).required()

const addSecret = async (params: AddSecretParams, opts: SnipttOpts) => {
  if (!opts.ApiKey) {
    throw new Error('missing api key')
  }

  const body = {
    ...params,
  }

  const response = await client
  .post('addSecret', {
    headers: {
      [Header.ApiKey]: opts.ApiKey,
    },
    json: body,
  })
  .json()

  return validateAttributes(response, ResponseSchema)
}

export default addSecret
