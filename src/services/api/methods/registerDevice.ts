import { Asserts, object, string, boolean } from 'yup';

import client from '../httpClient';
import { validateResponseAttributes } from '../validators';

type Params = {
  Code: string;
  DeviceName: string;
  Email: string;
};

const ResponseSchema = object({
  ApiKey: string().required(),
  AccountId: string().required(),
  DeviceId: string().required(),
  IsAccountConfigured: boolean().required(),
}).required();

export default async (
  params: Params,
): Promise<Asserts<typeof ResponseSchema>> => {
  const response = await client.post('registerDevice', { json: params }).json();
  return validateResponseAttributes(response, ResponseSchema);
};
