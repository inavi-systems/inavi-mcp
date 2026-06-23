import { z } from 'zod';

/**
 * get_api_spec tool input schema
 */
export const getApiSpecInputSchema = {
  operationId: z
    .string()
    .describe('Unique identifier of the API to retrieve (e.g., getRouteTimeResult)'),
};
