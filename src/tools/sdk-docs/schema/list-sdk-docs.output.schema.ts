import { z } from 'zod';

/**
 * list_sdk_docs tool output schema
 */
export const listSdkDocsOutputSchema = {
  docs: z
    .array(
      z
        .object({
          id: z.string().describe('Document identifier (e.g., inavi.maps.Map, MapOptions)'),
          category: z
            .string()
            .describe('SDK category (map, overlay, control, coordinates, options, style)'),
          kind: z.string().describe('Document kind: class or type'),
          name: z.string().describe('Short symbol name'),
          summary: z.string().describe('Brief description'),
          methods: z
            .array(z.string())
            .describe('Method names (for classes) — infer capability, then fetch a specific one'),
        })
        .passthrough(),
    )
    .describe('List of SDK documents'),
  totalCount: z.number().describe('Total number of documents'),
  filters: z
    .object({
      category: z.string().optional().describe('Applied category filter'),
    })
    .passthrough()
    .optional()
    .describe('Applied filters'),
};
