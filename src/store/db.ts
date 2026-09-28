import { DatabaseSync } from 'node:sqlite';

/**
 * Schema migrations. Append only — never edit a shipped migration, add a new
 * one instead. `meta.schema_version` tracks how far a database has come.
 */
const MIGRATIONS: string[] = [
  /* 1 — initial schema */ `
  CREATE TABLE memories (
    id          TEXT PRIMARY KEY,
    kind        TEXT NOT NULL,
    title       TEXT NOT NULL,
    content     TEXT NOT NULL DEFAULT '',
    tags        TEXT NOT NULL DEFAULT '[]',
    files       TEXT NOT NULL DEFAULT '[]',
    status      TEXT NOT NULL DEFAULT 'active',
    importance  INTEGER NOT NULL DEFAULT 3,
    source      TEXT NOT NULL DEFAULT 'agent',
    session_id  TEXT,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
  );
  CREATE INDEX memories_kind_status ON memories (kind, status);
  CREATE INDEX memories_source ON memories (source);
  CREATE INDEX memories_updated ON memories (updated_at);

  CREATE VIRTUAL TABLE memories_fts USING fts5 (
    id UNINDEXED,
    title,
    content,
    tags,
    files,
    tokenize = 'porter unicode61 remove_diacritics 2'
  );

  CREATE TABLE links (
    from_id     TEXT NOT NULL,
    to_id       TEXT NOT NULL,
    relation    TEXT NOT NULL,
    note        TEXT,
    created_at  TEXT NOT NULL,
    PRIMARY KEY (from_id, to_id, relation)
  );
  CREATE INDEX links_to ON links (to_id);

  CREATE TABLE sessions (
    id          TEXT PRIMARY KEY,
    agent       TEXT,
    goal        TEXT,
    summary     TEXT,
    started_at  TEXT NOT NULL,
    ended_at    TEXT
  );

  CREATE TABLE tombstones (
    id          TEXT PRIMARY KEY,
    deleted_at  TEXT NOT NULL
  );

  CREATE TABLE meta (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  `,
];

export type Db = DatabaseSync;

export function openDb(file: string): Db {
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA busy_timeout = 3000;');
  migrate(db);
  return db;
}

export function schemaVersion(db: Db): number {
  const hasMeta = db
    .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'meta'`)
    .get();
  if (!hasMeta) return 0;
  const row = db.prepare(`SELECT value FROM meta WHERE key = 'schema_version'`).get() as
    | { value: string }
    | undefined;
  return row ? Number(row.value) : 0;
}

function migrate(db: Db): void {
  const current = schemaVersion(db);
  for (let v = current; v < MIGRATIONS.length; v++) {
    transaction(db, () => {
      db.exec(MIGRATIONS[v]!);
      setMeta(db, 'schema_version', String(v + 1));
    });
  }
}

export function getMeta(db: Db, key: string): string | null {
  const row = db.prepare(`SELECT value FROM meta WHERE key = ?`).get(key) as
    | { value: string }
    | undefined;
  return row?.value ?? null;
}

export function setMeta(db: Db, key: string, value: string): void {
  db.prepare(
    `INSERT INTO meta (key, value) VALUES (?, ?)
     ON CONFLICT (key) DO UPDATE SET value = excluded.value`,
  ).run(key, value);
}

const depth = new WeakMap<Db, number>();

/** Run `fn` inside a transaction. Nested calls join the outer transaction. */
export function transaction<T>(db: Db, fn: () => T): T {
  const d = depth.get(db) ?? 0;
  if (d > 0) return fn();
  db.exec('BEGIN');
  depth.set(db, 1);
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  } finally {
    depth.set(db, 0);
  }
}
