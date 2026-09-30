import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { Engram } from '../src/store/engram.js';
import { parseJsonl } from '../src/store/sync.js';
import { tempDir, tempEngram } from './helpers.js';

describe('jsonl sync', () => {
  it('mirrors every write into memories.jsonl', () => {
    const e = tempEngram();
    const a = e.remember({ title: 'first' }).memory;
    const file = join(e.dir, 'memories.jsonl');
    expect(existsSync(file)).toBe(true);
    const { records } = parseJsonl(readFileSync(file, 'utf8'));
    expect(records).toMatchObject([{ type: 'memory', id: a.id, title: 'first' }]);
  });

  it('rebuilds the database from jsonl alone (fresh clone)', () => {
    const root = tempDir();
    const e = Engram.open({ root });
    const a = e.remember({ kind: 'decision', title: 'Monorepo with pnpm' }).memory;
    const b = e.remember({ kind: 'pitfall', title: 'Hoisting breaks jest' }).memory;
    e.link(b.id, a.id, 'caused_by');
    e.close();

    const clone = tempDir();
    const fresh = Engram.open({ root: clone });
    writeFileSync(join(fresh.dir, 'memories.jsonl'), readFileSync(join(root, '.engram', 'memories.jsonl')));
    fresh.close();

    const reopened = Engram.open({ root: clone });
    expect(reopened.stats().total).toBe(2);
    expect(reopened.links(b.id).outgoing[0]?.relation).toBe('caused_by');
  });

  it('merges a teammate change: last writer wins, tombstones win', () => {
    const root = tempDir();
    const e = Engram.open({ root });
    const keep = e.remember({ title: 'keep me', content: 'v1' }).memory;
    const drop = e.remember({ title: 'drop me' }).memory;
    e.close();

    const file = join(root, '.engram', 'memories.jsonl');
    const lines = readFileSync(file, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
    const edited = lines.map((r) =>
      r.id === keep.id ? { ...r, content: 'v2 from teammate', updatedAt: '2999-01-01T00:00:00.000Z' } : r,
    );
    edited.push({ type: 'tombstone', id: drop.id, deletedAt: '2999-01-01T00:00:00.000Z' });
    writeFileSync(file, edited.map((r) => JSON.stringify(r)).join('\n') + '\n');

    const merged = Engram.open({ root });
    expect(merged.get(keep.id)?.content).toBe('v2 from teammate');
    expect(merged.get(drop.id)).toBeNull();
  });

  it('survives unresolved git conflict markers', () => {
    const { records, errors } = parseJsonl(
      ['<<<<<<< HEAD', '{"type":"tombstone","id":"a","deletedAt":"x"}', '=======', '{"type":"tombstone","id":"b","deletedAt":"y"}', '>>>>>>> theirs', ''].join('\n'),
    );
    expect(errors).toEqual([]);
    expect(records.map((r) => (r as { id: string }).id)).toEqual(['a', 'b']);
  });
});
