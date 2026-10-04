import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseAdr } from '../src/indexer/adr.js';
import { hotspots, scars, type Commit } from '../src/indexer/git.js';
import { indexProject } from '../src/indexer/index.js';
import { Engram } from '../src/store/engram.js';
import { tempDir } from './helpers.js';

describe('ADR parser', () => {
  it('reads Nygard style ADRs', () => {
    const adr = parseAdr(
      'docs/adr/0003-use-kafka.md',
      '# 3. Use Kafka for events\n\n## Status\n\nSuperseded by [ADR-0007](0007-use-nats.md)\n\n## Context\n\nWe need a bus.\n\n## Decision\n\nKafka.\n',
    );
    expect(adr).toMatchObject({ number: 3, title: 'Use Kafka for events', status: 'superseded', supersededBy: [7] });
    expect(adr.body).toContain('**Context:** We need a bus.');
  });

  it('reads MADR front matter', () => {
    const adr = parseAdr('decisions/0002-no-orm.md', '---\nstatus: rejected\n---\n# Use an ORM\n\n## Context and Problem Statement\n\nx\n');
    expect(adr).toMatchObject({ number: 2, title: 'Use an ORM', status: 'rejected' });
  });
});

describe('git signals', () => {
  const commit = (subject: string, files: string[]): Commit => ({ sha: 'a'.repeat(40), date: '2026-01-01', author: 'me', subject, files });

  it('finds hotspots and ignores lockfiles', () => {
    const commits = Array.from({ length: 10 }, () => commit('change', ['src/a.ts', 'package-lock.json']));
    expect(hotspots(commits, 8)).toEqual([{ file: 'src/a.ts', changes: 10 }]);
  });

  it('finds reverts and repeated fixes', () => {
    const found = scars([commit('Revert "add cache"', []), commit('fix: login again', []), commit('feat: new page', [])]);
    expect(found.map((c) => c.subject)).toEqual(['Revert "add cache"', 'fix: login again']);
  });
});

describe('indexProject', () => {
  it('imports ADRs idempotently with supersede links', () => {
    const root = tempDir();
    mkdirSync(join(root, 'docs/adr'), { recursive: true });
    writeFileSync(join(root, 'docs/adr/0001-redis.md'), '# 1. Redis sessions\n\n## Status\n\nSuperseded by ADR-0002\n');
    writeFileSync(join(root, 'docs/adr/0002-postgres.md'), '# 2. Postgres sessions\n\n## Status\n\nAccepted\n');
    const e = Engram.open({ root });
    const first = indexProject(e, { git: false });
    expect(first.adr).toMatchObject({ added: 2, linked: 1 });
    const second = indexProject(e, { git: false });
    expect(second.adr).toMatchObject({ added: 0, updated: 0 });
    expect(e.search({ query: 'sessions', includeInactive: true })).toHaveLength(2);
  });

  it('learns from a real git history', () => {
    const root = tempDir();
    const git = (...args: string[]) =>
      execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...args], { cwd: root, stdio: 'pipe' });
    git('init', '-q');
    writeFileSync(join(root, 'a.txt'), '1');
    git('add', '.');
    git('commit', '-qm', 'add a');
    writeFileSync(join(root, 'a.txt'), '2');
    git('commit', '-qam', 'Revert "bad idea"');
    const e = Engram.open({ root });
    const r = indexProject(e, { adr: false });
    expect(r.git).toMatchObject({ commits: 2, scars: 1 });
    expect(indexProject(e, { adr: false }).git.scars).toBe(0);
  });
});
