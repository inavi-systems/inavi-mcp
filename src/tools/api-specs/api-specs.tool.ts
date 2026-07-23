/**
 * API Specifications MCP Tool
 * OpenAPI Spec-based API documentation query tool
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { logger } from '@/utils/logger';
import { readApiIndex, readApiSpec } from './utils/api-spec-reader';
import { listApiSpecsInputSchema } from './schema/list-api-specs.input.schema';
import { listApiSpecsOutputSchema } from './schema/list-api-specs.output.schema';
import { getApiSpecInputSchema } from './schema/get-api-spec.input.schema';
import { getApiSpecOutputSchema } from './schema/get-api-spec.output.schema';

/**
 * Register list_api_specs tool
 * Query available iNavi Maps API list
 */
export function registerListApiSpecsTool(server: McpServer): void {
  server.registerTool(
    'list_api_specs',
    {
      title: 'Browse iNavi Maps API Specifications',
      description:
        'Lists available iNavi Maps APIs. ' +
        'Can be filtered by category. ' +
        'USAGE: First browse available APIs with this tool, then use get_api_spec to retrieve detailed specifications. ' +
        'FILTERING: Filter by category (e.g., search-place, route-directions). ' +
        'IMPORTANT: Some APIs may be categorized differently than expected. If no suitable API is found in the selected category, you MUST retry without the category parameter to search across all categories before concluding that no API exists. ' +
        'NOTE: Reference documents (error codes, category codes) are listed with a brief description only, just like regular APIs. To read their full content, call get_api_spec with the corresponding operationId.',
      inputSchema: listApiSpecsInputSchema,
      outputSchema: listApiSpecsOutputSchema,
    },
    async ({ category }) => {
      try {
        logger.log('info', { message: 'Listing API specs', category });

        const index = await readApiIndex(category);

        const output = {
          apis: index.apis,
          totalCount: index.apis.length,
          filters: { category },
        };

        logger.log('info', {
          message: 'API specs listed',
          totalCount: output.totalCount,
          category: category ?? 'all',
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(output, null, 2),
            },
          ],
          structuredContent: output,
        };
      } catch (error) {
        logger.log('error', { message: 'Failed to list API specs', error });
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to list API specs: ${errorMessage}`);
      }
    },
  );
}

/**
 * Register get_api_spec tool
 * Retrieve detailed specification of a specific API
 */
export function registerGetApiSpecTool(server: McpServer): void {
  server.registerTool(
    'get_api_spec',
    {
      title: 'Get iNavi Maps API Specification',
      description:
        'Retrieves detailed specification of a specific API (including request/response schemas). ' +
        'PREREQUISITE: First use list_api_specs to browse available APIs and obtain the operationId. ' +
        'USAGE: Provide an operationId to get the complete API specification including parameters, request body, and response schemas. ' +
        'NOTE: All $ref references have already been dereferenced to actual schema contents.',
      inputSchema: getApiSpecInputSchema,
      outputSchema: getApiSpecOutputSchema,
    },
    async ({ operationId }) => {
      try {
        logger.log('info', { message: 'Getting API spec', operationId });

        // API 스펙 파일 읽기
        const spec = await readApiSpec(operationId);

        logger.log('info', { message: 'API spec retrieved', operationId });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(spec, null, 2),
            },
          ],
          structuredContent: spec,
        };
      } catch (error) {
        logger.log('error', { message: 'Failed to get API spec', operationId, error });
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(
          `Failed to get API spec for "${operationId}". ` +
            `Use list_api_specs to see available APIs. Error: ${errorMessage}`,
        );
      }
    },
  );
}
