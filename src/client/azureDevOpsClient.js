import { createHttpClient } from '../core/httpClient.js';
import { ProjectsClient } from '../domains/projects/projectsClient.js';
import { WikiClient } from '../domains/wiki/wikiClient.js';
import { TestPlanClient } from '../domains/testPlan/testPlanClient.js';
import { WorkItemClient } from '../domains/workItem/workItemClient.js';
import { CrossReferenceClient } from '../domains/crossReference/crossRefClient.js';

export class AzureDevOpsClient {
  /**
   * @param {Object} config 
   */
  constructor(config) {
    this.config = config;
    this.httpClient = createHttpClient(config);
    
    // Initialize domain clients
    this.projectsClient = new ProjectsClient(this.httpClient, config);
    this.wikiClient = new WikiClient(this.httpClient, config);
    this.testPlanClient = new TestPlanClient(this.httpClient, config);
    this.workItemClient = new WorkItemClient(this.httpClient, config);
    this.crossRefClient = new CrossReferenceClient(
      this.wikiClient, 
      this.testPlanClient, 
      this.workItemClient
    );
  }

  // Projects methods
  async getProjects() {
    return this.projectsClient.getProjects();
  }

  // Wiki methods - UPDATED with new approach
  async getWikis(project) {
    return this.wikiClient.getWikis(project);
  }

  async listAllWikiPages(project) {
    return this.wikiClient.listAllWikiPages(project);
  }

  async searchWikiPages(project, searchText) {
    return this.wikiClient.searchWikiPages(project, searchText);
  }

  async getWikiPageContent(project, wikiId, path) {
    return this.wikiClient.getWikiPageContent(project, wikiId, path);
  }

  async getWikiSection(project, wikiId, path, sectionTitle) {
    return this.wikiClient.getWikiSection(project, wikiId, path, sectionTitle);
  }

  async searchWikiContent(project, searchText) {
    return this.wikiClient.searchWikiContent(project, searchText);
  }

  // Legacy methods for backward compatibility
  async getWikiPages(project, wikiId) {
    return this.wikiClient.getAllWikiPages(project, wikiId);
  }

  // Test Plan methods
  async getTestPlans(project) {
    return this.testPlanClient.getTestPlans(project);
  }

  async getTestPlanDetails(project, planId) {
    return this.testPlanClient.getTestPlanDetails(project, planId);
  }

  async searchTestPlans(project, searchText) {
    return this.testPlanClient.searchTestPlans(project, searchText);
  }

  async getTestCases(project, planId, suiteId) {
    return this.testPlanClient.getTestCases(project, planId, suiteId);
  }

  // Work Item methods
  async getWorkItems(project, wiql) {
    return this.workItemClient.getWorkItems(project, wiql);
  }

  async searchWorkItems(project, searchText) {
    return this.workItemClient.searchWorkItems(project, searchText);
  }

  // Cross-reference methods
  async findRelatedItems(project, searchText) {
    return this.crossRefClient.findRelatedItems(project, searchText);
  }
}