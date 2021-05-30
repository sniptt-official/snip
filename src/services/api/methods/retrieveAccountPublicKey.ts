import { Asserts, object, string } from 'yup';

import client from '../httpClient';
import { Header, ProtectedApiCallOpts } from '../types';
import { validateResponseAttributes } from '../validators';

type Params = {
  AccountEmail: string;
};

const ResponseSchema = object({
  AccountPublicKey: string().required(),
}).required();

export default async (
  params: Params,
  opts: ProtectedApiCallOpts,
): Promise<Asserts<typeof ResponseSchema>> => {
  const response = await client
    .post('retrieveAccountPublicKey', {
      headers: {
        [Header.ApiKey]: opts.ApiKey,
      },
      json: params,
    })
    .json();

  return validateResponseAttributes(response, ResponseSchema);
};
