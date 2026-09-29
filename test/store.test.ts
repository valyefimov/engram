import { describe, expect, it } from 'vitest';
import { tempEngram } from './helpers.js';

describe('Engram store', () => {
  it('remembers and gets a memory', () => {
    const e = tempEngram();
    const { memory, created } = e.remember({ kind: 'decision', title: 'Use Postgres', content: 'Because.', tags: ['DB'] });
    expect(created).toBe(true);
    expect(memory.id).toMatch(/^dec_[0-9a-z]{8}$/);
    expect(memory.tags).toEqual(['db']);
    expect(e.get(memory.id)).toEqual(memory);
  });

  it('dedupes by kind + title instead of creating duplicates', () => {
    const e = tempEngram();
    const a = e.remember({ kind: 'pitfall', title: 'Flaky e2e', tags: ['ci'], importance: 2 });
    const b = e.remember({ kind: 'pitfall', title: 'flaky E2E', content: 'Retry storm', tags: ['tests'], importance: 4 });
    expect(b.created).toBe(false);
    expect(b.memory.id).toBe(a.memory.id);
    expect(b.memory.tags).toEqual(['ci', 'tests']);
    expect(b.memory.importance).toBe(4);
    expect(e.stats().total).toBe(1);
  });

  it('updates without resetting untouched fields', () => {
    const e = tempEngram();
    const { memory } = e.remember({ kind: 'fact', title: 'Prod DB', content: 'Postgres 16', importance: 4 });
    const next = e.update(memory.id, { tags: ['infra'] });
    expect(next.content).toBe('Postgres 16');
    expect(next.importance).toBe(4);
    expect(next.tags).toEqual(['infra']);
  });

  it('archives on forget and hides from recall', () => {
    const e = tempEngram();
    const { memory } = e.remember({ title: 'temporary thing' });
    e.forget(memory.id);
    expect(e.get(memory.id)?.status).toBe('archived');
    expect(e.search({ query: 'temporary' })).toHaveLength(0);
    expect(e.search({ query: 'temporary', includeInactive: true })).toHaveLength(1);
  });

  it('hard forget removes links and leaves a tombstone', () => {
    const e = tempEngram();
    const a = e.remember({ title: 'a' }).memory;
    const b = e.remember({ title: 'b' }).memory;
    e.link(a.id, b.id, 'relates_to');
    e.forget(a.id, { hard: true });
    expect(e.get(a.id)).toBeNull();
    expect(e.links(b.id).incoming).toHaveLength(0);
    expect(e.tombstones().map((t) => t.id)).toEqual([a.id]);
  });

  it('supersede keeps history', () => {
    const e = tempEngram();
    const old = e.remember({ kind: 'decision', title: 'Use Redis for sessions' }).memory;
    const next = e.supersede(old.id, { title: 'Use Postgres for sessions' }, 'ops cost');
    expect(next.kind).toBe('decision');
    expect(e.get(old.id)?.status).toBe('superseded');
    expect(e.links(next.id).outgoing).toMatchObject([{ to: old.id, relation: 'supersedes', note: 'ops cost' }]);
  });

  it('refuses self links and unknown ids', () => {
    const e = tempEngram();
    const a = e.remember({ title: 'a' }).memory;
    expect(() => e.link(a.id, a.id, 'relates_to')).toThrow(/itself/);
    expect(() => e.link(a.id, 'nope', 'relates_to')).toThrow(/no memory/);
  });

  it('records sessions as searchable memories', () => {
    const e = tempEngram();
    const s = e.startSession({ agent: 'claude-code', goal: 'Refactor billing' });
    e.endSession(s.id, 'Split invoices module; webhooks still TODO.');
    expect(e.getSession(s.id)?.endedAt).toBeTruthy();
    const hits = e.search({ query: 'webhooks', kinds: ['session'] });
    expect(hits[0]?.memory.title).toContain('Refactor billing');
  });
});

describe('search', () => {
  it('ranks title matches and supports filters', () => {
    const e = tempEngram();
    e.remember({ kind: 'note', title: 'Logging conventions', content: 'mention auth once' });
    e.remember({ kind: 'decision', title: 'Auth via OAuth2 + PKCE', tags: ['auth'], importance: 5 });
    e.remember({ kind: 'pitfall', title: 'Token refresh race', content: 'auth tokens in two tabs', tags: ['auth'] });

    const hits = e.search({ query: 'auth' });
    expect(hits[0]?.memory.title).toBe('Auth via OAuth2 + PKCE');
    expect(e.search({ query: 'auth', kinds: ['pitfall'] }).map((h) => h.memory.kind)).toEqual(['pitfall']);
    expect(e.search({ tags: ['auth'] })).toHaveLength(2);
  });

  it('prefix-matches longer terms and is safe against FTS syntax', () => {
    const e = tempEngram();
    e.remember({ title: 'Authentication flow overview' });
    expect(e.search({ query: 'authent' })).toHaveLength(1);
    expect(() => e.search({ query: 'AND OR NOT "( * :' })).not.toThrow();
  });

  it('finds cyrillic text', () => {
    const e = tempEngram();
    e.remember({ kind: 'decision', title: 'Авторизация через сессии', content: 'Отказались от JWT' });
    expect(e.search({ query: 'авторизация' })).toHaveLength(1);
    expect(e.search({ query: 'jwt' })).toHaveLength(1);
  });

  it('matches files by prefix', () => {
    const e = tempEngram();
    e.remember({ kind: 'pitfall', title: 'x', files: ['src/auth/refresh.ts'] });
    expect(e.search({ files: ['src/auth'] })).toHaveLength(1);
    expect(e.search({ files: ['src/billing'] })).toHaveLength(0);
  });
});
