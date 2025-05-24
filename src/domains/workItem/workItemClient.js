import { Cache } from '../../core/cache.js';

export class WorkItemClient {
  /**
   * @param {import('axios').AxiosInstance} httpClient 
   * @param {Object} config 
   */
  constructor(httpClient, config) {
    this.httpClient = httpClient;
    this.config = config;
    this.workItemCache = new Cache(config.cacheTimeout);
  }

  /**
   * Get work items
   * @param {string} project 
   * @param {string} [wiql] 
   * @returns {Promise<any[]>}
   */
  async getWorkItems(project, wiql) {
    const cacheKey = `work_items_${project}_${wiql || 'default'}`;
    const cached = this.workItemCache.get(cacheKey);
    if (cached) return cached;

    try {
      const query = wiql || `
        SELECT [System.Id], [System.Title], [System.WorkItemType], [System.State], [System.AssignedTo]
        FROM WorkItems
        WHERE [System.TeamProject] = '${project}'
        AND [System.State] <> 'Closed'
        ORDER BY [System.ChangedDate] DESC
      `;

      const queryResponse = await this.httpClient.post(
        `/${encodeURIComponent(project)}/_apis/wit/wiql`,
        { query }
      );

      const workItemIds = queryResponse.data.workItems?.map(wi => wi.id) || [];
      
      if (workItemIds.length === 0) {
        this.workItemCache.set(cacheKey, []);
        return [];
      }

      const workItemsResponse = await this.httpClient.get(
        `/${encodeURIComponent(project)}/_apis/wit/workitems?ids=${workItemIds.slice(0, 100).join(',')}&$expand=relations`
      );

      const workItems = workItemsResponse.data.value || [];
      this.workItemCache.set(cacheKey, workItems);
      return workItems;
    } catch (error) {
      console.error(`Failed to get work items for project ${project}:`, error.message);
      return [];
    }
  }

  /**
   * Search work items
   * @param {string} project 
   * @param {string} searchText 
   * @returns {Promise<any[]>}
   */
  async searchWorkItems(project, searchText) {
    if (!searchText) return [];

    const query = `
      SELECT [System.Id], [System.Title], [System.WorkItemType], [System.State], [System.AssignedTo]
      FROM WorkItems
      WHERE [System.TeamProject] = '${project}'
      AND ([System.Title] CONTAINS '${searchText.replace(/'/g, "''")}' OR [System.Description] CONTAINS '${searchText.replace(/'/g, "''")}')
      ORDER BY [System.ChangedDate] DESC
    `;

    return this.getWorkItems(project, query);
  }
}