
import {object, string} from 'yup'
import client from '../httpClient'
import {validateAttributes} from '../validators'

type CreateApiKeyParams = {
  // Email OTP verification code.
  Code: string;
  // Device name. Defaults to os.hostname().
  DeviceName: string;
  // User's email address.
  Email: string;
};

const ResponseSchema = object({
  ApiKey: string().required(),
  AccountId: string().required(),
  PersonalWorkspaceId: string().required(),
  AccountPublicKey: string(),
  AccountEncryptedPrivateKey: string(),
  AccountEncryptionKeySalt: string(),
  PersonalWorkspacePublicKey: string(),
  PersonalWorkspaceEncryptedPrivateKey: string(),
}).required()

const createApiKey = async (params: CreateApiKeyParams) => {
  const body = {
    ...params,
  }

  const response = await client
  .post('createApiKey', {json: body})
  .json()

  return validateAttributes(response, ResponseSchema)
}

export default createApiKey
