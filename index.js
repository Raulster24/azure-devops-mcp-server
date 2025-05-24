#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { resolve } from 'path';
import 'dotenv/config'; 
import { loadConfig } from './src/config/index.js';
import { AzureDevOpsMCPServer } from './src/mcp/server.js';

// Main execution
async function main() {
  // Catch ALL errors
  process.on('uncaughtException', (error) => {
    console.error('💥 UNCAUGHT EXCEPTION:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 UNHANDLED REJECTION:', reason);
    console.error('Promise:', promise);
    process.exit(1);
  });

  console.error("🔧 Initializing server configuration...");

  // Load and validate configuration
  const config = loadConfig();
  console.error("✅ Config validated, creating server...");

  try {
    const server = new AzureDevOpsMCPServer(config);
    console.error("✅ Server instance created, starting...");
    await server.run();
  } catch (error) {
    console.error('💥 Server startup failed:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

const currentFile = fileURLToPath(import.meta.url);
const scriptFile = resolve(process.argv[1]);

if (currentFile === scriptFile) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}