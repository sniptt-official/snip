import { Asserts, object, string } from 'yup';

import { Header, ProtectedApiCallOpts } from '../types';
import client from '../httpClient';
import { validateResponseAttributes } from '../validators';

type Params = {
  VaultName: string;
  VaultPublicKey: string;
  VaultEncryptedPrivateKey: string;
};

const ResponseSchema = object({
  VaultId: string().required(),
}).required();

export default async (
  params: Params,
  opts: ProtectedApiCallOpts,
): Promise<Asserts<typeof ResponseSchema>> => {
  const response = await client
    .post('createVault', {
      headers: {
        [Header.ApiKey]: opts.ApiKey,
      },
      json: params,
    })
    .json();

  return validateResponseAttributes(response, ResponseSchema);
};
