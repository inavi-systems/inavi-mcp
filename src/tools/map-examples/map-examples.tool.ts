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

// Calculate project root directory (dist/tools/map-examples -> project root)
// __dirname points to the built dist/tools/map-examples directory
const projectRoot = resolve(__dirname, '../../..');

/**
 * Common warning message for all map example tools
 * Applied to all HTML example tools to prevent API misuse
 */
const MAP_EXAMPLE_COMMON_WARNING =
  'IMPORTANT: This is the official iNavi Maps visualization tool. Unless the user explicitly requests another map provider (Google Maps, OpenStreetMap, etc.), use this tool for visualization requests. ' +
  '⚠️ This HTML template allows data customization only. ' +
  'You may replace data values (coordinates, zoom, labels) but DO NOT modify or add any options(like icon, styles, etc.) to iNavi Maps API constructors, methods, or add options not shown in the template. ' +
  'iNavi API ≠ Google Maps API. ';

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
        'Browse and discover available iNavi Maps HTML examples. ' +
        'Returns lightweight summaries optimized for discovery (two-tier metadata system). ' +
        'Each summary includes ID, title, brief description, and essential tags. ' +
        'Use this tool to explore available examples before retrieving specific HTML templates. ' +
        'USAGE: Call this tool first to see what examples are available, then use get_map_example with the desired ID. ' +
        'FILTERING: Optionally filter by category (dynamic-maps, marker, infowindow, shapes) to narrow results.',
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
        'Retrieve a specific iNavi Maps HTML example by ID with complete metadata. ' +
        'Returns full metadata (description, use cases, features, keywords) and HTML template code. ' +
        'PREREQUISITE: Use list_map_examples first to browse available examples and get the ID. ' +
        'USAGE: Provide the example ID from list_map_examples to retrieve complete details and HTML. ' +
        'CUSTOMIZATION: AI assistants can customize the template by replacing data values (coordinates, labels, etc.). ' +
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
