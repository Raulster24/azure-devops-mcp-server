import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { AzureDevOpsClient } from '../client/azureDevOpsClient.js';
import { ResourceHandlers } from './handlers/resourceHandlers.js';
import { ToolHandlers } from './handlers/toolHandlers.js';
import { PromptHandlers } from './handlers/promptHandlers.js';

export class AzureDevOpsMCPServer {
  /**
   * @param {Object} config 
   */
  constructor(config) {
    this.client = new AzureDevOpsClient(config);
    this.resourceHandlers = new ResourceHandlers(this.client);
    this.toolHandlers = new ToolHandlers(this.client);
    this.promptHandlers = new PromptHandlers(this.client);
    
    this.server = new Server(
      {
        name: "azure-devops-server",
        version: "1.0.0",
        description: "MCP server for Azure DevOps integration with wikis, test plans, and work items"
      },
      {
        capabilities: {
          resources: {},
          tools: {},
          prompts: {}
        }
      }
    );

    this.setupHandlers();
  }

  setupHandlers() {
    console.error("🔧 Setting up request handlers...");
    
    // Add a global request interceptor to see what's failing
    const originalSetRequestHandler = this.server.setRequestHandler.bind(this.server);
    this.server.setRequestHandler = (schema, handler) => {
      const wrappedHandler = async (...args) => {
        console.error(`📨 Request received for schema: ${schema.method || 'unknown'}`);
        try {
          const result = await handler(...args);
          console.error(`✅ Request completed for: ${schema.method || 'unknown'}`);
          return result;
        } catch (error) {
          console.error(`❌ Request failed for: ${schema.method || 'unknown'}`, error);
          throw error;
        }
      };
      return originalSetRequestHandler(schema, wrappedHandler);
    };

    // List available resources
    console.error("🔧 Setting up ListResourcesRequestSchema...");
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return this.resourceHandlers.handleListResources();
    });

    // Read specific resources
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      return this.resourceHandlers.handleReadResource(request);
    });

    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.toolHandlers.getToolDefinitions()
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      return this.toolHandlers.handleToolCall(request);
    });

    // List available prompts
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      return {
        prompts: this.promptHandlers.getPromptDefinitions()
      };
    });

    // Handle prompt requests
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      return this.promptHandlers.handlePrompt(request);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
  
    console.error("🚀 Starting Azure DevOps MCP Server...");
    
    try {
      await this.server.connect(transport);
      console.error("✅ Server connected to transport");
      console.error("🔍 Server is now listening for requests...");
      
      // Add this to see if server stays alive
      setInterval(() => {
        console.error(`💓 Server heartbeat - ${new Date().toISOString()}`);
      }, 5000);
      
    } catch (error) {
      console.error("❌ Failed to start server:", error);
      console.error("Stack:", error.stack);
      throw error;
    }
  }
}