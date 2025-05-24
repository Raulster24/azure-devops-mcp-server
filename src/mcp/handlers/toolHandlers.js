import { ContentProcessor } from '../../core/contentProcessor.js';

export class ToolHandlers {
  /**
   * @param {import('../../client/azureDevOpsClient.js').AzureDevOpsClient} client 
   */
  constructor(client) {
    this.client = client;
  }

  /**
   * Get tool definitions
   * @returns {Array<Object>}
   */
  getToolDefinitions() {
    return [
      // Wiki Tools
        {
        name: "list_wiki_pages",
        description: "List all wiki pages (names only) - FAST operation",
        inputSchema: {
            type: "object",
            properties: {
            project: { type: "string", description: "Project name" }
            },
            required: ["project"]
        }
        },
        {
        name: "search_wiki_pages",
        description: "Search wiki pages by name/path - FAST operation (no content fetching)",
        inputSchema: {
            type: "object",
            properties: {
            project: { type: "string", description: "Project name" },
            searchText: { type: "string", description: "Text to search for in page names/paths" }
            },
            required: ["project", "searchText"]
        }
        },
        {
        name: "get_wiki_page",
        description: "Get specific wiki page content",
        inputSchema: {
            type: "object",
            properties: {
            project: { type: "string", description: "Project name" },
            wikiId: { type: "string", description: "Wiki ID" },
            path: { type: "string", description: "Page path (e.g., '/Page Name')" }
            },
            required: ["project", "wikiId", "path"]
        }
        },
        {
        name: "get_wiki_section",
        description: "Get specific section from a wiki page",
        inputSchema: {
            type: "object",
            properties: {
            project: { type: "string", description: "Project name" },
            wikiId: { type: "string", description: "Wiki ID" },
            path: { type: "string", description: "Page path" },
            sectionTitle: { type: "string", description: "Section title to extract" }
            },
            required: ["project", "wikiId", "path", "sectionTitle"]
        }
        },
        {
        name: "search_wiki_content",
        description: "Search for content within wiki pages - SLOWER operation (searches actual content)",
        inputSchema: {
            type: "object",
            properties: {
            project: { type: "string", description: "Project name" },
            searchText: { type: "string", description: "Text to search for in page content" },
            includeContent: { type: "boolean", description: "Include full content or just summaries", default: false }
            },
            required: ["project", "searchText"]
        }
        },

      // Test Plan Tools
      {
        name: "search_test_plans",
        description: "Search for test plans by name or description",
        inputSchema: {
          type: "object",
          properties: {
            project: { type: "string", description: "Project name" },
            searchText: { type: "string", description: "Text to search for" }
          },
          required: ["project", "searchText"]
        }
      },
      {
        name: "get_test_plan_details",
        description: "Get detailed information about a specific test plan including suites",
        inputSchema: {
          type: "object",
          properties: {
            project: { type: "string", description: "Project name" },
            planId: { type: "number", description: "Test plan ID" }
          },
          required: ["project", "planId"]
        }
      },
      {
        name: "find_test_cases",
        description: "Find test cases within a test plan or suite",
        inputSchema: {
          type: "object",
          properties: {
            project: { type: "string", description: "Project name" },
            planId: { type: "number", description: "Test plan ID" },
            suiteId: { type: "number", description: "Test suite ID (optional)" },
            searchText: { type: "string", description: "Filter test cases by text (optional)" }
          },
          required: ["project", "planId"]
        }
      },
      // Work Item Tools
      {
        name: "search_work_items",
        description: "Search for work items using text or WIQL query",
        inputSchema: {
          type: "object",
          properties: {
            project: { type: "string", description: "Project name" },
            searchText: { type: "string", description: "Text to search for" },
            workItemType: { type: "string", description: "Filter by work item type (optional)" }
          },
          required: ["project", "searchText"]
        }
      },
      // Cross-Reference Tools
      {
        name: "find_related_items",
        description: "Find all related items (wikis, test plans, work items) for a given topic",
        inputSchema: {
          type: "object",
          properties: {
            project: { type: "string", description: "Project name" },
            searchText: { type: "string", description: "Topic or feature to search for" }
          },
          required: ["project", "searchText"]
        }
      },
      {
        name: "search_by_feature",
        description: "Search for all artifacts related to a specific feature or component",
        inputSchema: {
          type: "object",
          properties: {
            project: { type: "string", description: "Project name" },
            featureName: { type: "string", description: "Feature or component name" },
            includeArchived: { type: "boolean", description: "Include archived items", default: false }
          },
          required: ["project", "featureName"]
        }
      }
    ];
  }

  /**
   * Handle tool execution
   * @param {Object} request 
   * @returns {Promise<Object>}
   */
  async handleToolCall(request) {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
            case "list_wiki_pages": {
            const pages = await this.client.wikiClient.listAllWikiPages(args.project);
            return {
                content: [{
                type: "text",
                text: JSON.stringify({
                    project: args.project,
                    pages: pages.map(p => ({
                    name: p.name,
                    path: p.path,
                    wikiName: p.wikiName,
                    wikiId: p.wikiId,
                    wikiType: p.wikiType,
                    isParentPage: p.isParentPage || false
                    })),
                    totalFound: pages.length,
                    summary: `Found ${pages.length} wiki pages in project ${args.project}`
                }, null, 2)
                }]
            };
            }

            case "search_wiki_pages": {
            const pages = await this.client.wikiClient.searchWikiPages(args.project, args.searchText);
            return {
                content: [{
                type: "text",
                text: JSON.stringify({
                    searchText: args.searchText,
                    project: args.project,
                    pages: pages.map(p => ({
                    name: p.name,
                    path: p.path,
                    wikiName: p.wikiName,
                    wikiId: p.wikiId,
                    matchType: p.matchType || 'name'
                    })),
                    totalFound: pages.length,
                    summary: `Found ${pages.length} wiki pages matching "${args.searchText}"`
                }, null, 2)
                }]
            };
            }

            case "get_wiki_page": {
            const content = await this.client.wikiClient.getWikiPageContent(args.project, args.wikiId, args.path);
            return {
                content: [{
                type: "text",
                text: JSON.stringify({
                    project: args.project,
                    wikiId: args.wikiId,
                    path: args.path,
                    content: content,
                    summary: ContentProcessor.extractSummary(content),
                    sections: ContentProcessor.extractSections(content).map(s => ({
                    title: s.title,
                    level: s.level
                    })),
                    contentLength: content.length
                }, null, 2)
                }]
            };
            }

            case "get_wiki_section": {
            const result = await this.client.wikiClient.getWikiSection(args.project, args.wikiId, args.path, args.sectionTitle);
            return {
                content: [{
                type: "text",
                text: JSON.stringify({
                    project: args.project,
                    wikiId: args.wikiId,
                    path: args.path,
                    sectionTitle: args.sectionTitle,
                    found: result.found,
                    content: result.content
                }, null, 2)
                }]
            };
            }

            case "search_wiki_content": {
            const results = await this.client.wikiClient.searchWikiContent(args.project, args.searchText);
            return {
                content: [{
                type: "text",
                text: JSON.stringify({
                    searchText: args.searchText,
                    project: args.project,
                    results: results.map(r => ({
                    name: r.name,
                    path: r.path,
                    wikiName: r.wikiName,
                    wikiId: r.wikiId,
                    matchType: r.matchType,
                    summary: r.summary,
                    content: args.includeContent ? r.content : undefined
                    })),
                    totalFound: results.length,
                    summary: `Found ${results.length} wiki pages with content matching "${args.searchText}"`
                }, null, 2)
                }]
            };
            }

        case "search_test_plans": {
          const testPlans = await this.client.searchTestPlans(args.project, args.searchText);
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                searchText: args.searchText,
                project: args.project,
                testPlans,
                totalFound: testPlans.length
              }, null, 2)
            }]
          };
        }

        case "get_test_plan_details": {
          const details = await this.client.getTestPlanDetails(args.project, args.planId);
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                project: args.project,
                planId: args.planId,
                details
              }, null, 2)
            }]
          };
        }

        case "find_test_cases": {
          const testCases = await this.client.getTestCases(args.project, args.planId, args.suiteId);
          let filteredCases = testCases;
          
          if (args.searchText) {
            filteredCases = testCases.filter(tc => 
              (tc.title && tc.title.toLowerCase().includes(args.searchText.toLowerCase())) ||
              (tc.description && tc.description.toLowerCase().includes(args.searchText.toLowerCase()))
            );
          }

          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                project: args.project,
                planId: args.planId,
                suiteId: args.suiteId,
                searchText: args.searchText,
                testCases: filteredCases.map(tc => ({
                  id: tc.workItem?.id,
                  name: tc.workItem?.name,
                  order: tc.order,
                  testPlan: tc.testPlan,
                  testSuite: tc.testSuite,
                  pointAssignments: tc.pointAssignments?.map(pa => ({
                    configurationId: pa.configurationId,
                    configurationName: pa.configurationName,
                    testerId: pa.tester?.id,
                    testerName: pa.tester?.displayName
                  })) || [],
                  workItemFields: tc.workItem?.workItemFields
                })),
                totalFound: filteredCases.length
              }, null, 2)
            }]
          };
        }

        case "search_work_items": {
          const workItems = await this.client.searchWorkItems(args.project, args.searchText);
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                searchText: args.searchText,
                project: args.project,
                workItems,
                totalFound: workItems.length
              }, null, 2)
            }]
          };
        }

        case "find_related_items": {
          const related = await this.client.findRelatedItems(args.project, args.searchText);
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                searchText: args.searchText,
                project: args.project,
                relatedItems: related,
                summary: `Found ${related.summary.totalWikiPages} wiki pages, ${related.summary.totalTestPlans} test plans, and ${related.summary.totalWorkItems} work items`
              }, null, 2)
            }]
          };
        }

        case "search_by_feature": {
          const related = await this.client.findRelatedItems(args.project, args.featureName);
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                featureName: args.featureName,
                project: args.project,
                artifacts: related,
                summary: `Feature '${args.featureName}' found in ${related.summary.totalWikiPages} documentation pages, ${related.summary.totalTestPlans} test plans, and ${related.summary.totalWorkItems} work items`
              }, null, 2)
            }]
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      console.error(`Error executing tool ${name}:`, error);
      return {
        content: [{
          type: "text",
          text: `Error executing ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        isError: true
      };
    }
  }
}