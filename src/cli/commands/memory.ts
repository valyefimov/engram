import type { Command } from 'commander';
import { block } from '../../context/format.js';
import { checkPitfalls, neighborhood, why } from '../../graph/graph.js';
import { renderWarnings, renderWhy } from '../../mcp/render.js';
import { Engram } from '../../store/engram.js';
import { MEMORY_KINDS, MEMORY_STATUSES, RELATIONS, type MemoryKind, type MemoryStatus, type Relation } from '../../types.js';
import { c, fail, list, md, memoryLine, ok } from '../ui.js';

const open = () => Engram.open({ create: false });

function kinds(v?: string): MemoryKind[] | undefined {
  const ks = list(v);
  for (const k of ks) if (!MEMORY_KINDS.includes(k as MemoryKind)) fail(`unknown kind "${k}". Kinds: ${MEMORY_KINDS.join(', ')}`);
  return ks.length ? (ks as MemoryKind[]) : undefined;
}

export function registerMemory(program: Command): void {
  program
    .command('remember')
    .alias('add')
    .description('store a memory')
    .argument('<title>', 'short, specific headline')
    .option('-k, --kind <kind>', MEMORY_KINDS.join(' | '), 'note')
    .option('-c, --content <text>', 'details and reasoning')
    .option('-t, --tags <tags>', 'comma separated tags')
    .option('-f, --files <files>', 'comma separated repo-relative paths')
    .option('-i, --importance <n>', '1 (trivia) … 5 (load-bearing)', '3')
    .option('-s, --status <status>', MEMORY_STATUSES.join(' | '))
    .option('--supersedes <id>', 'id of the memory this one replaces')
    .action((title: string, o) => {
      const engram = open();
      const input = {
        kind: kinds(o.kind)![0],
        title,
        content: o.content ?? '',
        tags: list(o.tags),
        files: list(o.files),
        importance: Number(o.importance),
        status: o.status as MemoryStatus | undefined,
        source: 'user',
      };
      try {
        const r = o.supersedes
          ? { memory: engram.supersede(o.supersedes, input), created: true }
          : engram.remember(input);
        ok(`${r.created ? 'Remembered' : 'Updated'} ${memoryLine(r.memory)}`);
      } catch (err) {
        fail((err as Error).message);
      } finally {
        engram.close();
      }
    });

  program
    .command('recall')
    .alias('search')
    .description('search memory')
    .argument('[query...]', 'free text')
    .option('-k, --kind <kinds>', 'filter by kinds (comma separated)')
    .option('-t, --tag <tags>', 'filter by tags (comma separated, all must match)')
    .option('-f, --file <files>', 'filter by files / directories')
    .option('-a, --all', 'include superseded, rejected and archived')
    .option('-n, --limit <n>', 'max results', '10')
    .option('--json', 'machine readable output')
    .action((words: string[], o) => {
      const engram = open();
      const query = words.join(' ').trim() || undefined;
      const hits = engram.search({
        query,
        kinds: kinds(o.kind),
        tags: list(o.tag),
        files: list(o.file),
        includeInactive: !!o.all,
        limit: Number(o.limit),
      });
      engram.close();
      if (o.json) return console.log(JSON.stringify(hits, null, 2));
      if (!hits.length) return console.log(c.dim(query ? `Nothing remembered about "${query}".` : 'No memories yet.'));
      for (const h of hits) console.log(memoryLine(h.memory, h.snippet ? md(h.snippet) : null));
    });

  program
    .command('show')
    .alias('get')
    .description('show one memory with its links')
    .argument('<id>')
    .option('--json', 'machine readable output')
    .action((id: string, o) => {
      const engram = open();
      const m = engram.get(id);
      if (!m) {
        engram.close();
        fail(`no memory with id "${id}"`);
      }
      const links = engram.links(id);
      if (o.json) {
        console.log(JSON.stringify({ ...m, links }, null, 2));
      } else {
        console.log(md(block(m, { maxChars: 100_000 })));
        const rows = [
          ...links.outgoing.map((l) => `  —${c.cyan(l.relation)}→ ${engram.get(l.to)?.title ?? l.to} ${c.dim(l.to)}`),
          ...links.incoming.map((l) => `  ←${c.cyan(l.relation)}— ${engram.get(l.from)?.title ?? l.from} ${c.dim(l.from)}`),
        ];
        if (rows.length) console.log('\n' + c.bold('Links') + '\n' + rows.join('\n'));
      }
      engram.close();
    });

  program
    .command('link')
    .description(`connect two memories (${RELATIONS.join(', ')})`)
    .argument('<from>')
    .argument('<relation>')
    .argument('<to>')
    .option('-n, --note <text>', 'why they are connected')
    .action((from: string, relation: string, to: string, o) => {
      if (!RELATIONS.includes(relation as Relation)) fail(`unknown relation "${relation}". Use: ${RELATIONS.join(', ')}`);
      const engram = open();
      try {
        engram.link(from, to, relation as Relation, o.note);
        ok(`${from} —${relation}→ ${to}`);
      } catch (err) {
        fail((err as Error).message);
      } finally {
        engram.close();
      }
    });

  program
    .command('graph')
    .description('show the neighbourhood of a memory in the knowledge graph')
    .argument('<id>')
    .option('-d, --depth <n>', 'how many hops', '2')
    .action((id: string, o) => {
      const engram = open();
      try {
        const g = neighborhood(engram, id, { depth: Number(o.depth) });
        const title = new Map(g.nodes.map((n) => [n.id, n.title]));
        for (const n of g.nodes) console.log(memoryLine(n));
        if (g.edges.length) console.log('');
        for (const e of g.edges) {
          console.log(`  ${title.get(e.from)} ${c.cyan(`—${e.relation}→`)} ${title.get(e.to)}${e.note ? c.dim(` (${e.note})`) : ''}`);
        }
      } catch (err) {
        fail((err as Error).message);
      } finally {
        engram.close();
      }
    });

  program
    .command('forget')
    .description('archive a memory (or delete with --hard)')
    .argument('<id>')
    .option('--hard', 'delete permanently and propagate the deletion via memories.jsonl')
    .action((id: string, o) => {
      const engram = open();
      try {
        engram.forget(id, { hard: !!o.hard });
        ok(o.hard ? `Deleted ${id}` : `Archived ${id}`);
      } catch (err) {
        fail((err as Error).message);
      } finally {
        engram.close();
      }
    });

  program
    .command('why')
    .description('the history of a topic: decisions, what they replaced, what was rejected')
    .argument('<topic...>')
    .action((words: string[]) => {
      const engram = open();
      console.log(md(renderWhy(why(engram, words.join(' ')))));
      engram.close();
    });

  program
    .command('check')
    .description('check a plan against recorded pitfalls and rejected approaches')
    .argument('<plan...>')
    .option('-f, --file <files>', 'files the plan touches')
    .action((words: string[], o) => {
      const engram = open();
      const plan = words.join(' ');
      console.log(md(renderWarnings(checkPitfalls(engram, plan, { files: list(o.file) }), plan)));
      engram.close();
    });
}
