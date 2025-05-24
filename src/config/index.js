/**
 * @typedef {Object} AzureDevOpsConfig
 * @property {string} organizationUrl
 * @property {string} personalAccessToken
 * @property {string} [defaultProject]
 * @property {number} maxContentLength
 * @property {number} cacheTimeout
 * @property {number} httpTimeout
 */

/**
 * Load and validate configuration from environment variables
 * @returns {AzureDevOpsConfig}
 */
export function loadConfig() {
  const config = {
    organizationUrl: process.env.AZDO_ORG_URL || '',
    personalAccessToken: process.env.AZDO_PAT || '',
    defaultProject: process.env.AZDO_DEFAULT_PROJECT,
    maxContentLength: parseInt(process.env.AZDO_MAX_CONTENT_LENGTH || '2000'),
    cacheTimeout: parseInt(process.env.AZDO_CACHE_TIMEOUT || '300000'),
    httpTimeout: parseInt(process.env.AZDO_HTTP_TIMEOUT || '120000') // 2 minutes default
  };

  console.error("🔧 Config created, validating...");
  
  if (!config.organizationUrl || !config.personalAccessToken) {
    console.error('❌ Missing required environment variables: AZDO_ORG_URL and AZDO_PAT are required');
    process.exit(1);
  }

  // Validate numeric configs
  if (isNaN(config.maxContentLength) || config.maxContentLength < 100) {
    console.error('❌ Invalid AZDO_MAX_CONTENT_LENGTH. Must be a number >= 100');
    process.exit(1);
  }

  if (isNaN(config.cacheTimeout) || config.cacheTimeout < 1000) {
    console.error('❌ Invalid AZDO_CACHE_TIMEOUT. Must be a number >= 1000 (milliseconds)');
    process.exit(1);
  }

  if (isNaN(config.httpTimeout) || config.httpTimeout < 1000) {
    console.error('❌ Invalid AZDO_HTTP_TIMEOUT. Must be a number >= 1000 (milliseconds)');
    process.exit(1);
  }

  console.error(`✅ Configuration validated successfully (HTTP timeout: ${config.httpTimeout}ms)`);
  return config;
}