import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach } from 'vitest';
import { Engram } from '../src/store/engram.js';

const dirs: string[] = [];
const opened: Engram[] = [];

export function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'engram-test-'));
  dirs.push(dir);
  return dir;
}

export function tempEngram(root = tempDir()): Engram {
  return track(Engram.open({ root }));
}

/** Close this engram after the test — Windows cannot delete an open database. */
export function track(engram: Engram): Engram {
  opened.push(engram);
  return engram;
}

afterEach(() => {
  while (opened.length) {
    try {
      opened.pop()!.close();
    } catch {
      // already closed by the test
    }
  }
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
});
