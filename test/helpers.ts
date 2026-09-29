import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach } from 'vitest';
import { Engram } from '../src/store/engram.js';

const dirs: string[] = [];

export function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'engram-test-'));
  dirs.push(dir);
  return dir;
}

export function tempEngram(root = tempDir()): Engram {
  return Engram.open({ root });
}

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});
