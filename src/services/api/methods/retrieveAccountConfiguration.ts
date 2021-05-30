import { Asserts, object, string } from 'yup';

import client from '../httpClient';
import { Header, ProtectedApiCallOpts } from '../types';
import { validateResponseAttributes } from '../validators';

type Params = {};

const ResponseSchema = object({
  AccountId: string().required(),
  AccountEmail: string().required(),
  AccountName: string().required(),
  AccountTier: string().required(),
  AccountPublicKey: string().required(),
  AccountEncryptedPrivateKey: string().required(),
  AccountEncryptionKeySalt: string().required(),
  PersonalVaultId: string().required(),
  PersonalVaultPublicKey: string().required(),
  PersonalVaultEncryptedPrivateKey: string().required(),
}).required();

export default async (
  params: Params,
  opts: ProtectedApiCallOpts,
): Promise<Asserts<typeof ResponseSchema>> => {
  const response = await client
    .post('retrieveAccountConfiguration', {
      headers: {
        [Header.ApiKey]: opts.ApiKey,
      },
      json: params,
    })
    .json();

  return validateResponseAttributes(response, ResponseSchema);
};
