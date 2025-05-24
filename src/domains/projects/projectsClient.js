import { Cache } from '../../core/cache.js';

export class ProjectsClient {
  /**
   * @param {import('axios').AxiosInstance} httpClient 
   * @param {Object} config 
   */
  constructor(httpClient, config) {
    this.httpClient = httpClient;
    this.config = config;
    this.cache = new Cache(config.cacheTimeout);
  }

  /**
   * Get all projects
   * @returns {Promise<any[]>}
   */
  async getProjects() {
    const cacheKey = 'projects';
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.httpClient.get('/_apis/projects');
      const projects = response.data.value || [];
      this.cache.set(cacheKey, projects);
      return projects;
    } catch (error) {
      console.error('Failed to get projects:', error.message);
      throw new Error(`Failed to get projects: ${error.message}`);
    }
  }
}