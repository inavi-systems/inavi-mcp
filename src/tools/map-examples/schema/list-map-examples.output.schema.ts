import { z } from 'zod';

/**
 * Summary schema for listing examples (Tier 1 - Revised)
 * Compromise: Full description + 2 useCases for better AI discoverability
 *
 * Target: ~71 tokens per example (285 chars)
 * For 100 examples: ~7,100 tokens (62% reduction from original)
 * Trade-off: Slightly over 5,000 target but includes complete description
 */
const exampleSummarySchema = z.object({
  id: z.string().describe('Unique identifier for the example'),
  category: z
    .enum(['dynamic-maps', 'marker', 'infowindow', 'shapes'])
    .describe('Category of the example'),
  title: z.string().describe('Concise title without provider suffix'),
  description: z.string().describe('Full description of what the example demonstrates'),
  useCases: z.array(z.string()).describe('Primary use cases (top 2 for context)'),
});

/**
 * Output schema for list_map_examples tool
 */
export const listMapExamplesOutputSchema = {
  examples: z
    .array(exampleSummarySchema)
    .describe('List of available map examples (lightweight summaries)'),
  totalCount: z.number().describe('Total number of examples returned'),
  category: z
    .enum(['dynamic-maps', 'marker', 'infowindow', 'shapes'])
    .optional()
    .describe('Category filter applied (if any)'),
};
