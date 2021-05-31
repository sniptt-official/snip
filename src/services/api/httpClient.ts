import got from 'got';

const { BASE_URI = 'api.beta.snipt.io' } = process.env;

const httpClient = got.extend({
  prefixUrl: `https://${BASE_URI}/v2`,
  // hooks: {
  //   beforeError: [
  //     (error: RequestError) => {
  //       // const errorDetails = error.response?.body;

  //       // console.error(errorDetails)

  //       return error;
  //     },
  //   ],
  // },
});

export default httpClient;
