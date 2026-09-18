import { z } from 'zod';

/**
 * get_api_spec tool output schema
 * Complete API spec including request/response schemas
 *
 * The three dereferenced OAS fragments below (`parameters` items, `requestBody`,
 * `responses` values) are spelled `z.object({}).passthrough()` — an object of any shape.
 *
 * Deliberately not `z.unknown()`: that compiles to a bare `{}` in the advertised JSON
 * Schema, a node carrying no validation keyword at all. Some MCP clients refuse or
 * mishandle such a node, so a tool can work in one host and fail in another (see
 * `stripToolSchemaDialect` in src/server.ts for a case where a schema detail silently
 * stopped tool calls in Claude Desktop). This states the one thing that always holds
 * while leaving the contents unconstrained (`additionalProperties: true`).
 *
 * Deliberately repeated rather than extracted into a shared constant: the SDK's
 * Zod-to-JSON-Schema conversion emits a shared instance once and points the later uses
 * at it with `$ref: "#/properties/..."`, which trades one portability risk for another —
 * a client that does not resolve internal pointers is left with no schema at all. A
 * fresh instance per field keeps every occurrence inline.
 *
 * Because the MCP SDK also validates `structuredContent` against this schema before the
 * result leaves the server, every generated spec is checked against it in
 * test/tools/api-specs/schema/get-api-spec.output.schema.test.ts.
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
  parameters: z.array(z.object({}).passthrough()).optional().describe('List of API parameters'),
  requestBody: z.object({}).passthrough().optional().describe('Request body schema'),
  responses: z.record(z.object({}).passthrough()).describe('Response schemas by status code'),
};
