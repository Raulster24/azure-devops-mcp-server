export class ResourceHandlers {
  /**
   * @param {import('../../client/azureDevOpsClient.js').AzureDevOpsClient} client 
   */
  constructor(client) {
    this.client = client;
  }

  /**
   * Handle list resources request
   * @returns {Promise<Object>}
   */
  async handleListResources() {
    console.error("📋 ListResources handler called");
    try {
      const projects = await this.client.getProjects();
      const resources = projects.flatMap(project => [
        {
          uri: `azdo://projects/${project.name}`,
          mimeType: "application/json",
          name: `Project: ${project.name}`,
          description: `Azure DevOps project information`
        },
        {
          uri: `azdo://wikis/${project.name}`,
          mimeType: "application/json",
          name: `Wikis in ${project.name}`,
          description: `Wiki pages and documentation`
        },
        {
          uri: `azdo://testplans/${project.name}`,
          mimeType: "application/json",
          name: `Test Plans in ${project.name}`,
          description: `Test plans and test cases`
        },
        {
          uri: `azdo://workitems/${project.name}/recent`,
          mimeType: "application/json",
          name: `Recent Work Items in ${project.name}`,
          description: `Recently updated work items`
        }
      ]);

      return { resources };
    } catch (error) {
      console.error("❌ ListResources failed:", error);
      console.error('Error listing resources:', error);
      return { resources: [] };
    }
  }

  /**
   * Handle read resource request
   * @param {Object} request 
   * @returns {Promise<Object>}
   */
  async handleReadResource(request) {
    const { uri } = request.params;
    const urlParts = uri.replace('azdo://', '').split('/');
    
    try {
      if (urlParts[0] === 'projects' && urlParts[1]) {
        const projects = await this.client.getProjects();
        const project = projects.find(p => p.name === urlParts[1]);
        return {
          contents: [{
            uri,
            mimeType: "application/json",
            text: JSON.stringify(project, null, 2)
          }]
        };
      }

      if (urlParts[0] === 'wikis' && urlParts[1]) {
        const wikis = await this.client.getWikis(urlParts[1]);
        return {
          contents: [{
            uri,
            mimeType: "application/json",
            text: JSON.stringify(wikis, null, 2)
          }]
        };
      }

      if (urlParts[0] === 'testplans' && urlParts[1]) {
        const testPlans = await this.client.getTestPlans(urlParts[1]);
        return {
          contents: [{
            uri,
            mimeType: "application/json",
            text: JSON.stringify(testPlans, null, 2)
          }]
        };
      }

      if (urlParts[0] === 'workitems' && urlParts[1] && urlParts[2] === 'recent') {
        const workItems = await this.client.getWorkItems(urlParts[1]);
        return {
          contents: [{
            uri,
            mimeType: "application/json",
            text: JSON.stringify(workItems, null, 2)
          }]
        };
      }

      throw new Error(`Unknown resource: ${uri}`);
    } catch (error) {
      console.error(`Error reading resource ${uri}:`, error);
      throw new Error(`Failed to read resource: ${error.message}`);
    }
  }
}