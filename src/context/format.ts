import type { Link, Memory } from '../types.js';

/** Rough token estimate: ~4 chars per token for English, a bit worse for code. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3.6);
}

const KIND_LABEL: Record<Memory['kind'], string> = {
  decision: 'Decision',
  pitfall: 'Pitfall',
  principle: 'Principle',
  note: 'Note',
  discussion: 'Discussion',
  fact: 'Fact',
  session: 'Session',
  file: 'File',
};

export function kindLabel(kind: Memory['kind']): string {
  return KIND_LABEL[kind];
}

/** One line: `[dec_x1] Decision: Use Postgres for sessions (rejected) #db` */
export function oneLine(m: Memory): string {
  const status = m.status === 'active' ? '' : ` (${m.status})`;
  const tags = m.tags.length ? ' ' + m.tags.map((t) => `#${t}`).join(' ') : '';
  return `[${m.id}] ${kindLabel(m.kind)}: ${m.title}${status}${tags}`;
}

/** Full markdown block for a single memory. */
export function block(m: Memory, opts: { maxChars?: number; links?: Link[] } = {}): string {
  const lines = [`### ${oneLine(m)}`];
  const meta: string[] = [`importance ${m.importance}/5`, `updated ${m.updatedAt.slice(0, 10)}`];
  if (m.source && m.source !== 'agent') meta.push(`source ${m.source}`);
  lines.push(`_${meta.join(' · ')}_`);
  if (m.files.length) lines.push(`Files: ${m.files.map((f) => `\`${f}\``).join(', ')}`);
  if (m.content.trim()) lines.push('', truncate(m.content.trim(), opts.maxChars ?? 1200));
  if (opts.links?.length) {
    lines.push('', ...opts.links.map((l) => `- ${l.from} —${l.relation}→ ${l.to}${l.note ? ` (${l.note})` : ''}`));
  }
  return lines.join('\n');
}

export function truncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const cut = text.slice(0, maxChars);
  const lastBreak = Math.max(cut.lastIndexOf('\n'), cut.lastIndexOf('. '));
  return (lastBreak > maxChars * 0.6 ? cut.slice(0, lastBreak + 1) : cut).trimEnd() + ' …';
}

export function relativeTime(iso: string, from = Date.now()): string {
  const diff = from - Date.parse(iso);
  const day = 86_400_000;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)} min ago`;
  if (diff < day) return `${Math.round(diff / 3_600_000)} h ago`;
  if (diff < 2 * day) return 'yesterday';
  if (diff < 14 * day) return `${Math.round(diff / day)} days ago`;
  if (diff < 60 * day) return `${Math.round(diff / (7 * day))} weeks ago`;
  return `${Math.round(diff / (30 * day))} months ago`;
}
