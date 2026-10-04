import { execFileSync } from 'node:child_process';
import type { Engram } from '../store/engram.js';

export interface Commit {
  sha: string;
  date: string;
  author: string;
  subject: string;
  files: string[];
}

const SEP = '\u001e'; // record separator — never shows up in commit subjects

export function isGitRepo(root: string): boolean {
  try {
    execFileSync('git', ['rev-parse', '--is-inside-work-tree'], { cwd: root, stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

export function readLog(root: string, depth: number): Commit[] {
  let out: string;
  try {
    out = execFileSync(
      'git',
      ['log', `-n${depth}`, '--no-merges', '--name-only', `--pretty=format:${SEP}%H%x09%aI%x09%an%x09%s`],
      { cwd: root, stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 },
    ).toString('utf8');
  } catch {
    return []; // empty repo, no git, shallow weirdness — nothing to learn
  }
  return out
    .split(SEP)
    .filter(Boolean)
    .map((chunk) => {
      const [head = '', ...rest] = chunk.split('\n');
      const [sha = '', date = '', author = '', subject = ''] = head.split('\t');
      return { sha, date, author, subject, files: rest.map((f) => f.trim()).filter(Boolean) };
    });
}

/** Files changed most often, ignoring lockfiles and generated noise. */
export function hotspots(commits: Commit[], threshold: number, top = 15): { file: string; changes: number }[] {
  const noise = /(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb|CHANGELOG\.md|dist\/|\.engram\/)/;
  const counts = new Map<string, number>();
  for (const c of commits) for (const f of c.files) if (!noise.test(f)) counts.set(f, (counts.get(f) ?? 0) + 1);
  return [...counts.entries()]
    .filter(([, n]) => n >= threshold)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, top)
    .map(([file, changes]) => ({ file, changes }));
}

/**
 * Commits that hint at a scar: reverts and "fix the fix" style messages.
 * They become low-importance pitfall candidates the agent can confirm or drop.
 */
export function scars(commits: Commit[], limit = 15): Commit[] {
  const re = /^(revert\b|revert:|rollback|roll back|hotfix|fix(?:\(.+\))?!?:?\s.*\b(again|regression|properly|for real)\b)/i;
  return commits.filter((c) => re.test(c.subject)).slice(0, limit);
}

export interface GitIndexResult {
  commits: number;
  hotspots: number;
  scars: number;
}

export function indexGit(engram: Engram): GitIndexResult {
  const result: GitIndexResult = { commits: 0, hotspots: 0, scars: 0 };
  if (!isGitRepo(engram.root)) return result;
  const { gitDepth, hotspotThreshold } = engram.config.indexer;
  const commits = readLog(engram.root, gitDepth);
  result.commits = commits.length;
  if (!commits.length) return result;

  engram.batch(() => {
    const hot = hotspots(commits, hotspotThreshold);
    result.hotspots = hot.length;
    const existing = engram.findBySource('git:hotspots');
    if (hot.length) {
      const content =
        `Files changed most often in the last ${commits.length} commits. ` +
        `Frequent churn usually means fragile code or a moving requirement — tread carefully.\n\n` +
        hot.map((h) => `- \`${h.file}\` — ${h.changes} changes`).join('\n');
      const data = {
        title: 'Code hotspots',
        content,
        files: hot.map((h) => h.file),
        tags: ['hotspot', 'git'],
        importance: 3,
        status: 'active' as const,
      };
      if (existing) engram.update(existing.id, data);
      else engram.remember({ kind: 'fact', source: 'git:hotspots', ...data });
    } else if (existing) {
      engram.update(existing.id, { status: 'archived' });
    }

    for (const c of scars(commits)) {
      const source = `git:${c.sha.slice(0, 12)}`;
      if (engram.findBySource(source)) continue;
      engram.remember({
        kind: 'pitfall',
        title: `Commit "${c.subject}"`,
        content:
          `${c.author} on ${c.date.slice(0, 10)} (${c.sha.slice(0, 7)}). ` +
          `Detected from git history as a revert / repeated fix — confirm what went wrong and update this memory, or forget it.`,
        files: c.files.slice(0, 20),
        tags: ['git', 'auto'],
        importance: 2,
        source,
      });
      result.scars++;
    }
  });
  return result;
}
