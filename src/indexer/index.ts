import type { Engram } from '../store/engram.js';
import { indexAdrs, type AdrIndexResult } from './adr.js';
import { indexGit, type GitIndexResult } from './git.js';

export interface IndexResult {
  adr: AdrIndexResult;
  git: GitIndexResult;
  ms: number;
}

/** Scan the repository for knowledge that already exists outside of engram. */
export function indexProject(engram: Engram, opts: { adr?: boolean; git?: boolean } = {}): IndexResult {
  const started = performance.now();
  const adr = opts.adr === false ? { added: 0, updated: 0, linked: 0, files: [] } : indexAdrs(engram);
  const git = opts.git === false ? { commits: 0, hotspots: 0, scars: 0 } : indexGit(engram);
  return { adr, git, ms: Math.round(performance.now() - started) };
}

export { indexAdrs, parseAdr } from './adr.js';
export { indexGit, hotspots, readLog, scars } from './git.js';
