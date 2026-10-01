import { describe, expect, it } from 'vitest';
import { checkPitfalls, lineage, neighborhood, why } from '../src/graph/graph.js';
import { tempEngram } from './helpers.js';

function fixture() {
  const e = tempEngram();
  const redis = e.remember({ kind: 'decision', title: 'Cache sessions in Redis', tags: ['sessions'] }).memory;
  const pg = e.supersede(redis.id, { title: 'Keep sessions in Postgres', content: 'One less moving part.' });
  const mongo = e.remember({ kind: 'decision', title: 'Store sessions in MongoDB', status: 'rejected' }).memory;
  const ops = e.remember({ kind: 'pitfall', title: 'Redis failover dropped all sessions', content: 'Logged out every user during failover.' }).memory;
  e.link(mongo.id, pg.id, 'rejected_because', 'no transactions with the rest of the data');
  e.link(redis.id, ops.id, 'caused_by');
  return { e, redis, pg, mongo, ops };
}

describe('graph', () => {
  it('walks the neighbourhood in both directions', () => {
    const { e, pg, redis, mongo, ops } = fixture();
    const g1 = neighborhood(e, pg.id, { depth: 1 });
    expect(g1.nodes.map((n) => n.id).sort()).toEqual([pg.id, redis.id, mongo.id].sort());
    const g2 = neighborhood(e, pg.id, { depth: 2 });
    expect(g2.nodes.map((n) => n.id)).toContain(ops.id);
    expect(neighborhood(e, pg.id, { depth: 2, relations: ['supersedes'] }).nodes).toHaveLength(2);
  });

  it('builds a chronological lineage', () => {
    const { e, redis, pg } = fixture();
    expect(lineage(e, pg.id).map((m) => m.id)).toEqual([redis.id, pg.id]);
  });

  it('why() tells the whole story including rejected options', () => {
    const { e, redis, pg, mongo } = fixture();
    const r = why(e, 'sessions');
    const ids = r.timeline.map((t) => t.memory.id);
    expect(ids).toEqual(expect.arrayContaining([redis.id, pg.id, mongo.id]));
    expect(r.pitfalls.map((p) => p.title)).toContain('Redis failover dropped all sessions');
  });

  it('checkPitfalls warns about pitfalls and rejected approaches', () => {
    const { e } = fixture();
    const titles = checkPitfalls(e, 'move sessions to MongoDB').map((w) => w.memory.title);
    expect(titles).toContain('Store sessions in MongoDB');
    const byFile = tempEngram();
    byFile.remember({ kind: 'pitfall', title: 'Webhook signature uses raw body', files: ['src/webhooks/stripe.ts'] });
    expect(checkPitfalls(byFile, 'refactor', { files: ['src/webhooks'] })).toHaveLength(1);
  });
});
