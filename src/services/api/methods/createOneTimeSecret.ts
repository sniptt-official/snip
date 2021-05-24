
import {object, string} from 'yup'
import client from '../httpClient'
import {Header, SnipttOpts} from '../types'
import {validateAttributes} from '../validators'

type CreateOneTimeSecretParams = {
  OneTimeSecretName?: string;
  OneTimeSecretPublicKey: string;
  OneTimeSecretEncryptedPrivateKey: string;
  OneTimeSecretEncryptedContent: string;
};

// TODO: Update schema.
const ResponseSchema = object({
  OneTimeSecretId: string().length(22).required(),
}).required()

const createOneTimeSecret = async (params: CreateOneTimeSecretParams, opts: SnipttOpts) => {
  if (!opts.ApiKey) {
    throw new Error('missing api key')
  }

  const body = {
    ...params,
  }

  const response = await client
  .post('createOneTimeSecret', {
    headers: {
      [Header.ApiKey]: opts.ApiKey,
    },
    json: body,
  })
  .json()

  return validateAttributes(response, ResponseSchema)
}

export default createOneTimeSecret
