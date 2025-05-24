import axios from 'axios';

/**
 * Create and configure HTTP client for Azure DevOps API
 * @param {Object} config 
 * @returns {import('axios').AxiosInstance}
 */
export function createHttpClient(config) {
  return axios.create({
    baseURL: `${config.organizationUrl}`,
    auth: {
      username: '',
      password: config.personalAccessToken
    },
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json;api-version=7.1'
    },
    timeout: config.httpTimeout || 120000 // Use configurable timeout, default 2 minutes
  });
}