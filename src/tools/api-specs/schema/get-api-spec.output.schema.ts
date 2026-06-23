import { z } from 'zod';

/**
 * get_api_spec tool output schema
 * Complete API spec including request/response schemas
 */
export const getApiSpecOutputSchema = {
  operationId: z.string().describe('Unique API identifier'),
  method: z.string().describe('HTTP method'),
  path: z.string().describe('API path'),
  category: z.string().describe('API category (route, search)'),
  baseUrl: z.string().describe('Base URL'),
  tags: z.array(z.string()).describe('API category tags'),
  summary: z.string().describe('Brief API description'),
  description: z.string().describe('Detailed API description'),
  deprecated: z.boolean().optional().describe('Whether the API is deprecated'),
  parameters: z.array(z.unknown()).optional().describe('List of API parameters'),
  requestBody: z.unknown().optional().describe('Request body schema'),
  responses: z.record(z.unknown()).describe('Response schemas by status code'),
};
