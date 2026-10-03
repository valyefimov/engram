import { describe, expect, it } from 'vitest';
import { buildContext } from '../src/context/pack.js';
import { estimateTokens } from '../src/context/format.js';
import { projectSummary } from '../src/context/summary.js';
import { tempEngram } from './helpers.js';

describe('context pack', () => {
  it('handles an empty memory', () => {
    const pack = buildContext(tempEngram());
    expect(pack.markdown).toContain('Memory is empty');
  });

  it('puts principles, pitfalls and the last session first', () => {
    const e = tempEngram();
    e.remember({ kind: 'principle', title: 'No ORMs in the hot path', importance: 5 });
    e.remember({ kind: 'pitfall', title: 'Stripe webhooks need the raw body', tags: ['payments'] });
    const s = e.startSession({ goal: 'payments' });
    e.endSession(s.id, 'Half way through webhook refactor.');
    const pack = buildContext(e, { task: 'fix stripe webhooks' });
    expect(pack.markdown).toContain('No ORMs in the hot path');
    expect(pack.markdown).toContain('Stripe webhooks need the raw body');
    expect(pack.markdown).toContain('Half way through webhook refactor');
  });

  it('respects the token budget by compressing then dropping', () => {
    const e = tempEngram();
    for (let i = 0; i < 60; i++) {
      e.remember({ kind: 'decision', title: `Decision number ${i}`, content: 'lorem ipsum dolor sit amet '.repeat(30), importance: 4 });
    }
    const pack = buildContext(e, { task: 'decision', budget: 600 });
    expect(pack.tokens).toBeLessThanOrEqual(600);
    expect(pack.compressed.length + pack.dropped.length).toBeGreaterThan(0);
    expect(estimateTokens(pack.markdown)).toBe(pack.tokens);
  });

  it('summarizes the project', () => {
    const e = tempEngram();
    e.remember({ kind: 'decision', title: 'GraphQL for the public API' });
    e.remember({ kind: 'decision', title: 'gRPC between services', status: 'rejected' });
    const md = projectSummary(e);
    expect(md).toContain('GraphQL for the public API');
    expect(md).toContain('Rejected options');
  });
});
