import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadConfig, type EngramConfig } from '../config.js';
import { DB_FILE, engramDir, findProjectRoot } from '../paths.js';
import {
  MemoryPatchSchema,
  NewMemorySchema,
  RelationSchema,
  type Link,
  type Memory,
  type MemoryKind,
  type MemoryPatch,
  type MemoryStatus,
  type NewMemory,
  type Relation,
  type SearchHit,
  type SearchOptions,
  type Session,
} from '../types.js';
import { openDb, transaction, type Db } from './db.js';
import { memoryId, now, sessionId } from './ids.js';
import { toFtsQuery } from './query.js';
import { exportJsonl, importJsonlIfChanged } from './sync.js';

export interface OpenOptions {
  /** Project root. Defaults to the nearest dir with `.engram/` or a git root. */
  root?: string;
  /** Create `.engram/` if it does not exist yet. Default: true. */
  create?: boolean;
  /** Override where the database lives (tests use ':memory:'). */
  dbFile?: string;
}

export interface RememberResult {
  memory: Memory;
  /** false when an existing memory with the same kind + title was updated. */
  created: boolean;
}

export interface Stats {
  total: number;
  byKind: Partial<Record<MemoryKind, number>>;
  byStatus: Partial<Record<MemoryStatus, number>>;
  links: number;
  sessions: number;
  lastUpdated: string | null;
}

interface MemoryRow {
  id: string;
  kind: string;
  title: string;
  content: string;
  tags: string;
  files: string;
  status: string;
  importance: number;
  source: string;
  session_id: string | null;
  created_at: string;
  updated_at: string;
}

interface LinkRow {
  from_id: string;
  to_id: string;
  relation: string;
  note: string | null;
  created_at: string;
}

interface SessionRow {
  id: string;
  agent: string | null;
  goal: string | null;
  summary: string | null;
  started_at: string;
  ended_at: string | null;
}

const KIND_WEIGHT: Partial<Record<MemoryKind, number>> = {
  decision: 1.25,
  pitfall: 1.25,
  principle: 1.2,
  discussion: 1.0,
  fact: 1.0,
  note: 0.95,
  file: 0.9,
  session: 0.8,
};

const STATUS_WEIGHT: Record<MemoryStatus, number> = {
  active: 1,
  rejected: 0.85,
  superseded: 0.6,
  archived: 0.4,
};

/**
 * The memory store. One instance per project; cheap to open, safe to keep
 * open for the lifetime of an MCP server.
 */
export class Engram {
  readonly root: string;
  readonly dir: string;
  readonly config: EngramConfig;
  readonly db: Db;
  /** Set while importing from jsonl so we don't echo writes back to disk. */
  private muted = false;

  private constructor(root: string, dir: string, config: EngramConfig, db: Db) {
    this.root = root;
    this.dir = dir;
    this.config = config;
    this.db = db;
  }

  static open(options: OpenOptions = {}): Engram {
    const root = options.root ?? findProjectRoot();
    const dir = engramDir(root);
    if (!existsSync(dir)) {
      if (options.create === false) {
        throw new Error(`engram: no .engram/ directory in ${root}. Run \`engram init\` first.`);
      }
      mkdirSync(dir, { recursive: true });
    }
    const config = loadConfig(dir);
    const db = openDb(options.dbFile ?? join(dir, DB_FILE));
    const engram = new Engram(root, dir, config, db);
    if (engram.config.sync.jsonl) engram.withMuted(() => importJsonlIfChanged(engram));
    return engram;
  }

  close(): void {
    this.db.close();
  }

  // ---------------------------------------------------------------- memories

  /**
   * Store a memory. If an active memory with the same kind and (case
   * insensitive) title already exists, it is updated instead — agents tend to
   * "remember" the same thing twice, and duplicates poison recall.
   */
  remember(input: NewMemory): RememberResult {
    const data = NewMemorySchema.parse(input);
    const existing = this.db
      .prepare(
        `SELECT * FROM memories
         WHERE kind = ? AND lower(title) = lower(?) AND status = 'active'
         LIMIT 1`,
      )
      .get(data.kind, data.title) as MemoryRow | undefined;

    if (existing) {
      const memory = this.update(existing.id, {
        content: data.content || existing.content,
        tags: union(parseJson(existing.tags), data.tags),
        files: union(parseJson(existing.files), data.files),
        importance: Math.max(existing.importance, data.importance),
      });
      return { memory, created: false };
    }

    const ts = now();
    const memory: Memory = {
      id: memoryId(data.kind),
      ...data,
      tags: uniq(data.tags),
      files: uniq(data.files),
      createdAt: ts,
      updatedAt: ts,
    };
    this.insert(memory);
    this.changed();
    return { memory, created: true };
  }

  /** Insert or replace a fully formed memory (used by import / sync). */
  put(memory: Memory): void {
    transaction(this.db, () => {
      this.db.prepare(`DELETE FROM memories WHERE id = ?`).run(memory.id);
      this.db.prepare(`DELETE FROM memories_fts WHERE id = ?`).run(memory.id);
      this.insert(memory);
    });
    this.changed();
  }

  private insert(m: Memory): void {
    transaction(this.db, () => {
      this.db
        .prepare(
          `INSERT INTO memories
           (id, kind, title, content, tags, files, status, importance, source, session_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          m.id,
          m.kind,
          m.title,
          m.content,
          JSON.stringify(m.tags),
          JSON.stringify(m.files),
          m.status,
          m.importance,
          m.source,
          m.sessionId,
          m.createdAt,
          m.updatedAt,
        );
      this.db
        .prepare(`INSERT INTO memories_fts (id, title, content, tags, files) VALUES (?, ?, ?, ?, ?)`)
        .run(m.id, m.title, m.content, m.tags.join(' '), m.files.join(' '));
    });
  }

  get(id: string): Memory | null {
    const row = this.db.prepare(`SELECT * FROM memories WHERE id = ?`).get(id) as
      | MemoryRow
      | undefined;
    return row ? toMemory(row) : null;
  }

  /** Like `get`, but throws a helpful error for unknown ids. */
  require(id: string): Memory {
    const m = this.get(id);
    if (!m) throw new Error(`engram: no memory with id "${id}"`);
    return m;
  }

  findBySource(source: string): Memory | null {
    const row = this.db
      .prepare(`SELECT * FROM memories WHERE source = ? ORDER BY created_at LIMIT 1`)
      .get(source) as MemoryRow | undefined;
    return row ? toMemory(row) : null;
  }

  update(id: string, patch: MemoryPatch): Memory {
    const current = this.require(id);
    const p = MemoryPatchSchema.parse(patch);
    const next: Memory = {
      ...current,
      ...stripUndefined(p),
      updatedAt: now(),
    };
    if (p.tags) next.tags = uniq(p.tags);
    if (p.files) next.files = uniq(p.files);
    transaction(this.db, () => {
      this.db.prepare(`DELETE FROM memories WHERE id = ?`).run(id);
      this.db.prepare(`DELETE FROM memories_fts WHERE id = ?`).run(id);
      this.insert(next);
    });
    this.changed();
    return next;
  }

  /**
   * Forget a memory. By default it is archived (kept for history, hidden from
   * recall). `hard: true` deletes it and its links and leaves a tombstone so
   * the deletion propagates through `memories.jsonl`.
   */
  forget(id: string, opts: { hard?: boolean } = {}): void {
    this.require(id);
    if (!opts.hard) {
      this.update(id, { status: 'archived' });
      return;
    }
    transaction(this.db, () => {
      this.deleteLocal(id);
      this.db
        .prepare(
          `INSERT INTO tombstones (id, deleted_at) VALUES (?, ?)
           ON CONFLICT (id) DO UPDATE SET deleted_at = excluded.deleted_at`,
        )
        .run(id, now());
    });
    this.changed();
  }

  /** Delete without leaving a tombstone (used when applying remote tombstones). */
  deleteLocal(id: string): void {
    transaction(this.db, () => {
      this.db.prepare(`DELETE FROM memories WHERE id = ?`).run(id);
      this.db.prepare(`DELETE FROM memories_fts WHERE id = ?`).run(id);
      this.db.prepare(`DELETE FROM links WHERE from_id = ? OR to_id = ?`).run(id, id);
    });
  }

  /**
   * Replace an old memory with a new one: the old one becomes `superseded`
   * and a `supersedes` edge records the history. This is how "we changed our
   * mind" is captured without losing the *why* of the original decision.
   */
  supersede(oldId: string, input: NewMemory, note?: string): Memory {
    const old = this.require(oldId);
    return transaction(this.db, () => {
      const created = this.remember({ kind: old.kind, ...input });
      if (created.memory.id === oldId) {
        throw new Error('engram: a memory cannot supersede itself — use a different title');
      }
      this.update(oldId, { status: 'superseded' });
      this.link(created.memory.id, oldId, 'supersedes', note);
      return created.memory;
    });
  }

  search(opts: SearchOptions = {}): SearchHit[] {
    const limit = clamp(opts.limit ?? 10, 1, 200);
    const where: string[] = [];
    const params: (string | number)[] = [];

    const statuses = opts.statuses?.length
      ? opts.statuses
      : opts.includeInactive
        ? null
        : (['active'] as MemoryStatus[]);
    if (statuses) {
      where.push(`m.status IN (${statuses.map(() => '?').join(', ')})`);
      params.push(...statuses);
    }
    if (opts.kinds?.length) {
      where.push(`m.kind IN (${opts.kinds.map(() => '?').join(', ')})`);
      params.push(...opts.kinds);
    }
    for (const tag of opts.tags ?? []) {
      where.push(`EXISTS (SELECT 1 FROM json_each(m.tags) WHERE value = ?)`);
      params.push(tag.toLowerCase());
    }
    if (opts.files?.length) {
      where.push(
        `EXISTS (SELECT 1 FROM json_each(m.files) WHERE ${opts.files
          .map(() => `(value = ? OR value LIKE ? OR ? LIKE value || '%')`)
          .join(' OR ')})`,
      );
      for (const f of opts.files) params.push(f, `${f}%`, f);
    }

    const fts = opts.query ? toFtsQuery(opts.query) : null;
    let rows: (MemoryRow & { rank?: number; snip?: string | null })[];

    if (fts) {
      // bm25 weights: title matters most, then tags, then content, then files.
      const sql = `
        SELECT m.*, bm25(memories_fts, 0, 6.0, 1.0, 3.0, 1.5) AS rank,
               snippet(memories_fts, 2, '«', '»', '…', 16) AS snip
        FROM memories_fts
        JOIN memories m ON m.id = memories_fts.id
        WHERE memories_fts MATCH ? ${where.length ? 'AND ' + where.join(' AND ') : ''}
        ORDER BY rank
        LIMIT ?`;
      rows = this.db.prepare(sql).all(fts, ...params, limit * 4) as unknown as typeof rows;
    } else {
      const sql = `
        SELECT m.* FROM memories m
        ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
        ORDER BY m.importance DESC, m.updated_at DESC
        LIMIT ?`;
      rows = this.db.prepare(sql).all(...params, limit) as unknown as typeof rows;
    }

    const hits = rows.map((row) => {
      const memory = toMemory(row);
      // bm25 is negative (lower = better); tiny corpora give near-zero values
      const relevance = row.rank !== undefined ? Math.max(0.01, -row.rank) : 1;
      return {
        memory,
        score: round(relevance * boost(memory)),
        snippet: row.snip && row.snip.includes('«') ? row.snip.replace(/\s+/g, ' ').trim() : null,
      };
    });
    if (!fts) return hits.slice(0, limit);
    hits.sort((a, b) => b.score - a.score);
    // OR-queries drag in weak partial matches; keep only the ones in the
    // same league as the best hit.
    const floor = (hits[0]?.score ?? 0) * 0.2;
    return hits.filter((h) => h.score >= floor).slice(0, limit);
  }

  list(opts: Omit<SearchOptions, 'query'> = {}): Memory[] {
    return this.search({ ...opts, limit: opts.limit ?? 50 }).map((h) => h.memory);
  }

  all(): Memory[] {
    const rows = this.db.prepare(`SELECT * FROM memories ORDER BY id`).all() as unknown as MemoryRow[];
    return rows.map(toMemory);
  }

  // ------------------------------------------------------------------- links

  link(from: string, to: string, relation: Relation, note?: string | null): Link {
    RelationSchema.parse(relation);
    if (from === to) throw new Error('engram: cannot link a memory to itself');
    this.require(from);
    this.require(to);
    const link: Link = { from, to, relation, note: note ?? null, createdAt: now() };
    this.putLink(link);
    return link;
  }

  putLink(link: Link): void {
    this.db
      .prepare(
        `INSERT INTO links (from_id, to_id, relation, note, created_at) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (from_id, to_id, relation) DO UPDATE SET note = excluded.note`,
      )
      .run(link.from, link.to, link.relation, link.note, link.createdAt);
    this.changed();
  }

  unlink(from: string, to: string, relation?: Relation): number {
    const res = relation
      ? this.db
          .prepare(`DELETE FROM links WHERE from_id = ? AND to_id = ? AND relation = ?`)
          .run(from, to, relation)
      : this.db.prepare(`DELETE FROM links WHERE from_id = ? AND to_id = ?`).run(from, to);
    if (res.changes) this.changed();
    return Number(res.changes);
  }

  links(id: string): { outgoing: Link[]; incoming: Link[] } {
    const out = this.db
      .prepare(`SELECT * FROM links WHERE from_id = ? ORDER BY created_at`)
      .all(id) as unknown as LinkRow[];
    const inc = this.db
      .prepare(`SELECT * FROM links WHERE to_id = ? ORDER BY created_at`)
      .all(id) as unknown as LinkRow[];
    return { outgoing: out.map(toLink), incoming: inc.map(toLink) };
  }

  allLinks(): Link[] {
    const rows = this.db
      .prepare(`SELECT * FROM links ORDER BY from_id, to_id, relation`)
      .all() as unknown as LinkRow[];
    return rows.map(toLink);
  }

  // ---------------------------------------------------------------- sessions

  startSession(opts: { agent?: string | null; goal?: string | null } = {}): Session {
    const session: Session = {
      id: sessionId(),
      agent: opts.agent ?? null,
      goal: opts.goal ?? null,
      summary: null,
      startedAt: now(),
      endedAt: null,
    };
    this.putSession(session);
    return session;
  }

  /**
   * Close a session. The summary is also stored as a `session` memory, so it
   * is searchable like everything else and shows up in the next resume pack.
   */
  endSession(id: string, summary: string, opts: { tags?: string[] } = {}): Session {
    const s = this.getSession(id);
    if (!s) throw new Error(`engram: no session with id "${id}"`);
    const ended: Session = { ...s, summary, endedAt: now() };
    this.putSession(ended);
    const day = ended.endedAt!.slice(0, 10);
    this.remember({
      kind: 'session',
      title: s.goal ? `${day}: ${s.goal}` : `${day}: session ${s.id}`,
      content: summary,
      tags: opts.tags ?? [],
      importance: 2,
      source: s.agent ?? 'agent',
      sessionId: s.id,
    });
    return ended;
  }

  putSession(s: Session): void {
    this.db
      .prepare(
        `INSERT INTO sessions (id, agent, goal, summary, started_at, ended_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT (id) DO UPDATE SET
           agent = excluded.agent, goal = excluded.goal, summary = excluded.summary,
           started_at = excluded.started_at, ended_at = excluded.ended_at`,
      )
      .run(s.id, s.agent, s.goal, s.summary, s.startedAt, s.endedAt);
    this.changed();
  }

  getSession(id: string): Session | null {
    const row = this.db.prepare(`SELECT * FROM sessions WHERE id = ?`).get(id) as
      | SessionRow
      | undefined;
    return row ? toSession(row) : null;
  }

  recentSessions(limit = 5): Session[] {
    const rows = this.db
      .prepare(`SELECT * FROM sessions ORDER BY started_at DESC LIMIT ?`)
      .all(limit) as unknown as SessionRow[];
    return rows.map(toSession);
  }

  allSessions(): Session[] {
    const rows = this.db
      .prepare(`SELECT * FROM sessions ORDER BY id`)
      .all() as unknown as SessionRow[];
    return rows.map(toSession);
  }

  // ------------------------------------------------------------------- misc

  stats(): Stats {
    const byKind: Stats['byKind'] = {};
    const byStatus: Stats['byStatus'] = {};
    for (const r of this.db
      .prepare(`SELECT kind, count(*) AS n FROM memories GROUP BY kind`)
      .all() as { kind: MemoryKind; n: number }[]) {
      byKind[r.kind] = r.n;
    }
    for (const r of this.db
      .prepare(`SELECT status, count(*) AS n FROM memories GROUP BY status`)
      .all() as { status: MemoryStatus; n: number }[]) {
      byStatus[r.status] = r.n;
    }
    const one = (sql: string) => (this.db.prepare(sql).get() as { v: number | string | null }).v;
    return {
      total: Number(one(`SELECT count(*) AS v FROM memories`)),
      byKind,
      byStatus,
      links: Number(one(`SELECT count(*) AS v FROM links`)),
      sessions: Number(one(`SELECT count(*) AS v FROM sessions`)),
      lastUpdated: (one(`SELECT max(updated_at) AS v FROM memories`) as string | null) ?? null,
    };
  }

  tombstones(): { id: string; deletedAt: string }[] {
    return (
      this.db.prepare(`SELECT id, deleted_at FROM tombstones ORDER BY id`).all() as {
        id: string;
        deleted_at: string;
      }[]
    ).map((r) => ({ id: r.id, deletedAt: r.deleted_at }));
  }

  putTombstone(id: string, deletedAt: string): void {
    this.db
      .prepare(
        `INSERT INTO tombstones (id, deleted_at) VALUES (?, ?)
         ON CONFLICT (id) DO UPDATE SET deleted_at = excluded.deleted_at`,
      )
      .run(id, deletedAt);
  }

  /** Run `fn` without mirroring writes to jsonl, then flush once. */
  batch<T>(fn: () => T): T {
    const result = this.withMuted(() => transaction(this.db, fn));
    this.changed();
    return result;
  }

  private withMuted<T>(fn: () => T): T {
    const prev = this.muted;
    this.muted = true;
    try {
      return fn();
    } finally {
      this.muted = prev;
    }
  }

  private changed(): void {
    if (this.muted || !this.config.sync.jsonl) return;
    exportJsonl(this);
  }
}

// ------------------------------------------------------------------ helpers

function boost(m: Memory): number {
  const importance = 1 + 0.15 * (m.importance - 3);
  const kind = KIND_WEIGHT[m.kind] ?? 1;
  const status = STATUS_WEIGHT[m.status];
  // Gentle recency decay: a memory loses ~30% of its boost over a year.
  const ageDays = (Date.now() - Date.parse(m.updatedAt)) / 86_400_000;
  const recency = 1 - 0.3 * Math.min(1, Math.max(0, ageDays) / 365);
  return importance * kind * status * recency;
}

function toMemory(r: MemoryRow): Memory {
  return {
    id: r.id,
    kind: r.kind as MemoryKind,
    title: r.title,
    content: r.content,
    tags: parseJson(r.tags),
    files: parseJson(r.files),
    status: r.status as MemoryStatus,
    importance: Number(r.importance),
    source: r.source,
    sessionId: r.session_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function toLink(r: LinkRow): Link {
  return {
    from: r.from_id,
    to: r.to_id,
    relation: r.relation as Relation,
    note: r.note,
    createdAt: r.created_at,
  };
}

function toSession(r: SessionRow): Session {
  return {
    id: r.id,
    agent: r.agent,
    goal: r.goal,
    summary: r.summary,
    startedAt: r.started_at,
    endedAt: r.ended_at,
  };
}

function parseJson(s: string): string[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

function uniq(xs: string[]): string[] {
  return [...new Set(xs)];
}

function union(a: string[], b: string[]): string[] {
  return uniq([...a, ...b]);
}

function stripUndefined<T extends object>(o: T): Partial<T> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}
