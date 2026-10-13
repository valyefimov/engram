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
  return chronological(engram, chain);
}

/**
 * Order memories oldest → newest. `supersedes` edges win over timestamps:
 * two memories written in the same millisecond still come out in the order
 * the history says they happened.
 */
export function chronological(engram: Engram, memories: Memory[]): Memory[] {
  const ids = new Set(memories.map((m) => m.id));
  const before = new Map<string, Set<string>>(); // id → ids that must come first
  for (const m of memories) {
    for (const l of engram.links(m.id).outgoing) {
      if (l.relation === 'supersedes' && ids.has(l.to)) {
        if (!before.has(m.id)) before.set(m.id, new Set());
        before.get(m.id)!.add(l.to);
      }
    }
  }
  const byTime = [...memories].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
  const done = new Set<string>();
  const out: Memory[] = [];
  while (out.length < byTime.length) {
    // the earliest memory whose predecessors are all placed (cycles fall back to time order)
    const next =
      byTime.find((m) => !done.has(m.id) && [...(before.get(m.id) ?? [])].every((p) => done.has(p))) ??
      byTime.find((m) => !done.has(m.id))!;
    done.add(next.id);
    out.push(next);
  }
  return out;
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
    timeline: chronological(engram, [...entries.values()].map((e) => e.memory)).map((m) => entries.get(m.id)!),
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
