import { Cache } from '../../core/cache.js';
import { ContentProcessor } from '../../core/contentProcessor.js';

export class WikiClient {
  /**
   * @param {import('axios').AxiosInstance} httpClient 
   * @param {Object} config 
   */
  constructor(httpClient, config) {
    this.httpClient = httpClient;
    this.config = config;
    this.wikiCache = new Cache(config.cacheTimeout);
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
        
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5s
          console.error(`⏳ ${operation} failed, retrying in ${delay}ms... (${error.message})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Get wikis for a project
   * @param {string} project 
   * @returns {Promise<any[]>}
   */
  async getWikis(project) {
    const cacheKey = `wikis_${project}`;
    const cached = this.wikiCache.get(cacheKey);
    if (cached) {
      console.error(`📚 Wikis for ${project} found in cache`);
      return cached;
    }

    try {
      console.error(`📚 Fetching wikis for project: ${project}`);
      
      const response = await this.retryOperation(
        () => this.httpClient.get(`/${encodeURIComponent(project)}/_apis/wiki/wikis?api-version=7.1`),
        3,
        `Getting wikis for ${project}`
      );
      
      const wikis = response.data.value || [];
      console.error(`✅ Found ${wikis.length} wikis for ${project}: ${wikis.map(w => w.name).join(', ')}`);
      
      this.wikiCache.set(cacheKey, wikis);
      return wikis;
    } catch (error) {
      console.error(`❌ Failed to get wikis for project ${project}:`, error.message);
      return [];
    }
  }

  /**
   * Get all wiki pages metadata (WITHOUT content) - FAST operation
   * @param {string} project 
   * @param {string} wikiId 
   * @returns {Promise<any[]>}
   */
  async getAllWikiPages(project, wikiId) {
    const cacheKey = `all_wiki_pages_${project}_${wikiId}`;
    const cached = this.wikiCache.get(cacheKey);
    if (cached) {
      console.error(`📄 All pages for ${project}/${wikiId} found in cache`);
      return cached;
    }

    try {
      console.error(`📄 Fetching ALL pages metadata for ${project}/${wikiId}`);
      
      // CORRECT API call with path=/ and recursionLevel=full
      const response = await this.retryOperation(
        () => this.httpClient.get(
          `/${encodeURIComponent(project)}/_apis/wiki/wikis/${encodeURIComponent(wikiId)}/pages?path=/&recursionLevel=full&api-version=7.1`
        ),
        3,
        `Getting all pages for ${project}/${wikiId}`
      );
      
      // Flatten the hierarchical structure to get all pages
      const allPages = this.flattenWikiPages(response.data);
      console.error(`✅ Found ${allPages.length} total pages in ${project}/${wikiId}`);
      
      this.wikiCache.set(cacheKey, allPages);
      return allPages;
    } catch (error) {
      console.error(`❌ Failed to get all wiki pages for ${project}/${wikiId}:`, error.message);
      return [];
    }
  }

  /**
   * Flatten hierarchical wiki pages structure into a flat array
   * @param {Object} pageData - Root page data with subPages
   * @returns {Array} - Flat array of all pages
   */
  flattenWikiPages(pageData) {
    const allPages = [];
    
    const addPages = (page) => {
      // Skip the root page (path="/") but include all actual pages
      if (page.path && page.path !== '/') {
        allPages.push({
          path: page.path,
          gitItemPath: page.gitItemPath,
          order: page.order,
          isParentPage: page.isParentPage || false,
          url: page.url,
          remoteUrl: page.remoteUrl,
          // Clean up the page name for display
          name: this.extractPageName(page.path)
        });
      }
      
      // Recursively add sub-pages
      if (page.subPages && Array.isArray(page.subPages)) {
        page.subPages.forEach(subPage => addPages(subPage));
      }
    };
    
    addPages(pageData);
    return allPages;
  }

  /**
   * Extract clean page name from path
   * @param {string} path - Wiki page path like "/Page Name" or "/Folder/Page Name"
   * @returns {string} - Clean page name
   */
  extractPageName(path) {
    if (!path) return '';
    
    // Remove leading slash and get the last part of the path
    const parts = path.split('/').filter(part => part.length > 0);
    const pageName = parts[parts.length - 1];
    
    // Replace URL encoding and hyphens with spaces for better readability
    return pageName
      .replace(/-/g, ' ')
      .replace(/%20/g, ' ')
      .trim();
  }

  /**
   * Get wiki page content for a specific page
   * @param {string} project 
   * @param {string} wikiId 
   * @param {string} path 
   * @returns {Promise<string>}
   */
  async getWikiPageContent(project, wikiId, path) {
    const cacheKey = `wiki_content_${project}_${wikiId}_${path}`;
    const cached = this.wikiCache.get(cacheKey);
    if (cached) {
      console.error(`📖 Content for ${path} found in cache`);
      return cached;
    }

    try {
      console.error(`📖 Fetching content for page: ${path}`);
      
      // CORRECT API call with includeContent=true
      const response = await this.retryOperation(
        () => this.httpClient.get(
          `/${encodeURIComponent(project)}/_apis/wiki/wikis/${encodeURIComponent(wikiId)}/pages?path=${encodeURIComponent(path)}&includeContent=true&api-version=7.1`
        ),
        3,
        `Getting content for ${path}`
      );
      
      const content = response.data.content || '';
      console.error(`✅ Retrieved ${content.length} characters for ${path}`);
      
      this.wikiCache.set(cacheKey, content);
      return content;
    } catch (error) {
      console.error(`❌ Failed to fetch wiki content for ${path}:`, error.message);
      return '';
    }
  }

  /**
   * List all wiki pages (names only) - FAST operation
   * @param {string} project 
   * @returns {Promise<any[]>}
   */
  async listAllWikiPages(project) {
    console.error(`📋 Listing all wiki pages for project: ${project}`);
    
    const wikis = await this.getWikis(project);
    if (wikis.length === 0) {
      console.error(`⚠️ No wikis found for project ${project}`);
      return [];
    }

    const allResults = [];
    
    for (const wiki of wikis) {
      try {
        const pages = await this.getAllWikiPages(project, wiki.id);
        const wikiResults = pages.map(page => ({
          ...page,
          wikiName: wiki.name,
          wikiId: wiki.id,
          wikiType: wiki.type || 'unknown'
        }));
        allResults.push(...wikiResults);
      } catch (error) {
        console.error(`⚠️ Error getting pages for wiki ${wiki.name}:`, error.message);
      }
    }

    console.error(`✅ Found ${allResults.length} total pages across all wikis`);
    return allResults;
  }

  /**
   * Search wiki pages by name/path (FAST - no content fetching)
   * @param {string} project 
   * @param {string} searchText 
   * @returns {Promise<any[]>}
   */
  async searchWikiPages(project, searchText) {
    if (!searchText || !project) return [];

    console.error(`🔍 Searching wiki pages by name for: "${searchText}"`);
    
    const allPages = await this.listAllWikiPages(project);
    const searchLower = searchText.toLowerCase();
    
    const matchingPages = allPages.filter(page => 
      page.name.toLowerCase().includes(searchLower) ||
      page.path.toLowerCase().includes(searchLower)
    );

    console.error(`✅ Found ${matchingPages.length} pages matching "${searchText}"`);
    return matchingPages;
  }

  /**
   * Search wiki content (SLOWER - fetches actual content)
   * @param {string} project 
   * @param {string} searchText 
   * @returns {Promise<any[]>}
   */
  async searchWikiContent(project, searchText) {
    if (!searchText || !project) return [];

    console.error(`🔍 Searching wiki CONTENT for: "${searchText}" (this may be slow)`);
    
    // First, get all pages that match by name (fast)
    const pageMatches = await this.searchWikiPages(project, searchText);
    
    // Then, search through content of all pages (slower)
    const allPages = await this.listAllWikiPages(project);
    const contentMatches = [];
    
    // Process in batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < allPages.length; i += batchSize) {
      const batch = allPages.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (page) => {
        try {
          const content = await this.getWikiPageContent(page.wikiId, page.path);
          if (ContentProcessor.containsSearchTerm(content, searchText)) {
            return {
              ...page,
              content: ContentProcessor.findRelevantSections(content, searchText),
              summary: ContentProcessor.extractSummary(content, this.config.maxContentLength),
              matchType: 'content'
            };
          }
        } catch (error) {
          console.error(`⚠️ Error searching content in ${page.path}:`, error.message);
        }
        return null;
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      batchResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          contentMatches.push(result.value);
        }
      });
      
      // Add a small delay between batches
      if (i + batchSize < allPages.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Combine results, prioritizing name matches
    const nameMatchPaths = new Set(pageMatches.map(p => p.path));
    const uniqueContentMatches = contentMatches.filter(p => !nameMatchPaths.has(p.path));
    
    const allResults = [
      ...pageMatches.map(p => ({ ...p, matchType: 'name' })),
      ...uniqueContentMatches
    ];

    console.error(`✅ Content search complete: ${allResults.length} total matches (${pageMatches.length} name, ${uniqueContentMatches.length} content)`);
    return allResults;
  }

  /**
   * Get specific wiki section
   * @param {string} project 
   * @param {string} wikiId 
   * @param {string} path 
   * @param {string} sectionTitle 
   * @returns {Promise<{found: boolean, content: string|null}>}
   */
  async getWikiSection(project, wikiId, path, sectionTitle) {
    try {
      console.error(`📖 Getting section "${sectionTitle}" from ${path}`);
      
      const content = await this.getWikiPageContent(project, wikiId, path);
      const sections = ContentProcessor.extractSections(content);
      const section = sections.find(s => 
        ContentProcessor.containsSearchTerm(s.title, sectionTitle)
      );
      
      return {
        found: !!section,
        content: section ? `## ${section.title}\n${section.content}` : null
      };
    } catch (error) {
      console.error(`❌ Failed to get wiki section:`, error.message);
      return { found: false, content: null };
    }
  }

  /**
   * Clear wiki cache
   */
  clearCache() {
    this.wikiCache.clear();
    console.error('🗑️ Wiki cache cleared');
  }
}