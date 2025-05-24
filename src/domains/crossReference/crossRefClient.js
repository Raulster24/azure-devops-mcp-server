export class CrossReferenceClient {
  /**
   * @param {import('../wiki/wikiClient.js').WikiClient} wikiClient 
   * @param {import('../testPlan/testPlanClient.js').TestPlanClient} testPlanClient 
   * @param {import('../workItem/workItemClient.js').WorkItemClient} workItemClient 
   */
  constructor(wikiClient, testPlanClient, workItemClient) {
    this.wikiClient = wikiClient;
    this.testPlanClient = testPlanClient;
    this.workItemClient = workItemClient;
  }

  /**
   * Find related items
   * @param {string} project 
   * @param {string} searchText 
   * @returns {Promise<any>}
   */
  async findRelatedItems(project, searchText) {
    if (!searchText) {
      return {
        wikiPages: [],
        testPlans: [],
        workItems: [],
        summary: { totalWikiPages: 0, totalTestPlans: 0, totalWorkItems: 0 }
      };
    }

    const [wikiResults, testPlans, workItems] = await Promise.allSettled([
      this.wikiClient.searchWikiContent(project, searchText),
      this.testPlanClient.searchTestPlans(project, searchText),
      this.workItemClient.searchWorkItems(project, searchText)
    ]);

    const wikiPages = wikiResults.status === 'fulfilled' ? wikiResults.value : [];
    const testPlansData = testPlans.status === 'fulfilled' ? testPlans.value : [];
    const workItemsData = workItems.status === 'fulfilled' ? workItems.value : [];

    return {
      wikiPages,
      testPlans: testPlansData,
      workItems: workItemsData,
      summary: {
        totalWikiPages: wikiPages.length,
        totalTestPlans: testPlansData.length,
        totalWorkItems: workItemsData.length
      }
    };
  }
}