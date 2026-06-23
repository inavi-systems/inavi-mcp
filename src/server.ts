#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import { config } from '@/config/env.config';
import { logger } from '@/utils/logger';
import {
  registerListMapExamplesTool,
  registerGetMapExampleTool,
} from '@/tools/map-examples/map-examples.tool';
import { registerListApiSpecsTool, registerGetApiSpecTool } from '@/tools/api-specs/api-specs.tool';

/**
 * Read package.json to get server name and version
 */
const packageJsonPath = resolve(__dirname, '../package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as {
  name: string;
  version: string;
};
const serverName = packageJson.name;
const serverVersion = packageJson.version;

/**
 * MCP Server instance
 * Uses stdio transport for communication with MCP Host.
 *
 */
const server = new McpServer(
  {
    name: serverName,
    version: serverVersion,
  },
  {
    capabilities: {
      logging: {}, // Enable MCP Logging Notification capability
    },
  },
);

/**
 * Initialize logger with MCP server instance
 * This allows the logger to send MCP Logging Notifications
 */
logger.init(server);

/**
 * Register all MCP tools
 * Similar to Spring's ComponentScan - automatically registers all tools
 */
function registerAllTools(): void {
  registerListMapExamplesTool(server); // HTML example tools
  registerGetMapExampleTool(server);
  registerListApiSpecsTool(server); // API spec tools
  registerGetApiSpecTool(server);
}

/**
 * Start MCP Server
 * Uses stdio transport to communicate with MCP Host.
 */
async function startServer(): Promise<void> {
  try {
    registerAllTools();

    const transport = new StdioServerTransport();
    await server.connect(transport);

    logger.log('info', {
      message: 'MCP server started successfully',
      name: serverName,
      version: serverVersion,
      transport: 'stdio',
      environment: config.env,
    });

    /**
     * Graceful shutdown handling
     */
    const shutdown = async (): Promise<void> => {
      logger.log('info', 'Shutting down MCP server...');
      await server.close();
      process.exit(0);
    };

    process.on('SIGINT', () => {
      void shutdown();
    });
    process.on('SIGTERM', () => {
      void shutdown();
    });
  } catch (error) {
    logger.log('error', { message: 'Failed to start MCP server', error });
    process.exit(1);
  }
}

// Start server
startServer().catch((error: unknown) => {
  logger.log('error', { message: 'Unhandled error during server startup', error });
  process.exit(1);
});
