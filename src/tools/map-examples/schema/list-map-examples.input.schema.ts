import { z } from 'zod';

/**
 * Input schema for list_map_examples tool
 * Allows optional category filtering
 */
export const listMapExamplesInputSchema = {
  category: z
    .enum(['dynamic-maps', 'marker', 'infowindow', 'shapes'])
    .optional()
    .describe(
      'Filter examples by category. Options: ' +
        '"dynamic-maps" (basic interactive maps), ' +
        '"marker" (marker display and clustering), ' +
        '"infowindow" (InfoWindow creation and visibility control), ' +
        '"shapes" (geometric shapes like circles, polygons, and polylines — also known as 피처/features on iNavi platform). ' +
        'If not specified, returns all examples.',
    ),
};
