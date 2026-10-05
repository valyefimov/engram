import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { buildContext } from '../context/pack.js';
import { projectSummary } from '../context/summary.js';
import { checkPitfalls, neighborhood, why } from '../graph/graph.js';
import { indexProject } from '../indexer/index.js';
import { loadSkills } from '../skills/catalog.js';
import type { Engram } from '../store/engram.js';
import { MemoryKindSchema, MemoryStatusSchema, RelationSchema } from '../types.js';
import { VERSION } from '../version.js';
import { SERVER_INSTRUCTIONS } from './instructions.js';
import { renderGraph, renderHits, renderMemory, renderWarnings, renderWhy } from './render.js';

type ToolResult = { content: { type: 'text'; text: string }[]; isError?: boolean };

const text = (t: string): ToolResult => ({ content: [{ type: 'text', text: t }] });

/** Wrap a handler so thrown errors become tool errors the agent can read. */
function safe<A>(fn: (args: A) => string | Promise<string>) {
  return async (args: A): Promise<ToolResult> => {
    try {
      return text(await fn(args));
    } catch (err) {
      return { content: [{ type: 'text', text: (err as Error).message }], isError: true };
    }
  };
}

const tags = z.array(z.string()).optional().describe('Lowercase topic tags, e.g. ["auth", "db"]');
const files = z.array(z.string()).optional().describe('Repo-relative paths this is about');

export function createServer(engram: Engram): McpServer {
  const server = new McpServer(
    { name: 'engram', title: 'Engram — project memory', version: VERSION },
    { instructions: SERVER_INSTRUCTIONS, capabilities: { logging: {} } },
  );

  /** The session this server process is part of, if the agent started one. */
  let currentSession: string | null = null;

  // ------------------------------------------------------------ write tools

  server.registerTool(
    'engram_remember',
    {
      title: 'Remember',
      description:
        'Store a decision, pitfall, principle, fact or note in long-term project memory. ' +
        'Write it for a future reader with no context: what, why, and what to do about it. ' +
        'Re-remembering the same kind+title updates the existing memory instead of duplicating it.',
      inputSchema: {
        kind: MemoryKindSchema.default('note').describe(
          'decision | pitfall | principle | note | discussion | fact | file',
        ),
        title: z.string().min(1).max(200).describe('Short, specific, searchable headline'),
        content: z.string().default('').describe('The details and — most importantly — the reasoning'),
        tags,
        files,
        importance: z.number().int().min(1).max(5).default(3).describe('1 trivia … 5 load-bearing'),
        status: MemoryStatusSchema.optional().describe('Use "rejected" for options considered and turned down'),
        supersedes: z.string().optional().describe('Id of an older memory this one replaces'),
        links: z
          .array(z.object({ to: z.string(), relation: RelationSchema, note: z.string().optional() }))
          .optional()
          .describe('Edges to existing memories'),
      },
      annotations: { destructiveHint: false, idempotentHint: true },
    },
    safe(async (a) => {
      const input = {
        kind: a.kind,
        title: a.title,
        content: a.content,
        tags: a.tags,
        files: a.files,
        importance: a.importance,
        status: a.status,
        source: 'agent',
        sessionId: currentSession,
      };
      const result = a.supersedes
        ? { memory: engram.supersede(a.supersedes, input), created: true }
        : engram.remember(input);
      const linked: string[] = [];
      for (const l of a.links ?? []) {
        engram.link(result.memory.id, l.to, l.relation, l.note);
        linked.push(`${l.relation} → ${l.to}`);
      }
      return [
        `${result.created ? 'Remembered' : 'Updated existing memory'} [${result.memory.id}] ${result.memory.kind}: ${result.memory.title}`,
        a.supersedes ? `Marked ${a.supersedes} as superseded.` : '',
        linked.length ? `Links: ${linked.join(', ')}` : '',
      ]
        .filter(Boolean)
        .join('\n');
    }),
  );

  server.registerTool(
    'engram_update',
    {
      title: 'Update memory',
      description: 'Edit an existing memory (fix content, retag, change status or importance).',
      inputSchema: {
        id: z.string(),
        title: z.string().min(1).max(200).optional(),
        content: z.string().optional(),
        kind: MemoryKindSchema.optional(),
        tags,
        files,
        importance: z.number().int().min(1).max(5).optional(),
        status: MemoryStatusSchema.optional(),
      },
      annotations: { destructiveHint: false, idempotentHint: true },
    },
    safe(({ id, ...patch }) => {
      const m = engram.update(id, patch);
      return `Updated [${m.id}] ${m.title} (${m.status})`;
    }),
  );

  server.registerTool(
    'engram_forget',
    {
      title: 'Forget',
      description:
        'Archive a memory that is wrong or no longer useful (kept for history, hidden from recall). ' +
        'hard=true deletes it for everyone — only when the user explicitly asks.',
      inputSchema: { id: z.string(), hard: z.boolean().default(false) },
      annotations: { destructiveHint: true },
    },
    safe(({ id, hard }) => {
      engram.forget(id, { hard });
      return hard ? `Deleted ${id}.` : `Archived ${id}. Undo with engram_update status=active.`;
    }),
  );

  server.registerTool(
    'engram_link',
    {
      title: 'Link memories',
      description:
        'Connect two memories in the knowledge graph. Relations: relates_to, depends_on, implements, ' +
        'supersedes, rejected_because, caused_by, part_of. Direction is from → to.',
      inputSchema: {
        from: z.string(),
        to: z.string(),
        relation: RelationSchema,
        note: z.string().optional(),
      },
      annotations: { idempotentHint: true },
    },
    safe(({ from, to, relation, note }) => {
      engram.link(from, to, relation, note);
      return `Linked ${from} —${relation}→ ${to}`;
    }),
  );

  // ------------------------------------------------------------- read tools

  server.registerTool(
    'engram_recall',
    {
      title: 'Recall',
      description:
        'Search project memory with free text plus optional filters. Use before answering ' +
        '"did we…", "where did we discuss…", "what do we know about…".',
      inputSchema: {
        query: z.string().optional().describe('Free text; any language'),
        kinds: z.array(MemoryKindSchema).optional(),
        tags,
        files,
        include_inactive: z.boolean().default(false).describe('Also return superseded / rejected / archived'),
        limit: z.number().int().min(1).max(50).default(10),
      },
      annotations: { readOnlyHint: true },
    },
    safe((a) =>
      renderHits(
        engram.search({
          query: a.query,
          kinds: a.kinds,
          tags: a.tags,
          files: a.files,
          includeInactive: a.include_inactive,
          limit: a.limit,
        }),
        a.query,
      ),
    ),
  );

  server.registerTool(
    'engram_get',
    {
      title: 'Get memory',
      description: 'Full record of one memory, including its links.',
      inputSchema: { id: z.string() },
      annotations: { readOnlyHint: true },
    },
    safe(({ id }) => {
      const m = engram.require(id);
      const links = engram.links(id);
      const titles = new Map<string, string>();
      for (const l of [...links.outgoing, ...links.incoming]) {
        for (const other of [l.from, l.to]) {
          if (!titles.has(other)) titles.set(other, engram.get(other)?.title ?? '(missing)');
        }
      }
      return renderMemory(m, links, titles);
    }),
  );

  server.registerTool(
    'engram_related',
    {
      title: 'Related',
      description: 'Walk the knowledge graph around a memory (both directions).',
      inputSchema: {
        id: z.string(),
        depth: z.number().int().min(1).max(4).default(2),
        relations: z.array(RelationSchema).optional(),
      },
      annotations: { readOnlyHint: true },
    },
    safe(({ id, depth, relations }) => renderGraph(neighborhood(engram, id, { depth, relations }), id)),
  );

  server.registerTool(
    'engram_why',
    {
      title: 'Why did we do this?',
      description:
        'Reconstruct the history of a topic: decisions, what they replaced, what was rejected and why, ' +
        'plus related pitfalls — as a timeline.',
      inputSchema: { topic: z.string().min(1) },
      annotations: { readOnlyHint: true },
    },
    safe(({ topic }) => renderWhy(why(engram, topic))),
  );

  server.registerTool(
    'engram_check',
    {
      title: 'Check against past mistakes',
      description:
        'Before implementing a plan, check it against recorded pitfalls and previously rejected approaches.',
      inputSchema: {
        plan: z.string().min(1).describe('What you are about to do, in a sentence or two'),
        files,
      },
      annotations: { readOnlyHint: true },
    },
    safe(({ plan, files }) => renderWarnings(checkPitfalls(engram, plan, { files }), plan)),
  );

  server.registerTool(
    'engram_context',
    {
      title: 'Context pack',
      description:
        'A token-budgeted briefing for a task: principles, relevant decisions, pitfalls and the last ' +
        'session. Important items in full, the rest compressed to one line.',
      inputSchema: {
        task: z.string().optional(),
        files,
        budget: z.number().int().min(200).max(20000).optional().describe('Token budget (default from config)'),
      },
      annotations: { readOnlyHint: true },
    },
    safe(({ task, files, budget }) => buildContext(engram, { task, files, budget }).markdown),
  );

  server.registerTool(
    'engram_summary',
    {
      title: 'Project summary',
      description: 'Overview of the project as memory knows it: principles, key decisions, pitfalls, hotspots, recent sessions.',
      inputSchema: { detail: z.enum(['short', 'full']).default('short') },
      annotations: { readOnlyHint: true },
    },
    safe(({ detail }) => projectSummary(engram, { detail })),
  );

  // --------------------------------------------------------------- sessions

  server.registerTool(
    'engram_session_start',
    {
      title: 'Start session',
      description:
        'Call at the beginning of a task. Opens a session and returns the context pack for the goal — ' +
        'including where the previous session stopped.',
      inputSchema: {
        goal: z.string().optional().describe('What this session is about'),
        agent: z.string().optional().describe('e.g. "claude-code", "cursor"'),
        files,
        budget: z.number().int().min(200).max(20000).optional(),
      },
    },
    safe(({ goal, agent, files, budget }) => {
      const s = engram.startSession({ goal, agent });
      currentSession = s.id;
      const pack = buildContext(engram, { task: goal, files, budget });
      return `Session ${s.id} started.\n\n${pack.markdown}`;
    }),
  );

  server.registerTool(
    'engram_session_end',
    {
      title: 'End session',
      description:
        'Call when meaningful work is done. Summarize what changed, what is unfinished and what to do next — ' +
        'the next session starts from this.',
      inputSchema: {
        summary: z.string().min(1),
        session_id: z.string().optional().describe('Defaults to the session started in this connection'),
        tags,
      },
    },
    safe(({ summary, session_id, tags }) => {
      let id = session_id ?? currentSession;
      if (!id) id = engram.startSession({ agent: 'unknown' }).id;
      const s = engram.endSession(id, summary, { tags });
      if (id === currentSession) currentSession = null;
      return `Session ${s.id} closed. Summary saved — the next session will pick up from here.`;
    }),
  );

  server.registerTool(
    'engram_index',
    {
      title: 'Index repository',
      description: 'Import ADRs as decisions and learn hotspots / reverted commits from git history. Idempotent.',
      inputSchema: {},
    },
    safe(() => {
      const r = indexProject(engram);
      return (
        `Indexed in ${r.ms} ms. ADRs: ${r.adr.added} added, ${r.adr.updated} updated, ${r.adr.linked} links. ` +
        `Git: ${r.git.commits} commits scanned, ${r.git.hotspots} hotspots, ${r.git.scars} possible pitfalls.`
      );
    }),
  );

  // -------------------------------------------------------------- resources

  server.registerResource(
    'summary',
    'engram://summary',
    { title: 'Project memory summary', mimeType: 'text/markdown' },
    async (uri) => ({ contents: [{ uri: uri.href, mimeType: 'text/markdown', text: projectSummary(engram) }] }),
  );

  server.registerResource(
    'memory',
    new ResourceTemplate('engram://memory/{id}', {
      list: async () => ({
        resources: engram.list({ limit: 100 }).map((m) => ({
          uri: `engram://memory/${m.id}`,
          name: m.title,
          description: `${m.kind} · ${m.status}`,
          mimeType: 'text/markdown',
        })),
      }),
    }),
    { title: 'A single memory', mimeType: 'text/markdown' },
    async (uri, { id }) => {
      const m = engram.require(String(id));
      return {
        contents: [
          { uri: uri.href, mimeType: 'text/markdown', text: renderMemory(m, engram.links(m.id), new Map()) },
        ],
      };
    },
  );

  // ---------------------------------------------------------------- prompts
  // Every bundled skill is also exposed as an MCP prompt, so clients without
  // a skills system (Cursor, Windsurf, Zed…) get the same workflows.

  for (const skill of loadSkills()) {
    server.registerPrompt(
      skill.name,
      {
        title: skill.name,
        description: skill.description,
        argsSchema: { input: z.string().optional().describe('Topic, decision or plan') },
      },
      ({ input }) => ({
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: skill.body.replaceAll('$ARGUMENTS', input ?? '(not specified — ask the user)'),
            },
          },
        ],
      }),
    );
  }

  return server;
}

export async function serveStdio(engram: Engram): Promise<void> {
  const server = createServer(engram);
  const transport = new StdioServerTransport();
  const shutdown = async () => {
    await server.close().catch(() => {});
    engram.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.stdin.on('close', shutdown);
  await server.connect(transport);
}
