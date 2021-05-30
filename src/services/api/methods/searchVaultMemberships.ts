import { Asserts, object, string } from 'yup';

import client from '../httpClient';
import { Header, ProtectedApiCallOpts } from '../types';
import { validateResponseAttributes } from '../validators';

type Params = {
  VaultName: string;
};

const ResponseSchema = object({
  Role: string().required(),
  VaultId: string().required(),
  VaultName: string().required(),
  VaultOwnerAccountId: string().required(),
  VaultOwnerAccountEmail: string().required(),
  VaultOwnerAccountName: string().required(),
}).required();

export default async (
  params: Params,
  opts: ProtectedApiCallOpts,
): Promise<Array<Asserts<typeof ResponseSchema>>> => {
  const response = await client
    .post('searchVaultMemberships', {
      headers: {
        [Header.ApiKey]: opts.ApiKey,
      },
      json: params,
    })
    .json<Array<unknown>>();

  return Promise.all(
    response.map((item) => validateResponseAttributes(item, ResponseSchema)),
  );
};
