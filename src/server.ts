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
 * Recursively delete `$schema` dialect declarations from a JSON Schema value.
 */
function deleteSchemaDialect(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(deleteSchemaDialect);
    return;
  }
  if (value !== null && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    delete obj.$schema;
    Object.values(obj).forEach(deleteSchemaDialect);
  }
}

/**
 * Strip the JSON Schema dialect (`$schema`) from tool schemas in an outgoing
 * `tools/list` response, mutating the message in place.
 *
 * The MCP SDK converts Zod schemas with a fixed `draft-07` target and stamps
 * `"$schema": "http://json-schema.org/draft-07/schema#"` onto every tool
 * input/output schema, with no option to change it. MCP Hosts that compile these
 * schemas with a draft-2020-12 validator (e.g. recent Claude Desktop builds)
 * throw at compile time ("no schema with ref draft-07"), which aborts the tool
 * call before it is sent to the server. These schemas only use keywords shared by
 * both drafts, so removing the dialect tag lets either validator compile them.
 * Server-side output validation is unaffected — the SDK validates against Zod.
 */
function stripToolSchemaDialect(message: unknown): void {
  if (message === null || typeof message !== 'object') {
    return;
  }
  const result = (message as { result?: { tools?: unknown[] } }).result;
  if (!result || !Array.isArray(result.tools)) {
    return;
  }
  for (const tool of result.tools) {
    const { inputSchema, outputSchema } = tool as {
      inputSchema?: unknown;
      outputSchema?: unknown;
    };
    deleteSchemaDialect(inputSchema);
    deleteSchemaDialect(outputSchema);
  }
}

/**
 * Start MCP Server
 * Uses stdio transport to communicate with MCP Host.
 */
async function startServer(): Promise<void> {
  try {
    registerAllTools();

    const transport = new StdioServerTransport();

    // Remove the draft-07 `$schema` tag from tool schemas before they leave the
    // server (see stripToolSchemaDialect for why). Wraps the transport's send.
    const originalSend = transport.send.bind(transport);
    transport.send = (message): Promise<void> => {
      stripToolSchemaDialect(message);
      return originalSend(message);
    };

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
