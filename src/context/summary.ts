import type { Engram } from '../store/engram.js';
import { kindLabel, oneLine, relativeTime, truncate } from './format.js';

/**
 * A project overview "as memory sees it": principles, the decisions that
 * hold the architecture together, open scars, hotspots and recent sessions.
 */
export function projectSummary(engram: Engram, opts: { detail?: 'short' | 'full' } = {}): string {
  const full = opts.detail === 'full';
  const stats = engram.stats();
  const name = engram.config.project || engram.root.split('/').pop() || 'project';
  const out: string[] = [`# ${name} — project memory`];

  const counts = Object.entries(stats.byKind)
    .sort((a, b) => b[1] - a[1])
    .map(([k, n]) => `${n} ${kindLabel(k as never).toLowerCase()}${n === 1 ? '' : 's'}`)
    .join(', ');
  out.push(
    '',
    stats.total
      ? `${stats.total} memories (${counts}), ${plural(stats.links, 'link')}, ${plural(stats.sessions, 'session')}. Last update ${relativeTime(stats.lastUpdated!)}.`
      : 'No memories yet.',
  );

  const section = (title: string, lines: string[]) => {
    if (lines.length) out.push('', `## ${title}`, '', ...lines);
  };

  const principles = engram.list({ kinds: ['principle'], limit: full ? 30 : 10 });
  section(
    'Principles',
    principles.map((m) => `- **${m.title}**${m.content ? ` — ${truncate(firstLine(m.content), 160)}` : ''} \`${m.id}\``),
  );

  const decisions = engram.list({ kinds: ['decision'], limit: full ? 40 : 12 });
  section(
    'Key decisions',
    decisions.map((m) => `- **${m.title}**${m.content ? ` — ${truncate(firstLine(m.content), 160)}` : ''} \`${m.id}\``),
  );

  const rejected = engram.list({ kinds: ['decision'], statuses: ['rejected'], limit: full ? 20 : 6 });
  section('Rejected options', rejected.map((m) => `- ${m.title} \`${m.id}\``));

  const pitfalls = engram.list({ kinds: ['pitfall'], limit: full ? 30 : 8 });
  section('Pitfalls', pitfalls.map((m) => `- ${m.title} \`${m.id}\``));

  const hotspots = engram.findBySource('git:hotspots');
  if (hotspots && hotspots.status === 'active') {
    section('Hotspots (frequently changed files)', [truncate(hotspots.content, full ? 2000 : 500)]);
  }

  if (full) {
    const facts = engram.list({ kinds: ['fact', 'note', 'discussion', 'file'], limit: 30 });
    section('Other notes', facts.filter((m) => m.source !== 'git:hotspots').map((m) => `- ${oneLine(m)}`));
  }

  const sessions = engram.recentSessions(full ? 10 : 3).filter((s) => s.summary);
  section(
    'Recent sessions',
    sessions.map(
      (s) =>
        `- ${relativeTime(s.endedAt ?? s.startedAt)}${s.goal ? ` — ${s.goal}` : ''}: ${truncate(firstLine(s.summary ?? ''), 200)}`,
    ),
  );

  return out.join('\n');
}

function firstLine(text: string): string {
  return text.trim().split('\n')[0] ?? '';
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}
