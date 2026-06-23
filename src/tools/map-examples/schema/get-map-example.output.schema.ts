import { z } from 'zod';

/**
 * Full metadata schema for detailed example information (Tier 2)
 * Contains complete metadata for a specific example
 *
 * Returned only when user selects a specific example to view
 */
const fullMetadataSchema = z.object({
  id: z.string().describe('Unique identifier for the example'),
  category: z
    .enum(['dynamic-maps', 'marker', 'infowindow', 'shapes'])
    .describe('Category of the example'),
  title: z.string().describe('Full title with provider information'),
  description: z.string().describe('Detailed description of what the example demonstrates'),
  keywords: z.array(z.string()).describe('Complete list of search keywords'),
  useCases: z.array(z.string()).describe('Common use cases for this example'),
  features: z.array(z.string()).describe('Features demonstrated in this example'),
});

/**
 * Output schema for get_map_example tool
 */
export const getMapExampleOutputSchema = {
  metadata: fullMetadataSchema.describe('Complete metadata for the selected example'),
  htmlContent: z.string().describe('Complete HTML template code with iNavi Maps API integration'),
};
