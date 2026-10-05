import { block, oneLine, relativeTime } from '../context/format.js';
import type { PitfallWarning, Subgraph, WhyReport } from '../graph/graph.js';
import type { Link, Memory, SearchHit } from '../types.js';

/** Markdown renderers for tool results. LLMs read markdown better than JSON. */

export function renderHits(hits: SearchHit[], query?: string): string {
  if (!hits.length) {
    return query
      ? `No memories match "${query}". Nothing recorded yet — if you learn something worth keeping, use engram_remember.`
      : 'No memories match these filters.';
  }
  const lines = hits.map((h) => {
    const head = `- ${oneLine(h.memory)} · ${relativeTime(h.memory.updatedAt)}`;
    const body = h.snippet ?? firstSentence(h.memory.content);
    return body ? `${head}\n  ${body}` : head;
  });
  return [`${hits.length} memor${hits.length === 1 ? 'y' : 'ies'}${query ? ` for "${query}"` : ''}:`, '', ...lines, '', 'Use engram_get <id> for the full record and its links.'].join('\n');
}

export function renderMemory(m: Memory, links: { outgoing: Link[]; incoming: Link[] }, titles: Map<string, string>): string {
  const out = [block(m, { maxChars: 8000 })];
  const fmt = (l: Link, dir: 'out' | 'in') => {
    const other = dir === 'out' ? l.to : l.from;
    const label = titles.get(other) ?? other;
    return dir === 'out'
      ? `- —${l.relation}→ [${other}] ${label}${l.note ? ` (${l.note})` : ''}`
      : `- ←${l.relation}— [${other}] ${label}${l.note ? ` (${l.note})` : ''}`;
  };
  if (links.outgoing.length || links.incoming.length) {
    out.push('', '**Links**', ...links.outgoing.map((l) => fmt(l, 'out')), ...links.incoming.map((l) => fmt(l, 'in')));
  }
  return out.join('\n');
}

export function renderGraph(g: Subgraph, rootId: string): string {
  if (g.nodes.length <= 1) return `[${rootId}] has no links yet. Use engram_link to connect it.`;
  const title = new Map(g.nodes.map((n) => [n.id, n.title]));
  return [
    `**Nodes (${g.nodes.length})**`,
    ...g.nodes.map((n) => `- ${oneLine(n)}`),
    '',
    `**Edges (${g.edges.length})**`,
    ...g.edges.map((e) => `- ${title.get(e.from)} [${e.from}] —${e.relation}→ ${title.get(e.to)} [${e.to}]${e.note ? ` (${e.note})` : ''}`),
  ].join('\n');
}

export function renderWhy(r: WhyReport): string {
  if (!r.timeline.length && !r.pitfalls.length) {
    return `No recorded decisions about "${r.topic}". If you find out why things are the way they are, record it with engram_remember (kind: decision).`;
  }
  const out = [`# Why: ${r.topic}`, ''];
  for (const e of r.timeline) {
    const m = e.memory;
    const marker = m.status === 'active' ? '✅' : m.status === 'rejected' ? '❌' : m.status === 'superseded' ? '↩️' : '•';
    out.push(`${marker} **${m.createdAt.slice(0, 10)} — ${m.title}** \`${m.id}\` (${m.status})`);
    if (m.content) out.push(indent(clip(m.content, 600)));
    const notable = e.links.filter((l) => l.relation !== 'relates_to');
    for (const l of notable) out.push(`  - ${l.from} —${l.relation}→ ${l.to}${l.note ? `: ${l.note}` : ''}`);
    out.push('');
  }
  if (r.pitfalls.length) {
    out.push('**Related pitfalls**', ...r.pitfalls.map((p) => `- ${oneLine(p)}`));
  }
  return out.join('\n').trim();
}

export function renderWarnings(ws: PitfallWarning[], plan: string): string {
  if (!ws.length) return `No known pitfalls or rejected approaches match this plan. Proceed — and record anything that bites you with engram_remember (kind: pitfall).`;
  return [
    `⚠️  ${ws.length} past lesson${ws.length === 1 ? '' : 's'} may apply to: "${clip(plan, 120)}"`,
    '',
    ...ws.map((w) => `### ${w.kind === 'pitfall' ? 'Pitfall' : 'Rejected before'}: ${w.memory.title} \`${w.memory.id}\`\n${clip(w.memory.content, 700)}`),
    '',
    'Tell the user if the plan repeats one of these, and explain how you will avoid it.',
  ].join('\n');
}

function firstSentence(text: string): string {
  const t = text.trim().replace(/\s+/g, ' ');
  const m = t.match(/^(.{20,200}?[.!?])(\s|$)/);
  return m ? m[1]! : clip(t, 200);
}

function clip(text: string, n: number): string {
  const t = text.trim();
  return t.length > n ? t.slice(0, n).trimEnd() + ' …' : t;
}

function indent(text: string): string {
  return text
    .split('\n')
    .map((l) => `  ${l}`)
    .join('\n');
}
