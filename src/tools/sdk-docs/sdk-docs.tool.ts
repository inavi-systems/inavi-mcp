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
import { KOREA_ONLY_SCOPE } from '@/tools/shared/tool-scope';

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
        'Lists iNavi Maps JavaScript SDK symbols — classes and option/type definitions. ' +
        'Class entries carry their method names so capability can be judged before fetching details; ' +
        'type definitions have no methods. ' +
        'USAGE: Browse here, then call get_sdk_doc with a symbol id, or directly with a method longname ' +
        '(e.g., inavi.maps.Map#fitBounds) shown in the methods list. ' +
        'FILTERING: Optionally filter by category. ' +
        'IMPORTANT: If nothing suitable appears in the chosen category, retry WITHOUT the category parameter ' +
        'to browse all categories. ' +
        'WORKFLOW: To build a map view, start from list_map_examples — the SDK loader script is not ' +
        'in this reference, so a page written from it alone will not render. ' +
        KOREA_ONLY_SCOPE,
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
        'Retrieves SDK documentation for one symbol as Markdown. ' +
        'Pass a class/type id for the whole symbol (description, constructor, method signatures, ' +
        'parameters, return types, events, referenced value types), or a method longname ' +
        '(e.g., inavi.maps.Map#fitBounds) for just that method. ' +
        'PREREQUISITE: Use list_sdk_docs to obtain ids and method names. ' +
        'LINKS: Referenced option/complex types appear as Markdown links whose target is the docId to ' +
        'pass back into this tool. ' +
        'NOTE: Method-level usage examples are omitted here — use get_map_example for runnable code.',
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
