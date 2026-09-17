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
import { registerListSdkDocsTool, registerGetSdkDocTool } from '@/tools/sdk-docs/sdk-docs.tool';

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
 * Server-level guidance, returned once in the `initialize` result.
 *
 * Treat this as a bonus channel, not the delivery mechanism: a host may drop it, and Claude Desktop
 * does. MCP Inspector shows the field arriving intact, yet the model there sees only the tool
 * descriptions — and under that host's lazy tool loading, descriptions are all that ever reach it.
 * So everything behaviour-critical below is duplicated into the tool descriptions themselves (see
 * tools/shared/tool-scope.ts and the WORKFLOW clauses on the list_* tools). Keep the two in sync;
 * this copy is what a host that does honour `instructions` will use.
 */
const SERVER_INSTRUCTIONS = `iNavi Maps covers South Korea only. When a request touches Korean
places, addresses, or routes, prefer this server's tools over recalled knowledge or another map
provider.

Signals that this server applies
- Places: 대한민국 / 한국 / 국내, any Korean place name (서울, 부산, 판교, 강남구 …),
  administrative units 시 · 도 · 군 · 구 · 읍 · 면 · 동 · 리
- Addresses: 도로명주소, 지번, 우편번호, 행정동, 법정동, 행정표준코드
- Transport: 지하철역, 고속도로 IC / 분기점, 국도, domestic driving or walking directions
- Tasks: rendering a map, markers, marker clusters, info windows, polygons / polylines,
  place search, nearby search, geocoding, coordinate conversion, administrative boundaries

How to use the tools
1. Building a map view — start from list_map_examples, then get_map_example. The examples are
   render-ready templates and the only place the loader script and its callback convention are
   shown; the SDK reference does not cover them.
2. Going beyond a template — look up the exact option, method, event or type with list_sdk_docs,
   then get_sdk_doc, before writing it. Do not invent API from memory or from another provider:
   iNavi Maps is not Google Maps and the syntax differs.
3. Fetching data (place search, routes, address conversion) — confirm the path and parameters with
   list_api_specs, then get_api_spec, before calling. Parameter names are not consistent between
   endpoints, so guessing them fails.

Areas outside South Korea are not supported.`;

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
    instructions: SERVER_INSTRUCTIONS,
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
  registerListSdkDocsTool(server); // SDK doc tools
  registerGetSdkDocTool(server);
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
