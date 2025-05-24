export class PromptHandlers {
  /**
   * @param {import('../../client/azureDevOpsClient.js').AzureDevOpsClient} client 
   */
  constructor(client) {
    this.client = client;
  }

  /**
   * Get prompt definitions
   * @returns {Array<Object>}
   */
  getPromptDefinitions() {
    return [
      {
        name: "analyze_test_coverage",
        description: "Analyze test coverage for a specific feature or component",
        arguments: [
          {
            name: "project",
            description: "Project name",
            required: true
          },
          {
            name: "feature",
            description: "Feature or component name",
            required: true
          }
        ]
      },
      {
        name: "summarize_documentation",
        description: "Create a comprehensive summary of documentation for a topic",
        arguments: [
          {
            name: "project",
            description: "Project name",
            required: true
          },
          {
            name: "topic",
            description: "Topic to summarize",
            required: true
          }
        ]
      },
      {
        name: "requirements_traceability",
        description: "Trace requirements through documentation, tests, and work items",
        arguments: [
          {
            name: "project",
            description: "Project name",
            required: true
          },
          {
            name: "requirement",
            description: "Requirement identifier or description",
            required: true
          }
        ]
      },
      {
        name: "bug_investigation",
        description: "Investigate a bug by finding related documentation, tests, and work items",
        arguments: [
          {
            name: "project",
            description: "Project name",
            required: true
          },
          {
            name: "bugDescription",
            description: "Bug description or ID",
            required: true
          }
        ]
      }
    ];
  }

  /**
   * Handle prompt request
   * @param {Object} request 
   * @returns {Promise<Object>}
   */
  async handlePrompt(request) {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "analyze_test_coverage":
        return {
          description: `Analyze test coverage for feature: ${args?.feature}`,
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `Please analyze the test coverage for the feature "${args?.feature}" in project "${args?.project}". 

Include:
1. Search for related test plans and test cases
2. Find documentation that describes this feature
3. Identify any gaps in test coverage
4. Look for related work items (bugs, user stories)
5. Provide recommendations for improving test coverage

Use the available tools to gather comprehensive information about this feature.`
              }
            }
          ]
        };

      case "summarize_documentation":
        return {
          description: `Summarize documentation for topic: ${args?.topic}`,
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `Please create a comprehensive summary of all documentation related to "${args?.topic}" in project "${args?.project}".

Include:
1. Search all wiki pages for relevant content
2. Extract key information and main topics
3. Identify any conflicting or outdated information
4. Organize the information logically
5. Highlight important sections and requirements

Provide both a high-level summary and detailed sections for reference.`
              }
            }
          ]
        };

      case "requirements_traceability":
        return {
          description: `Trace requirement: ${args?.requirement}`,
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `Please trace the requirement "${args?.requirement}" through all available artifacts in project "${args?.project}".

Provide traceability through:
1. Requirements documentation (wiki pages)
2. Test plans and test cases that verify this requirement
3. Work items (user stories, tasks, bugs) related to this requirement
4. Implementation documentation
5. Any gaps in traceability

Create a comprehensive traceability matrix showing how this requirement is covered across the development lifecycle.`
              }
            }
          ]
        };

      case "bug_investigation":
        return {
          description: `Investigate bug: ${args?.bugDescription}`,
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `Please investigate the bug "${args?.bugDescription}" in project "${args?.project}".

Investigation should include:
1. Search for related work items and bug reports
2. Find relevant documentation that might explain the expected behavior
3. Identify test cases that should have caught this bug
4. Look for similar historical issues
5. Check if there are existing test plans covering this area

Provide a comprehensive analysis that can help with debugging and preventing similar issues.`
              }
            }
          ]
        };

      default:
        throw new Error(`Unknown prompt: ${name}`);
    }
  }
}