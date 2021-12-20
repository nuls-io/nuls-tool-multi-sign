import Request from './request';
import config from '@/config';

const http = new Request({
  // baseURL: config.API_URL,
  timeout: config.timeout
});

export default http;
