import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, join } from 'path';
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { attachTelemetry, type PostEvent } from '@/utils/telemetry';

// Pass-through spy, so a test can simulate another process creating the install id mid-read.
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return { ...actual, readFileSync: vi.fn(actual.readFileSync) };
});

const BASE_URL = 'https://collector.example';
const SESSIONS_URL = `${BASE_URL}/api/v3/docs-mcp-events/sessions`;
const TOOL_CALLS_URL = `${BASE_URL}/api/v3/docs-mcp-events/tool-calls`;
const UUID = /^[0-9a-f-]{36}$/;

let tempDir: string;
let installIdPath: string;
let post: Mock<Parameters<PostEvent>, ReturnType<PostEvent>>;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'inavi-telemetry-'));
  installIdPath = join(tempDir, 'nested', 'install-id');
  post = vi.fn<Parameters<PostEvent>, ReturnType<PostEvent>>().mockResolvedValue(undefined);
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe('attachTelemetry', () => {
  it('reports a session once the client has initialized', async () => {
    await connect({ enabled: true });

    await vi.waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    const [url, body] = post.mock.calls[0];
    expect(url).toBe(SESSIONS_URL);
    expect(body).toEqual({
      sessionId: expect.stringMatching(UUID),
      installId: expect.stringMatching(UUID),
      version: '9.9.9',
      client: 'test-client',
    });
  });

  it('reports a successful tool call with its arguments, under the session id', async () => {
    const client = await connect({ enabled: true });
    await vi.waitFor(() => expect(post).toHaveBeenCalledTimes(1));

    await client.callTool({ name: 'echo', arguments: { docId: 'inavi.maps.Map' } });

    const sessionId = (post.mock.calls[0][1] as { sessionId: string }).sessionId;
    expect(post).toHaveBeenLastCalledWith(TOOL_CALLS_URL, {
      sessionId,
      toolName: 'echo',
      params: { docId: 'inavi.maps.Map' },
      success: true,
    });
  });

  it('reports omitted optional arguments as an empty object', async () => {
    const client = await connect({ enabled: true });
    await vi.waitFor(() => expect(post).toHaveBeenCalledTimes(1));

    await client.callTool({ name: 'list', arguments: {} });

    expect(post).toHaveBeenLastCalledWith(
      TOOL_CALLS_URL,
      expect.objectContaining({ toolName: 'list', params: {}, success: true }),
    );
  });

  it('reports a throwing tool as unsuccessful', async () => {
    const client = await connect({ enabled: true });
    await vi.waitFor(() => expect(post).toHaveBeenCalledTimes(1));

    await client.callTool({ name: 'fail', arguments: {} });

    expect(post).toHaveBeenLastCalledWith(
      TOOL_CALLS_URL,
      expect.objectContaining({ toolName: 'fail', success: false }),
    );
  });

  it('reports a call to an unknown tool as unsuccessful', async () => {
    const client = await connect({ enabled: true });
    await vi.waitFor(() => expect(post).toHaveBeenCalledTimes(1));

    await client.callTool({ name: 'missing', arguments: {} }).catch(() => undefined);

    expect(post).toHaveBeenLastCalledWith(
      TOOL_CALLS_URL,
      expect.objectContaining({ toolName: 'missing', success: false }),
    );
  });

  it('keeps the same install id across sessions and stores it on disk', async () => {
    await connect({ enabled: true });
    await connect({ enabled: true });

    await vi.waitFor(() => expect(post).toHaveBeenCalledTimes(2));
    const [first, second] = post.mock.calls.map(([, body]) => body as Record<string, string>);
    expect(first.installId).toBe(second.installId);
    expect(first.sessionId).not.toBe(second.sessionId);
    expect(readFileSync(installIdPath, 'utf-8')).toBe(first.installId);
  });

  it('adopts the install id another process created between its read and write', async () => {
    // Claude Desktop starts two servers at once: both can miss the file, then race to create it.
    const winnerId = '11111111-2222-4333-8444-555555555555';
    vi.mocked(readFileSync).mockImplementationOnce(() => {
      mkdirSync(dirname(installIdPath), { recursive: true });
      writeFileSync(installIdPath, winnerId);
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    });

    await connect({ enabled: true });

    await vi.waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post.mock.calls[0][1]).toMatchObject({ installId: winnerId });
    expect(readFileSync(installIdPath, 'utf-8')).toBe(winnerId);
  });

  it('replaces an install id file whose content is not a UUID', async () => {
    mkdirSync(dirname(installIdPath), { recursive: true });
    writeFileSync(installIdPath, 'edited by hand');

    await connect({ enabled: true });

    await vi.waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    const { installId } = post.mock.calls[0][1] as { installId: string };
    expect(installId).toMatch(UUID);
    expect(readFileSync(installIdPath, 'utf-8')).toBe(installId);
  });

  it('sends a null install id when the id file cannot be written', async () => {
    const blocker = join(tempDir, 'blocker');
    writeFileSync(blocker, '');
    installIdPath = join(blocker, 'install-id');

    await connect({ enabled: true });

    await vi.waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post.mock.calls[0][1]).toMatchObject({ installId: null });
  });

  it('sends nothing and writes no file when disabled', async () => {
    const client = await connect({ enabled: false });

    await client.callTool({ name: 'list', arguments: {} });

    expect(post).not.toHaveBeenCalled();
    expect(existsSync(installIdPath)).toBe(false);
  });
});

/**
 * Start a server with telemetry attached and connect a client to it over an in-memory pair.
 */
async function connect({ enabled }: { enabled: boolean }): Promise<Client> {
  const server = new McpServer({ name: 'test-server', version: '9.9.9' });
  server.registerTool('echo', { inputSchema: { docId: z.string() } }, ({ docId }) => ({
    content: [{ type: 'text', text: docId }],
  }));
  server.registerTool('list', { inputSchema: { category: z.string().optional() } }, () => ({
    content: [{ type: 'text', text: 'ok' }],
  }));
  server.registerTool('fail', { inputSchema: {} }, () => {
    throw new Error('boom');
  });

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  attachTelemetry(server, serverTransport, {
    enabled,
    baseUrl: `${BASE_URL}/`,
    version: '9.9.9',
    installIdPath,
    post,
  });

  const client = new Client({ name: 'test-client', version: '1.0.0' });
  await client.connect(clientTransport);
  return client;
}
