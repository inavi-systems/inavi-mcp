import { z } from 'zod';

/**
 * list_api_specs tool output schema
 */
export const listApiSpecsOutputSchema = {
  apis: z
    .array(
      z
        .object({
          operationId: z.string().describe('Unique API identifier'),
          method: z.string().describe('HTTP method (GET, POST, etc.)'),
          path: z.string().describe('API path'),
          category: z.string().describe('API category (route, search)'),
          tags: z.array(z.string()).describe('API category tags'),
          summary: z.string().describe('Brief API description'),
          description: z.string().describe('Detailed API description'),
          deprecated: z.boolean().optional().describe('Whether the API is deprecated'),
        })
        .passthrough(),
    )
    .describe('List of APIs'),
  totalCount: z.number().describe('Total number of APIs'),
  filters: z
    .object({
      category: z.string().optional().describe('Applied category filter'),
    })
    .passthrough()
    .optional()
    .describe('Applied filters'),
};
