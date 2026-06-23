import { z } from 'zod';

/**
 * Input schema for get_map_example tool
 */
export const getMapExampleInputSchema = {
  id: z
    .string()
    .min(1)
    .describe(
      'Example ID to retrieve (e.g., "marker-basic", "shapes-polyline"). ' +
        'Use list_map_examples tool first to see available IDs.',
    ),
};
