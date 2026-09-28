import { existsSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

export const ENGRAM_DIR = '.engram';
export const DB_FILE = 'engram.db';
export const JSONL_FILE = 'memories.jsonl';

/**
 * Walk up from `start` looking for an existing `.engram/` directory, falling
 * back to the nearest git root, falling back to `start` itself. This mirrors
 * how git finds `.git`, so `engram` works from any subdirectory.
 */
export function findProjectRoot(start: string = process.cwd()): string {
  const envRoot = process.env.ENGRAM_ROOT;
  if (envRoot) return resolve(envRoot);

  let dir = resolve(start);
  let gitRoot: string | null = null;
  while (true) {
    if (isDir(join(dir, ENGRAM_DIR))) return dir;
    if (gitRoot === null && existsSync(join(dir, '.git'))) gitRoot = dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return gitRoot ?? resolve(start);
}

export function engramDir(root: string): string {
  return join(root, ENGRAM_DIR);
}

function isDir(p: string): boolean {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
}
