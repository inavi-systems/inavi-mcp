import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { logger } from '@/utils/logger';
import { readFile } from 'fs/promises';
import { join, resolve } from 'path';
import { config } from '@/config/env.config';
import {
  getExampleById,
  getExamplesByCategory,
  MAP_EXAMPLES_REGISTRY,
} from './registry/examples.registry';
import { listMapExamplesInputSchema } from './schema/list-map-examples.input.schema';
import { listMapExamplesOutputSchema } from './schema/list-map-examples.output.schema';
import { getMapExampleInputSchema } from './schema/get-map-example.input.schema';
import { getMapExampleOutputSchema } from './schema/get-map-example.output.schema';
import { toSummary, toFullMetadata } from './utils/metadata-transformer';
import { KOREA_ONLY_SCOPE } from '@/tools/shared/tool-scope';

// Calculate project root directory (dist/tools/map-examples -> project root)
// __dirname points to the built dist/tools/map-examples directory
const projectRoot = resolve(__dirname, '../../..');

/**
 * Customization policy returned with every example.
 *
 * Lives here rather than in the HTML files: it used to be duplicated as a banner comment in 16 of
 * the 18 templates, which made it expensive to change and — once the SDK doc tools arrived — wrong,
 * since the banner forbade exactly the extension the doc tools exist to support.
 */
const MAP_EXAMPLE_COMMON_WARNING =
  'CUSTOMIZING: Data values (coordinates, zoom, labels, colors) can be replaced freely. ' +
  'Options, methods, events or styles the template does not show may be added, but verify each one ' +
  'with get_sdk_doc first — never invent API from memory or another provider, as iNavi Maps and ' +
  'Google Maps differ in syntax.';

/**
 * Replace placeholder values in HTML with actual environment variable values
 * @param htmlContent - Raw HTML content with placeholders
 * @returns HTML content with replaced values
 */
function replacePlaceholders(htmlContent: string): string {
  return htmlContent.replace(/\{base_url\}/g, config.inavi.baseUrl);
}

/**
 * Register tool: list_map_examples
 * Returns a list of available map examples with metadata
 */
export function registerListMapExamplesTool(server: McpServer): void {
  server.registerTool(
    'list_map_examples',
    {
      title: 'Browse iNavi Map Examples',
      description:
        'Browse render-ready iNavi Maps HTML examples. ' +
        'Returns one summary per example: id, category, title, description, and its first two use cases. ' +
        'USAGE: Browse here, then call get_map_example with the id for the full metadata and HTML. ' +
        'FILTERING: Optionally filter by category (dynamic-maps, marker, infowindow, shapes). ' +
        'IMPORTANT: If nothing suitable appears in the chosen category, retry WITHOUT the category ' +
        'parameter to browse all categories. ' +
        'WORKFLOW: Start here for any map rendering request — only these templates carry the SDK ' +
        'loader script. For anything a template omits, look it up with list_sdk_docs / get_sdk_doc. ' +
        KOREA_ONLY_SCOPE,
      inputSchema: listMapExamplesInputSchema,
      outputSchema: listMapExamplesOutputSchema,
    },
    ({ category }) => {
      try {
        logger.log('info', { message: 'Listing map examples', category: category ?? 'all' });

        const examples = getExamplesByCategory(category);

        // Transform to lightweight summaries for token efficiency
        const examplesOutput = examples.map(toSummary);

        const output = {
          examples: examplesOutput,
          totalCount: examplesOutput.length,
          category,
        };

        logger.log('info', {
          message: 'Map examples listed successfully',
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
        logger.log('error', { message: 'Failed to list map examples', error });
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to list map examples: ${errorMessage}`);
      }
    },
  );
}

/**
 * Register tool: get_map_example
 * Retrieves a specific map example HTML by ID
 */
export function registerGetMapExampleTool(server: McpServer): void {
  server.registerTool(
    'get_map_example',
    {
      title: 'Get iNavi Map Example HTML',
      description:
        'Retrieve one iNavi Maps HTML example by id, with its full metadata ' +
        '(description, keywords, use cases, features) and the complete HTML template. ' +
        'PREREQUISITE: Use list_map_examples to find the id. ' +
        'LOADER: The template ends with the SDK loader script. Its domain is filled in, but ' +
        '{appKey} is left as a placeholder — substitute a real application key before the page will run. ' +
        MAP_EXAMPLE_COMMON_WARNING,
      inputSchema: getMapExampleInputSchema,
      outputSchema: getMapExampleOutputSchema,
    },
    async ({ id }) => {
      try {
        logger.log('info', {
          message: 'Retrieving map example',
          id,
        });

        // Find example in registry
        const example = getExampleById(id);
        if (!example) {
          const availableIds = MAP_EXAMPLES_REGISTRY.map((e) => e.id).join(', ');
          const errorMsg =
            `Example ID "${id}" not found. ` +
            `Available IDs: ${availableIds}. ` +
            'Use list_map_examples tool to see detailed information about each example.';
          logger.log('warning', {
            message: 'Example not found',
            id,
            availableIds,
          });
          throw new Error(errorMsg);
        }

        // Read HTML file
        const htmlPath = join(projectRoot, 'public', example.filename);
        const rawHtml = await readFile(htmlPath, 'utf-8');
        const htmlContent = replacePlaceholders(rawHtml);

        // Transform to full metadata (includes all details except filename)
        const metadata = toFullMetadata(example);

        const output = {
          metadata,
          htmlContent,
        };

        logger.log('info', {
          message: 'Map example retrieved successfully',
          id,
          title: example.title,
          htmlPath,
        });

        return {
          content: [
            {
              type: 'text',
              text: htmlContent,
            },
          ],
          structuredContent: output,
        };
      } catch (error) {
        logger.log('error', { message: 'Failed to retrieve map example', error });
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to retrieve map example: ${errorMessage}`);
      }
    },
  );
}
