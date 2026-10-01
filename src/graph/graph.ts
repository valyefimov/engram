import type { Engram } from '../store/engram.js';
import type { Link, Memory, Relation, SearchHit } from '../types.js';

export interface Subgraph {
  nodes: Memory[];
  edges: Link[];
}

/**
 * Breadth-first walk around a memory. Edges are followed in both directions —
 * "what depends on this" is as interesting as "what does this depend on".
 */
export function neighborhood(
  engram: Engram,
  id: string,
  opts: { depth?: number; relations?: Relation[]; limit?: number } = {},
): Subgraph {
  const depth = Math.max(0, Math.min(opts.depth ?? 1, 4));
  const limit = opts.limit ?? 50;
  const allowed = opts.relations?.length ? new Set(opts.relations) : null;

  const start = engram.require(id);
  const nodes = new Map<string, Memory>([[start.id, start]]);
  const edges = new Map<string, Link>();
  let frontier = [start.id];

  for (let d = 0; d < depth && frontier.length && nodes.size < limit; d++) {
    const next: string[] = [];
    for (const current of frontier) {
      const { outgoing, incoming } = engram.links(current);
      for (const link of [...outgoing, ...incoming]) {
        if (allowed && !allowed.has(link.relation)) continue;
        edges.set(`${link.from}|${link.relation}|${link.to}`, link);
        const other = link.from === current ? link.to : link.from;
        if (nodes.has(other) || nodes.size >= limit) continue;
        const m = engram.get(other);
        if (!m) continue;
        nodes.set(other, m);
        next.push(other);
      }
    }
    frontier = next;
  }

  const ids = new Set(nodes.keys());
  return {
    nodes: [...nodes.values()],
    edges: [...edges.values()].filter((e) => ids.has(e.from) && ids.has(e.to)),
  };
}

/** Follow `supersedes` edges backwards and forwards to get a decision's lineage. */
export function lineage(engram: Engram, id: string): Memory[] {
  const seen = new Set<string>();
  const chain: Memory[] = [];
  const visit = (mid: string) => {
    if (seen.has(mid)) return;
    seen.add(mid);
    const m = engram.get(mid);
    if (!m) return;
    chain.push(m);
    const { outgoing, incoming } = engram.links(mid);
    for (const l of outgoing) if (l.relation === 'supersedes') visit(l.to);
    for (const l of incoming) if (l.relation === 'supersedes') visit(l.from);
  };
  visit(id);
  return chain.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export interface WhyEntry {
  memory: Memory;
  /** Why this entry is in the story: "match", "superseded by …", "rejected because …" */
  reason: string;
  links: Link[];
}

export interface WhyReport {
  topic: string;
  /** Chronological story: what we decided, what we replaced, what we rejected. */
  timeline: WhyEntry[];
  /** Pitfalls touching the topic — the scars behind the decisions. */
  pitfalls: Memory[];
}

/**
 * "Why do we do X?" — collect every decision (including rejected and
 * superseded ones) about a topic, expand their lineage and reasons, and order
 * it as a timeline. This powers the `why-we-did-this` skill.
 */
export function why(engram: Engram, topic: string, opts: { limit?: number } = {}): WhyReport {
  const limit = opts.limit ?? 12;
  const hits = engram.search({
    query: topic,
    kinds: ['decision', 'principle', 'discussion'],
    includeInactive: true,
    limit,
  });

  const entries = new Map<string, WhyEntry>();
  const add = (memory: Memory, reason: string) => {
    if (memory.status === 'archived') return;
    if (!entries.has(memory.id)) entries.set(memory.id, { memory, reason, links: [] });
  };

  for (const hit of hits) {
    add(hit.memory, 'match');
    for (const m of lineage(engram, hit.memory.id)) {
      if (m.id !== hit.memory.id) add(m, `lineage of ${hit.memory.id}`);
    }
  }

  for (const entry of entries.values()) {
    const { outgoing, incoming } = engram.links(entry.memory.id);
    entry.links = [...outgoing, ...incoming];
    for (const l of outgoing) {
      if (l.relation === 'rejected_because' || l.relation === 'caused_by') {
        const target = engram.get(l.to);
        if (target) add(target, `${l.relation.replace('_', ' ')} (from ${entry.memory.id})`);
      }
    }
  }

  const pitfalls = engram
    .search({ query: topic, kinds: ['pitfall'], limit: 5 })
    .map((h: SearchHit) => h.memory);

  return {
    topic,
    timeline: [...entries.values()].sort((a, b) =>
      a.memory.createdAt.localeCompare(b.memory.createdAt),
    ),
    pitfalls,
  };
}

export interface PitfallWarning {
  memory: Memory;
  score: number;
  snippet: string | null;
  /** "pitfall" or "rejected decision" */
  kind: string;
}

/**
 * Before doing something, check it against what already burned us: active
 * pitfalls plus decisions we explicitly rejected. Powers `avoid-past-mistakes`.
 */
export function checkPitfalls(
  engram: Engram,
  plan: string,
  opts: { files?: string[]; limit?: number } = {},
): PitfallWarning[] {
  const limit = opts.limit ?? 8;
  const byText = engram.search({ query: plan, kinds: ['pitfall'], limit });
  const rejected = engram.search({
    query: plan,
    kinds: ['decision'],
    statuses: ['rejected'],
    limit,
  });
  const byFile = opts.files?.length
    ? engram.search({ files: opts.files, kinds: ['pitfall'], limit })
    : [];

  const merged = new Map<string, PitfallWarning>();
  for (const h of [...byText, ...rejected, ...byFile]) {
    const prev = merged.get(h.memory.id);
    // file matches have no text score; give them a solid floor
    const score = h.score || 1;
    if (!prev || prev.score < score) {
      merged.set(h.memory.id, {
        memory: h.memory,
        score,
        snippet: h.snippet,
        kind: h.memory.kind === 'pitfall' ? 'pitfall' : 'rejected decision',
      });
    }
  }
  return [...merged.values()].sort((a, b) => b.score - a.score).slice(0, limit);
}
