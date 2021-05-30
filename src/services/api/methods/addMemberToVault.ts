import client from '../httpClient';
import { Header, ProtectedApiCallOpts } from '../types';

type Params = {
  VaultId: string;
  VaultEncryptedPrivateKey: string;
  AccountEmail: string;
  Role: 'Read' | 'Admin';
};

export default async (
  params: Params,
  opts: ProtectedApiCallOpts,
): Promise<void> => {
  await client
    .post('addMemberToVault', {
      headers: {
        [Header.ApiKey]: opts.ApiKey,
      },
      json: params,
    })
    .json();
};
