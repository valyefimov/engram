import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { describe, expect, it } from 'vitest';
import { createServer } from '../src/mcp/server.js';
import { tempEngram } from './helpers.js';

async function connect() {
  const engram = tempEngram();
  const server = createServer(engram);
  const [a, b] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test', version: '0' });
  await Promise.all([server.connect(a), client.connect(b)]);
  const call = async (name: string, args: Record<string, unknown> = {}) => {
    const res = (await client.callTool({ name, arguments: args })) as { content: { text: string }[]; isError?: boolean };
    return { text: res.content[0]!.text, isError: !!res.isError };
  };
  return { engram, client, call };
}

describe('MCP server', () => {
  it('advertises instructions, tools and skill prompts', async () => {
    const { client } = await connect();
    expect(client.getInstructions()).toContain('long-term memory');
    const tools = (await client.listTools()).tools.map((t) => t.name);
    expect(tools).toEqual(expect.arrayContaining(['engram_remember', 'engram_recall', 'engram_why', 'engram_check', 'engram_session_start']));
    const prompts = (await client.listPrompts()).prompts.map((p) => p.name);
    expect(prompts).toEqual(expect.arrayContaining(['remember-decision', 'recall', 'why-we-did-this', 'avoid-past-mistakes']));
  });

  it('runs a full session loop', async () => {
    const { call, engram } = await connect();
    expect((await call('engram_session_start', { goal: 'payments' })).text).toContain('Session s_');
    const r = await call('engram_remember', {
      kind: 'pitfall',
      title: 'Payment API needs idempotency keys',
      content: 'Retries double-charged customers.',
      tags: ['payments'],
    });
    expect(r.text).toMatch(/Remembered \[pit_/);
    expect((await call('engram_check', { plan: 'add retries to the payment API client' })).text).toContain('idempotency');
    expect((await call('engram_recall', { query: 'payment' })).text).toContain('Payment API needs idempotency keys');
    await call('engram_session_end', { summary: 'Added retry with keys.' });
    expect(engram.search({ kinds: ['session'] })).toHaveLength(1);
    expect(engram.search({ kinds: ['pitfall'] })[0]?.memory.sessionId).toMatch(/^s_/);
  });

  it('supersedes and explains why', async () => {
    const { call } = await connect();
    const first = await call('engram_remember', { kind: 'decision', title: 'REST for the public API' });
    const id = first.text.match(/\[(dec_[a-z0-9]+)\]/)![1];
    await call('engram_remember', { kind: 'decision', title: 'GraphQL for the public API', supersedes: id, content: 'Clients needed flexible queries.' });
    const story = (await call('engram_why', { topic: 'public API' })).text;
    expect(story.indexOf('REST')).toBeLessThan(story.indexOf('GraphQL'));
    expect(story).toContain('superseded');
  });

  it('turns errors into tool errors', async () => {
    const { call } = await connect();
    const r = await call('engram_get', { id: 'dec_missing' });
    expect(r.isError).toBe(true);
    expect(r.text).toContain('no memory');
  });

  it('serves the summary resource', async () => {
    const { client } = await connect();
    const res = await client.readResource({ uri: 'engram://summary' });
    expect((res.contents[0] as { text: string }).text).toContain('project memory');
  });
});
