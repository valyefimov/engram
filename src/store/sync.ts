import { createHash } from 'node:crypto';
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { JSONL_FILE } from '../paths.js';
import type { Link, Memory, Session } from '../types.js';
import { getMeta, setMeta } from './db.js';
import type { Engram } from './engram.js';

/**
 * `.engram/memories.jsonl` is the portable, git-friendly form of the store:
 * one JSON record per line, sorted by id, so diffs are small and merges are
 * mostly conflict-free. The SQLite file is just a fast local index of it.
 */

export type Record =
  | ({ type: 'memory' } & Memory)
  | ({ type: 'link' } & Link)
  | ({ type: 'session' } & Session)
  | { type: 'tombstone'; id: string; deletedAt: string };

export interface ImportReport {
  memories: number;
  links: number;
  sessions: number;
  deleted: number;
  skipped: number;
}

export function jsonlPath(engram: Engram): string {
  return join(engram.dir, JSONL_FILE);
}

export function serialize(engram: Engram): string {
  const lines: string[] = [];
  for (const m of engram.all()) lines.push(JSON.stringify({ type: 'memory', ...m }));
  for (const l of engram.allLinks()) lines.push(JSON.stringify({ type: 'link', ...l }));
  for (const s of engram.allSessions()) lines.push(JSON.stringify({ type: 'session', ...s }));
  for (const t of engram.tombstones()) lines.push(JSON.stringify({ type: 'tombstone', ...t }));
  return lines.length ? lines.join('\n') + '\n' : '';
}

export function exportJsonl(engram: Engram, file = jsonlPath(engram)): string {
  const text = serialize(engram);
  // write-then-rename so a crash never leaves a half written file behind
  const tmp = `${file}.tmp`;
  writeFileSync(tmp, text);
  renameSync(tmp, file);
  if (file === jsonlPath(engram)) setMeta(engram.db, 'jsonl_hash', hash(text));
  return file;
}

export function parseJsonl(text: string): { records: Record[]; errors: string[] } {
  const records: Record[] = [];
  const errors: string[] = [];
  text.split('\n').forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('<<<<<<<') || trimmed.startsWith('>>>>>>>') || trimmed === '=======') {
      // tolerate unresolved git conflict markers: both sides get merged below
      return;
    }
    try {
      const rec = JSON.parse(trimmed) as Record;
      if (!rec || typeof rec !== 'object' || !('type' in rec)) throw new Error('missing "type"');
      records.push(rec);
    } catch (err) {
      errors.push(`line ${i + 1}: ${(err as Error).message}`);
    }
  });
  return { records, errors };
}

/**
 * Merge records into the store. Last writer wins per memory (by updatedAt);
 * tombstones always win over the memory they point at.
 */
export function importRecords(engram: Engram, records: Record[]): ImportReport {
  const report: ImportReport = { memories: 0, links: 0, sessions: 0, deleted: 0, skipped: 0 };
  const tombstoned = new Set(
    records.filter((r): r is Extract<Record, { type: 'tombstone' }> => r.type === 'tombstone').map((r) => r.id),
  );

  engram.batch(() => {
    for (const rec of records) {
      switch (rec.type) {
        case 'tombstone': {
          if (engram.get(rec.id)) {
            engram.deleteLocal(rec.id);
            report.deleted++;
          }
          engram.putTombstone(rec.id, rec.deletedAt);
          break;
        }
        case 'memory': {
          if (tombstoned.has(rec.id)) break;
          const { type: _type, ...memory } = rec;
          const local = engram.get(memory.id);
          if (local && local.updatedAt >= memory.updatedAt) {
            report.skipped++;
            break;
          }
          engram.put(memory);
          report.memories++;
          break;
        }
        case 'session': {
          const { type: _type, ...session } = rec;
          const local = engram.getSession(session.id);
          if (local && (local.endedAt ?? '') >= (session.endedAt ?? '') && local.summary) break;
          engram.putSession(session);
          report.sessions++;
          break;
        }
        case 'link': {
          const { type: _type, ...link } = rec;
          if (tombstoned.has(link.from) || tombstoned.has(link.to)) break;
          engram.putLink(link);
          report.links++;
          break;
        }
      }
    }
  });
  return report;
}

/**
 * Called on open: if `memories.jsonl` changed since we last wrote it (git
 * pull, a teammate's commit, a manual edit) merge it into the database.
 */
export function importJsonlIfChanged(engram: Engram): ImportReport | null {
  const file = jsonlPath(engram);
  if (!existsSync(file)) return null;
  const text = readFileSync(file, 'utf8');
  const h = hash(text);
  if (getMeta(engram.db, 'jsonl_hash') === h) return null;
  const { records } = parseJsonl(text);
  const report = importRecords(engram, records);
  // Re-export when the merged result differs (local-only records, resolved
  // conflict markers…) so the file on disk is always the full truth.
  if (serialize(engram) !== text) exportJsonl(engram);
  else setMeta(engram.db, 'jsonl_hash', h);
  return report;
}

function hash(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}
