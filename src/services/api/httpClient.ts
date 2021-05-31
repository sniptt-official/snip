import got from 'got';

const { BASE_URI = 'api.sniptt.com' } = process.env;

const httpClient = got.extend({
  prefixUrl: `https://${BASE_URI}`,
});

export default httpClient;
