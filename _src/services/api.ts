import Sniptt from '@sniptt/snip-sdk-js';

const { SNIPTT_BASE_PATH = 'https://api.sniptt.com' } = process.env;

const api = new Sniptt({
  basePath: SNIPTT_BASE_PATH,
});

export default api;
