import client from '../httpClient';
import { Header, ProtectedApiCallOpts } from '../types';

type Params = {
  VaultId: string;
  VaultEncryptedPrivateKey: string;
  AccountEmail: string;
};

export default async (
  params: Params,
  opts: ProtectedApiCallOpts,
): Promise<void> => {
  await client
    .post('removeMemberFromVault', {
      headers: {
        [Header.ApiKey]: opts.ApiKey,
      },
      json: params,
    })
    .json();
};
