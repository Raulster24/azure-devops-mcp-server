import { Cache } from '../../core/cache.js';

export class TestPlanClient {
  /**
   * @param {import('axios').AxiosInstance} httpClient 
   * @param {Object} config 
   */
  constructor(httpClient, config) {
    this.httpClient = httpClient;
    this.config = config;
    this.testPlanCache = new Cache(config.cacheTimeout);
  }

  /**
   * Retry helper for API calls
   * @param {Function} apiCall 
   * @param {number} maxRetries 
   * @param {string} operation 
   * @returns {Promise<any>}
   */
  async retryOperation(apiCall, maxRetries = 3, operation = 'API call') {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.error(`🔄 ${operation} - Attempt ${attempt}/${maxRetries}`);
        return await apiCall();
      } catch (error) {
        lastError = error;
        
        // Don't retry on authentication errors
        if (error.response?.status === 401 || error.response?.status === 403) {
          throw error;
        }
        
        // Don't retry on client errors (except timeout)
        if (error.response?.status >= 400 && error.response?.status < 500 && error.code !== 'ECONNABORTED') {
          throw error;
        }
        
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff, max 10s
          console.error(`⏳ ${operation} failed, retrying in ${delay}ms... (${error.message})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Get test plans
   * @param {string} project 
   * @returns {Promise<any[]>}
   */
  async getTestPlans(project) {
    const cacheKey = `test_plans_${project}`;
    const cached = this.testPlanCache.get(cacheKey);
    if (cached) {
      console.error(`📋 Test plans for ${project} found in cache`);
      return cached;
    }

    try {
      console.error(`📋 Fetching test plans for project: ${project}`);
      
      const response = await this.retryOperation(
        () => this.httpClient.get(`/${encodeURIComponent(project)}/_apis/testplan/plans`),
        3,
        `Getting test plans for ${project}`
      );
      
      const plans = response.data.value || [];
      console.error(`✅ Found ${plans.length} test plans for ${project}`);
      
      this.testPlanCache.set(cacheKey, plans);
      return plans;
    } catch (error) {
      console.error(`❌ Failed to get test plans for project ${project}:`, error.message);
      
      // Return empty array instead of throwing, so other operations can continue
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        console.error('⚠️ Request timed out - try increasing AZDO_HTTP_TIMEOUT environment variable');
      }
      
      return [];
    }
  }

  /**
   * Get test plan details
   * @param {string} project 
   * @param {number} planId 
   * @returns {Promise<any>}
   */
  async getTestPlanDetails(project, planId) {
    const cacheKey = `test_plan_details_${project}_${planId}`;
    const cached = this.testPlanCache.get(cacheKey);
    if (cached) return cached;

    try {
      console.error(`📋 Fetching test plan details for ${project}/${planId}`);
      
      const [planResponse, suitesResponse] = await Promise.allSettled([
        this.retryOperation(
          () => this.httpClient.get(`/${encodeURIComponent(project)}/_apis/testplan/plans/${planId}`),
          3,
          `Getting test plan ${planId}`
        ),
        this.retryOperation(
          () => this.httpClient.get(`/${encodeURIComponent(project)}/_apis/testplan/plans/${planId}/suites`),
          3,
          `Getting test plan ${planId} suites`
        )
      ]);

      const details = {
        ...(planResponse.status === 'fulfilled' ? planResponse.value.data : {}),
        suites: suitesResponse.status === 'fulfilled' ? (suitesResponse.value.data.value || []) : []
      };

      this.testPlanCache.set(cacheKey, details);
      return details;
    } catch (error) {
      console.error(`❌ Failed to get test plan details for ${project}/${planId}:`, error.message);
      
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        console.error('⚠️ Request timed out - try increasing AZDO_HTTP_TIMEOUT environment variable');
      }
      
      throw new Error(`Failed to get test plan details: ${error.message}`);
    }
  }

  /**
   * Search test plans
   * @param {string} project 
   * @param {string} searchText 
   * @returns {Promise<any[]>}
   */
  async searchTestPlans(project, searchText) {
    if (!searchText) return [];
    
    const plans = await this.getTestPlans(project);
    return plans.filter(plan => 
      (plan.name && plan.name.toLowerCase().includes(searchText.toLowerCase())) ||
      (plan.description && plan.description.toLowerCase().includes(searchText.toLowerCase()))
    );
  }

  /**
   * Get test cases
   * @param {string} project 
   * @param {number} planId 
   * @param {number} [suiteId] 
   * @returns {Promise<any[]>}
   */
  async getTestCases(project, planId, suiteId) {
    const cacheKey = `test_cases_${project}_${planId}_${suiteId || 'all'}`;
    const cached = this.testPlanCache.get(cacheKey);
    if (cached) return cached;

    try {
      // CORRECT endpoint from Microsoft docs - note the capitalization!
      if (suiteId) {
        const url = `/${encodeURIComponent(project)}/_apis/testplan/Plans/${planId}/Suites/${suiteId}/TestCase?api-version=7.1`;
        console.error(`🧪 Getting test cases from: ${url}`);
        
        const response = await this.retryOperation(
          () => this.httpClient.get(url),
          3,
          `Getting test cases for suite ${suiteId}`
        );
        
        const testCases = response.data.value || [];
        console.error(`✅ Found ${testCases.length} test cases`);
        
        this.testPlanCache.set(cacheKey, testCases);
        return testCases;
      } else {
        // For all test cases in a plan, get all suites first
        const planDetails = await this.getTestPlanDetails(project, planId);
        const allTestCases = [];
        
        for (const suite of planDetails.suites || []) {
          try {
            const suiteTestCases = await this.getTestCases(project, planId, suite.id);
            allTestCases.push(...suiteTestCases);
          } catch (suiteError) {
            console.error(`⚠️ Failed to get test cases for suite ${suite.id}:`, suiteError.message);
          }
        }
        
        this.testPlanCache.set(cacheKey, allTestCases);
        return allTestCases;
      }
    } catch (error) {
      console.error(`❌ Failed to get test cases for ${project}/${planId}/${suiteId || 'all'}:`, error.message);
      
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        console.error('⚠️ Request timed out - try increasing AZDO_HTTP_TIMEOUT environment variable');
      }
      
      return [];
    }
  }
}