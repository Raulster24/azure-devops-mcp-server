# Azure DevOps MCP Server

A modular Model Context Protocol (MCP) server for Azure DevOps integration with wikis, test plans, and work items. This server enables Claude Desktop and other MCP clients to interact with Azure DevOps resources.

## ✨ Key Features

- **🚀 FAST Wiki Operations**: Two-stage approach - list pages first, fetch content on-demand
- **📚 Comprehensive Wiki Support**: Search by name, content, or get specific pages/sections
- **🧪 Test Plan Management**: Search test plans, get details, find test cases
- **📝 Work Item Queries**: Search and retrieve work items with WIQL support
- **🔗 Cross-Reference Search**: Find related items across wikis, test plans, and work items
- **⚡ Smart Caching**: Built-in caching for improved performance
- **🔧 Configurable Timeouts**: Handle large Azure DevOps projects
- **🏗️ Modular Architecture**: Clean separation of concerns for maintainability

## 🛠️ Installation

### From npm (Recommended)

```bash
npm install -g azure-devops-mcp-server
```

### From Source

```bash
git clone https://github.com/yourusername/azure-devops-mcp-server
cd azure-devops-mcp-server
npm install
```

## ⚙️ Configuration

### Azure DevOps Setup

1. **Personal Access Token**: Create a PAT in Azure DevOps
   - Go to User Settings → Personal access tokens
   - Create new token with the required scopes, for example:
     - Work Items: Read
     - Wiki: Read
     - Test Management: Read

2. **Organization URL**: Get your organization URL
   - Format: `https://dev.azure.com/yourorganization`

### Environment Variables

Create a `.env` file (optional) or set environment variables:

```bash
AZDO_ORG_URL=https://dev.azure.com/yourorganization
AZDO_PAT=your-personal-access-token
AZDO_DEFAULT_PROJECT=YourProject
AZDO_MAX_CONTENT_LENGTH=2000
AZDO_CACHE_TIMEOUT=300000
AZDO_HTTP_TIMEOUT=120000
```

### Claude Desktop Configuration

Add to your Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "azure-devops": {
      "command": "azure-devops-mcp-server",
      "env": {
        "AZDO_ORG_URL": "https://dev.azure.com/yourorganization",
        "AZDO_PAT": "your-personal-access-token",
        "AZDO_HTTP_TIMEOUT": "300000"
      }
    }
  }
}
```

## 🔧 Available Tools

### 📚 Wiki Tools (NEW - Optimized!)

#### `list_wiki_pages` - 
List all wiki pages by name - perfect for exploration
- **Use case**: "What wiki pages do we have?"
- **Speed**: Very fast (metadata only)

#### `search_wiki_pages` - 
Search wiki pages by name/path - no content fetching
- **Use case**: "Find pages about authentication"
- **Speed**: Very fast (searches names only)

#### `get_wiki_page` - 
Get specific wiki page content when you know what you want
- **Use case**: "Get the API documentation page"
- **Speed**: Moderate (fetches one page)

#### `get_wiki_section` - 
Extract specific sections from wiki pages
- **Use case**: "Get the installation section from setup docs"
- **Speed**: Moderate (fetches one page, extracts section)

#### `search_wiki_content` - 
Search through actual page content - use sparingly
- **Use case**: "Find all mentions of 'database connection' in content"
- **Speed**: Slower (fetches and searches all content)

### 🧪 Test Plan Tools
- `search_test_plans`: Find test plans by name or description
- `get_test_plan_details`: Get detailed test plan information
- `find_test_cases`: Search test cases within plans or suites

### 📝 Work Item Tools
- `search_work_items`: Search work items with text queries

### 🔗 Cross-Reference Tools
- `find_related_items`: Find all related artifacts for a topic
- `search_by_feature`: Search by feature across all artifact types

## 💡 Usage Examples & Best Practices

### 🎯 Efficient Wiki Search Strategy

**Step 1**: Start with fast page search
```
"List all wiki pages in the codeless project"
→ Uses list_wiki_pages (very fast)
```

**Step 2**: Search by page names first
```
"Find wiki pages about API or authentication in codeless project"
→ Uses search_wiki_pages (fast - searches page names only)
```

**Step 3**: Get specific content when needed
```
"Get the content of the API Setup page"
→ Uses get_wiki_page (fetches specific page content)
```

**Step 4**: Only search content when necessary
```
"Search for 'database connection string' in all wiki content"
→ Uses search_wiki_content (slower - searches all page content)
```

### 💬 Natural Language Examples

**Fast Operations:**
- *"What wiki pages do we have in the "acme" project?"*
- *"Find pages with 'setup' or 'install' in the name"*
- *"List all test plans for user authentication"*

**Moderate Operations:**  
- *"Show me the API documentation page content"*
- *"Get the troubleshooting section from the setup guide"*
- *"Find test cases in the login test plan"*

**Slower Operations (use when needed):**
- *"Search all wiki content for mentions of database configuration"*
- *"Find all artifacts related to the payment processing feature"*

## 🏗️ Architecture

```
src/
├── config/              # Configuration management
├── core/                # Shared utilities (cache, content processing, HTTP)
├── domains/             # Domain-specific clients
│   ├── wiki/           # Wiki operations (UPDATED with 2-stage approach)
│   ├── testPlan/       # Test plan operations  
│   ├── workItem/       # Work item operations
│   ├── projects/       # Project operations
│   └── crossReference/ # Cross-reference operations
├── client/             # Main Azure DevOps client
└── mcp/                # MCP protocol implementation
    ├── handlers/       # Request handlers
    └── server.js       # Main server
```

## ⚡ Performance Optimizations

### Wiki Performance Strategy
1. **Metadata First**: Always get page lists before content
2. **Smart Caching**: Pages cached for 5 minutes by default
3. **Batch Processing**: Content searches processed in batches
4. **Retry Logic**: Automatic retry with exponential backoff
5. **Configurable Timeouts**: Adjust `AZDO_HTTP_TIMEOUT` for large projects

### For Large Projects
```bash
# Increase timeout for projects with many wiki pages
AZDO_HTTP_TIMEOUT=600000  # 10 minutes

# Adjust cache timeout if needed
AZDO_CACHE_TIMEOUT=900000  # 15 minutes
```

## 🚨 Troubleshooting

### Common Issues

1. **No Wiki Pages Found**: 
   - Verify project name is correct
   - Check PAT permissions include Wiki read access
   - Try: "List all wiki pages in [exact-project-name]"

2. **Timeout Errors**:
   - Increase `AZDO_HTTP_TIMEOUT` environment variable
   - For very large projects: set to 600000 (10 minutes)

3. **Empty Search Results**:
   - Try `list_wiki_pages` first to see available pages
   - Use `search_wiki_pages` for name-based search
   - Only use `search_wiki_content` for content search

### Debug Commands

Test your connection:
```bash
# Test basic connectivity
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node index.js

# Test wiki listing
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"list_wiki_pages","arguments":{"project":"YourProject"}}}' | node index.js
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- File issues on GitHub
- Check existing issues for common problems
- Refer to Azure DevOps API documentation for endpoint details

---

## 🎉 What's New in This Version

### ✨ Major Wiki Improvements
- **2-Stage Approach**: Fast page discovery, on-demand content fetching
- **Correct API Usage**: Fixed Azure DevOps REST API calls with proper parameters
- **Better Performance**: Smart caching and batch processing
- **More Tools**: 5 specialized wiki tools for different use cases
- **Timeout Handling**: Configurable timeouts for large projects

### 🔧 Enhanced Tools
- `list_wiki_pages`: Browse all available pages quickly
- `search_wiki_pages`: Fast name-based search  
- `get_wiki_page`: Fetch specific page content
- `get_wiki_section`: Extract specific sections
- `search_wiki_content`: Comprehensive content search
