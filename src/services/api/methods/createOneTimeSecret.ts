import { Asserts, object, string } from 'yup';

import client from '../httpClient';
import { Header, ProtectedApiCallOpts } from '../types';
import { validateResponseAttributes } from '../validators';

type Params = {
  OneTimeSecretPublicKey: string;
  OneTimeSecretEncryptedPrivateKey: string;
  OneTimeSecretEncryptedContent: string;
  OneTimeSecretContentType: 'Text' | 'File';
};

const ResponseSchema = object({
  OneTimeSecretId: string().required(),
}).required();

export default async (
  params: Params,
  opts: ProtectedApiCallOpts,
): Promise<Asserts<typeof ResponseSchema>> => {
  const response = await client
    .post('createOneTimeSecret', {
      headers: {
        [Header.ApiKey]: opts.ApiKey,
      },
      json: params,
    })
    .json();

  return validateResponseAttributes(response, ResponseSchema);
};
