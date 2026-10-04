import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { Engram } from '../store/engram.js';
import type { MemoryStatus } from '../types.js';

export interface ParsedAdr {
  file: string;
  number: number | null;
  title: string;
  status: MemoryStatus;
  rawStatus: string;
  body: string;
  supersededBy: number[];
  supersedes: number[];
}

/**
 * Parse a Markdown ADR. Handles the common flavours: Nygard
 * (`## Status\n\nAccepted`), MADR (`status: accepted` front matter or
 * `* Status: accepted`) and plain `Status: Accepted` lines.
 */
export function parseAdr(file: string, text: string): ParsedAdr {
  const name = file.split('/').pop() ?? file;
  const numMatch = name.match(/^(\d{1,5})[-_ ]/);
  const number = numMatch ? Number(numMatch[1]) : null;

  let body = text.replace(/\r\n/g, '\n');
  let frontStatus: string | null = null;
  const front = body.match(/^---\n([\s\S]*?)\n---\n/);
  if (front) {
    frontStatus = front[1]!.match(/^status:\s*(.+)$/im)?.[1]?.trim() ?? null;
    body = body.slice(front[0].length);
  }

  const heading = body.match(/^#\s+(.+)$/m)?.[1]?.trim();
  const title = (heading ?? name.replace(/\.md$/i, ''))
    .replace(/^(ADR[-\s]?)?\d+[.:)\s-]+\s*/i, '')
    .trim();

  const sectionStatus = body.match(/^##+\s*Status\s*\n+\s*([^\n]+)/im)?.[1];
  const lineStatus = body.match(/^\s*[*-]?\s*\**Status\**:?\**\s*:?\s*([^\n]+)/im)?.[1];
  const rawStatus = (frontStatus ?? sectionStatus ?? lineStatus ?? 'accepted')
    .replace(/[*_`]/g, '')
    .trim();

  const refs = (re: RegExp) =>
    [...body.matchAll(re)].map((m) => Number(m[1])).filter((n) => Number.isFinite(n));
  const supersededBy = refs(/superseded by[^\n]*?(?:ADR[-\s]?)?0*(\d{1,5})/gi);
  const supersedes = refs(/(?:^|\n)[^\n]*\bsupersedes\b[^\n]*?(?:ADR[-\s]?)?0*(\d{1,5})/gi);

  return {
    file,
    number,
    title,
    status: mapStatus(rawStatus),
    rawStatus,
    body: summarize(body),
    supersededBy,
    supersedes,
  };
}

function mapStatus(raw: string): MemoryStatus {
  const s = raw.toLowerCase();
  if (s.startsWith('superseded') || s.startsWith('deprecated')) return 'superseded';
  if (s.startsWith('rejected') || s.startsWith('declined')) return 'rejected';
  return 'active';
}

/** Keep the parts of an ADR an agent actually needs: context, decision, consequences. */
function summarize(body: string): string {
  const sections = body.split(/^##\s+/m).slice(1);
  const wanted = /^(context|problem|decision|decision outcome|consequences|rationale|considered options)/i;
  const kept = sections
    .filter((s) => wanted.test(s))
    .map((s) => {
      const [head, ...rest] = s.split('\n');
      return `**${head!.trim()}:** ${rest.join('\n').trim()}`;
    });
  const text = kept.length ? kept.join('\n\n') : body.replace(/^#.*$/m, '').trim();
  return text.length > 2500 ? text.slice(0, 2500).trimEnd() + ' …' : text;
}

export function findAdrFiles(root: string, dirs: string[]): string[] {
  const files: string[] = [];
  for (const d of dirs) {
    const abs = join(root, d);
    if (!existsSync(abs) || !statSync(abs).isDirectory()) continue;
    for (const entry of readdirSync(abs).sort()) {
      if (!/\.md$/i.test(entry) || /^(readme|index|template)/i.test(entry)) continue;
      files.push(join(abs, entry));
    }
  }
  return files;
}

export interface AdrIndexResult {
  added: number;
  updated: number;
  linked: number;
  files: string[];
}

/** Import ADRs as `decision` memories. Idempotent: re-running updates in place. */
export function indexAdrs(engram: Engram): AdrIndexResult {
  const result: AdrIndexResult = { added: 0, updated: 0, linked: 0, files: [] };
  const byNumber = new Map<number, string>();
  const parsed: { adr: ParsedAdr; id: string }[] = [];

  engram.batch(() => {
    for (const abs of findAdrFiles(engram.root, engram.config.indexer.adrDirs)) {
      const file = relative(engram.root, abs);
      const adr = parseAdr(file, readFileSync(abs, 'utf8'));
      const source = `adr:${file}`;
      const tags = ['adr'];
      if (/^proposed/i.test(adr.rawStatus)) tags.push('proposed');
      const existing = engram.findBySource(source);
      const data = {
        title: adr.number !== null ? `ADR-${String(adr.number).padStart(4, '0')}: ${adr.title}` : adr.title,
        content: adr.body,
        status: adr.status,
        files: [file],
        tags,
        importance: 4,
      };
      let id: string;
      if (existing) {
        const changed =
          existing.title !== data.title || existing.content !== data.content || existing.status !== data.status;
        if (changed) {
          engram.update(existing.id, data);
          result.updated++;
        }
        id = existing.id;
      } else {
        id = engram.remember({ kind: 'decision', source, ...data }).memory.id;
        result.added++;
      }
      result.files.push(file);
      if (adr.number !== null) byNumber.set(adr.number, id);
      parsed.push({ adr, id });
    }

    for (const { adr, id } of parsed) {
      for (const n of adr.supersededBy) {
        const newer = byNumber.get(n);
        if (newer && newer !== id) {
          engram.putLink({ from: newer, to: id, relation: 'supersedes', note: 'from ADR', createdAt: new Date().toISOString() });
          result.linked++;
        }
      }
      for (const n of adr.supersedes) {
        const older = byNumber.get(n);
        if (older && older !== id) {
          engram.putLink({ from: id, to: older, relation: 'supersedes', note: 'from ADR', createdAt: new Date().toISOString() });
          result.linked++;
        }
      }
    }
  });
  return result;
}
