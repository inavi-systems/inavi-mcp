import { describe, it, expect, beforeAll } from 'vitest';
import { z } from 'zod';
import { readApiIndex, readApiSpec } from '@/tools/api-specs/utils/api-spec-reader';
import { getApiSpecOutputSchema } from '@/tools/api-specs/schema/get-api-spec.output.schema';

/**
 * The MCP SDK validates a tool result's `structuredContent` against `z.object(outputSchema)`
 * before it leaves the server, and rejects the call with `Output validation error` on failure.
 * `get_api_spec` returns a spec file verbatim, so a file the schema does not accept breaks
 * that API at runtime.
 *
 * public/api-docs is regenerated from the upstream OAS by `npm run update-api-docs`, so this
 * has to be re-checked rather than confirmed once.
 */
const outputSchema = z.object(getApiSpecOutputSchema);

interface Failure {
  operationId: string;
  message: string;
}

type ParseResult = { success: true } | { success: false; error: z.ZodError };

let operationIds: string[];

describe('get_api_spec output schema', () => {
  beforeAll(async () => {
    const index = await readApiIndex();
    operationIds = index.apis.map((api) => api.operationId);

    expect(
      operationIds.length,
      'no API specs found — run "npm run update-api-docs" first',
    ).toBeGreaterThan(0);
  });

  it('accepts every generated API spec', async () => {
    const failures = await collectFailures((spec) => outputSchema.safeParse(spec));

    expect(failures, formatFailures(failures)).toEqual([]);
  });

  it('accepts every generated API spec with no unknown top-level keys', async () => {
    // The advertised JSON Schema compiles to `additionalProperties: false` at the top level,
    // so a client that validates structuredContent strictly rejects extra keys even though
    // the SDK's own (stripping) parse would let them through.
    const failures = await collectFailures((spec) => outputSchema.strict().safeParse(spec));

    expect(failures, formatFailures(failures)).toEqual([]);
  });
});

async function collectFailures(parse: (spec: unknown) => ParseResult): Promise<Failure[]> {
  const results = await Promise.all(
    operationIds.map(async (operationId) => {
      const result = parse(await readApiSpec(operationId));
      return result.success ? null : { operationId, message: formatIssues(result.error) };
    }),
  );

  return results.filter((result): result is Failure => result !== null);
}

function formatFailures(failures: Failure[]): string {
  return failures.length === 0
    ? ''
    : `${failures.length} spec(s) rejected by the output schema:\n` +
        failures.map((failure) => `  ${failure.operationId}: ${failure.message}`).join('\n');
}

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join('.') || '(root)'} — ${issue.message}`)
    .join('; ');
}
