import { z } from 'zod';

/**
 * get_sdk_doc tool input schema
 */
export const getSdkDocInputSchema = {
  docId: z
    .string()
    .describe(
      'Document identifier to retrieve. Either a class/type id (e.g., "inavi.maps.Map", "MapOptions") ' +
        'to get the whole symbol, or a method longname (e.g., "inavi.maps.Map#fitBounds") to get just that ' +
        'method. Use list_sdk_docs to browse ids and method names.',
    ),
};
