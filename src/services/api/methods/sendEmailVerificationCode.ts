import client from '../httpClient';

type Params = {
  Email: string;
};

export default async (params: Params): Promise<void> => {
  await client.post('sendEmailVerificationCode', { json: params });
};
