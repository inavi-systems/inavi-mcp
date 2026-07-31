/**
 * SDK Documentation MCP Tool
 * iNavi Maps Web JS SDK documentation query tool
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { logger } from '@/utils/logger';
import { readSdkIndex, readSdkDoc } from './utils/sdk-doc-reader';
import { listSdkDocsInputSchema } from './schema/list-sdk-docs.input.schema';
import { listSdkDocsOutputSchema } from './schema/list-sdk-docs.output.schema';
import { getSdkDocInputSchema } from './schema/get-sdk-doc.input.schema';

/**
 * Register list_sdk_docs tool
 * Query available iNavi Maps SDK documentation list
 */
export function registerListSdkDocsTool(server: McpServer): void {
  server.registerTool(
    'list_sdk_docs',
    {
      title: 'Browse iNavi Maps SDK Documentation',
      description:
        'Lists iNavi Maps JavaScript SDK symbols (classes and option/type definitions), each with its ' +
        'method names so you can infer capability before fetching details. ' +
        'Can be filtered by category. ' +
        'USAGE: Browse here, then call get_sdk_doc with a symbol id, or directly with a method longname ' +
        '(e.g., inavi.maps.Map#fitBounds) shown in the methods list. ' +
        'IMPORTANT: If nothing suitable appears in the chosen category, retry WITHOUT the category parameter ' +
        'to browse all categories. ' +
        'NOTE: For building a map, START from list_map_examples (render-ready templates); use this tool to look up the exact options/methods/events/types needed to customize or extend beyond what an example shows.',
      inputSchema: listSdkDocsInputSchema,
      outputSchema: listSdkDocsOutputSchema,
    },
    async ({ category }) => {
      try {
        logger.log('info', { message: 'Listing SDK docs', category });

        const index = await readSdkIndex(category);

        const output = {
          docs: index.docs,
          totalCount: index.docs.length,
          filters: { category },
        };

        logger.log('info', {
          message: 'SDK docs listed',
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
        logger.log('error', { message: 'Failed to list SDK docs', error });
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to list SDK docs: ${errorMessage}`);
      }
    },
  );
}

/**
 * Register get_sdk_doc tool
 * Retrieve detailed SDK documentation for a class, type, or single method
 */
export function registerGetSdkDocTool(server: McpServer): void {
  server.registerTool(
    'get_sdk_doc',
    {
      title: 'Get iNavi Maps SDK Documentation',
      description:
        'Retrieves SDK documentation for a specific symbol as clean Markdown. ' +
        'Provide a class/type id for the whole symbol (description, constructor, method signatures, ' +
        'parameters, return types, events, referenced value types), or a method longname ' +
        '(e.g., inavi.maps.Map#fitBounds) to get just that method. ' +
        'PREREQUISITE: Use list_sdk_docs to obtain ids and method names. ' +
        'NOTE: Referenced option/complex types are shown as Markdown links whose target is the docId to pass ' +
        'back into this tool. For a render-ready base use get_map_example; use this to fill in the exact ' +
        'signatures/options/events an example does not show. Method-level usage examples are omitted here.',
      inputSchema: getSdkDocInputSchema,
    },
    async ({ docId }) => {
      try {
        logger.log('info', { message: 'Getting SDK doc', docId });

        const result = await readSdkDoc(docId);

        logger.log('info', { message: 'SDK doc retrieved', docId });

        return {
          content: [
            {
              type: 'text',
              text: result.content,
            },
          ],
        };
      } catch (error) {
        logger.log('error', { message: 'Failed to get SDK doc', docId, error });
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(
          `Failed to get SDK doc for "${docId}". ` +
            `Use list_sdk_docs to see available documents. Error: ${errorMessage}`,
        );
      }
    },
  );
}
