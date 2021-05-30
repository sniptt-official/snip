import { Asserts, object, string } from 'yup';

import client from '../httpClient';
import { Header, ProtectedApiCallOpts } from '../types';
import { validateResponseAttributes } from '../validators';

type Params = {
  VaultId: string;
};

const ResponseSchema = object({
  VaultPublicKey: string().required(),
  VaultEncryptedPrivateKey: string().required(),
}).required();

export default async (
  params: Params,
  opts: ProtectedApiCallOpts,
): Promise<Asserts<typeof ResponseSchema>> => {
  const response = await client
    .post('retrieveVaultKeys', {
      headers: {
        [Header.ApiKey]: opts.ApiKey,
      },
      json: params,
    })
    .json<Array<unknown>>();

  return validateResponseAttributes(response, ResponseSchema);
};
