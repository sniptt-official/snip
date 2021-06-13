import { Asserts, object, string } from 'yup';
import client from '../httpClient';
import { Header, ProtectedApiCallOpts } from '../types';
import { validateResponseAttributes } from '../validators';

type Params = { VaultId: string };

const ResponseSchema = object({
  Role: string().required(),
  AccountId: string().required(),
  AccountName: string().required(),
  AccountEmail: string().required(),
  AccountPublicKey: string().required(),
}).required();

export default async (
  params: Params,
  opts: ProtectedApiCallOpts,
): Promise<Array<Asserts<typeof ResponseSchema>>> => {
  const response = await client
    .post('listVaultMembers', {
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
