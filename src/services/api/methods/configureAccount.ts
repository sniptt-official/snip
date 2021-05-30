import { Asserts, object, string } from 'yup';

import { Header, ProtectedApiCallOpts } from '../types';
import client from '../httpClient';
import { validateResponseAttributes } from '../validators';

type Params = {
  AccountName: string;
  AccountEncryptionKeySalt: string;
  AccountPublicKey: string;
  AccountEncryptedPrivateKey: string;
  PersonalVaultPublicKey: string;
  PersonalVaultEncryptedPrivateKey: string;
};

const ResponseSchema = object({
  AccountId: string().required(),
  PersonalVaultId: string().required(),
}).required();

export default async (
  params: Params,
  opts: ProtectedApiCallOpts,
): Promise<Asserts<typeof ResponseSchema>> => {
  const response = await client
    .post('configureAccount', {
      headers: {
        [Header.ApiKey]: opts.ApiKey,
      },
      json: params,
    })
    .json();

  return validateResponseAttributes(response, ResponseSchema);
};
