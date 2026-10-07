import type { Engram } from '../store/engram.js';
import type { Memory, MemoryKind } from '../types.js';

const ORDER: { kind: MemoryKind; title: string }[] = [
  { kind: 'principle', title: 'Principles' },
  { kind: 'decision', title: 'Decisions' },
  { kind: 'pitfall', title: 'Pitfalls' },
  { kind: 'fact', title: 'Facts' },
  { kind: 'discussion', title: 'Discussions' },
  { kind: 'note', title: 'Notes' },
  { kind: 'file', title: 'Files' },
  { kind: 'session', title: 'Sessions' },
];

/**
 * Human-readable dump of the whole memory — handy for code review of what
 * the agent learned, or for pasting into a wiki.
 */
export function toMarkdown(engram: Engram): string {
  const all = engram.all().filter((m) => m.status !== 'archived');
  const links = engram.allLinks();
  const title = new Map(all.map((m) => [m.id, m.title]));
  const out: string[] = [
    `# ${engram.config.project || 'Project'} memory`,
    '',
    `_Exported by engram on ${new Date().toISOString().slice(0, 10)} — ${all.length} memories._`,
  ];

  for (const { kind, title: heading } of ORDER) {
    const items = all
      .filter((m) => m.kind === kind)
      .sort((a, b) => statusRank(a) - statusRank(b) || b.importance - a.importance || b.updatedAt.localeCompare(a.updatedAt));
    if (!items.length) continue;
    out.push('', `## ${heading}`);
    for (const m of items) {
      out.push('', `### ${m.title}${m.status !== 'active' ? ` _(${m.status})_` : ''}`, '');
      const meta = [`\`${m.id}\``, `importance ${m.importance}`, m.updatedAt.slice(0, 10)];
      if (m.tags.length) meta.push(m.tags.map((t) => `#${t}`).join(' '));
      out.push(meta.join(' · '));
      if (m.files.length) out.push('', `Files: ${m.files.map((f) => `\`${f}\``).join(', ')}`);
      if (m.content.trim()) out.push('', m.content.trim());
      const rel = links.filter((l) => l.from === m.id);
      if (rel.length) {
        out.push('', ...rel.map((l) => `- ${l.relation.replace(/_/g, ' ')} → ${title.get(l.to) ?? l.to} (\`${l.to}\`)`));
      }
    }
  }
  return out.join('\n') + '\n';
}

function statusRank(m: Memory): number {
  return { active: 0, rejected: 1, superseded: 2, archived: 3 }[m.status];
}
