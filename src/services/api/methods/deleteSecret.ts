import client from '../httpClient';
import { Header, ProtectedApiCallOpts } from '../types';

type Params = {
  SecretName: string;
  VaultId: string;
};

export default async (
  params: Params,
  opts: ProtectedApiCallOpts,
): Promise<void> => {
  await client
    .post('deleteSecret', {
      headers: {
        [Header.ApiKey]: opts.ApiKey,
      },
      json: params,
    })
    .json();
};
