
import client from '../httpClient'

type SendEmailVerificationCodeParams = {
  Email: string;
};

const sendEmailVerificationCode = async (params: SendEmailVerificationCodeParams) => {
  const body = {
    ...params,
  }

  await client
  .post('sendEmailVerificationCode', {json: body})
  .json<Array<unknown>>()
}

export default sendEmailVerificationCode
