
import {object, string} from 'yup'
import client from '../httpClient'
import {Header, SnipttOpts} from '../types'
import {validateAttributes} from '../validators'

type GetAccountParams = {
  AccountEmail: string;
};

const ResponseSchema = object({
  AccountId: string().required(),
  AccountPublicKey: string(),
}).required()

const getAccount = async (params: GetAccountParams, opts: SnipttOpts) => {
  if (!opts.ApiKey) {
    throw new Error('missing api key')
  }

  const body = {
    ...params,
  }

  const response = await client
  .post('getAccount', {
    headers: {
      [Header.ApiKey]: opts.ApiKey,
    },
    json: body,
  })
  .json<Array<unknown>>()

  return validateAttributes(response, ResponseSchema)
}

export default getAccount
