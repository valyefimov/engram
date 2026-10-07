import { readFileSync, writeFileSync } from 'node:fs';
import type { Command } from 'commander';
import { indexProject } from '../../indexer/index.js';
import { Engram } from '../../store/engram.js';
import { exportJsonl, importRecords, parseJsonl, serialize } from '../../store/sync.js';
import { toMarkdown } from '../export-md.js';
import { fail, ok, spin, warn } from '../ui.js';

const open = () => Engram.open({ create: false });

export function registerData(program: Command): void {
  program
    .command('index')
    .description('import ADRs and learn hotspots / reverts from git history')
    .option('--no-adr', 'skip ADRs')
    .option('--no-git', 'skip git history')
    .action((o) => {
      const engram = open();
      const spinner = spin('Indexing…');
      const r = indexProject(engram, { adr: o.adr, git: o.git });
      spinner.succeed(`Indexed in ${r.ms} ms`);
      console.log(`  ADRs      ${r.adr.added} added, ${r.adr.updated} updated, ${r.adr.linked} supersede links`);
      console.log(`  git       ${r.git.commits} commits, ${r.git.hotspots} hotspots, ${r.git.scars} possible pitfalls`);
      engram.close();
    });

  program
    .command('export')
    .description('export memory as jsonl (default) or markdown')
    .option('--format <format>', 'jsonl | md', 'jsonl')
    .option('-o, --out <file>', 'write to a file instead of stdout')
    .action((o) => {
      const engram = open();
      const text = o.format === 'md' ? toMarkdown(engram) : o.format === 'jsonl' ? serialize(engram) : fail(`unknown format ${o.format}`);
      engram.close();
      if (o.out) {
        writeFileSync(o.out, text);
        ok(`Wrote ${o.out}`);
      } else {
        process.stdout.write(text);
      }
    });

  program
    .command('import')
    .description('merge a jsonl export into this project (last writer wins)')
    .argument('<file>')
    .action((file: string) => {
      const engram = open();
      const { records, errors } = parseJsonl(readFileSync(file, 'utf8'));
      for (const e of errors) warn(e);
      const r = importRecords(engram, records);
      if (engram.config.sync.jsonl) exportJsonl(engram);
      engram.close();
      ok(`Imported ${r.memories} memories, ${r.links} links, ${r.sessions} sessions (${r.skipped} older duplicates skipped, ${r.deleted} deleted)`);
    });

  program
    .command('sync')
    .description('re-read .engram/memories.jsonl (e.g. after git pull) and rewrite it cleanly')
    .action(() => {
      // Engram.open() already merges a changed jsonl; we only force a clean rewrite.
      const engram = open();
      exportJsonl(engram);
      const s = engram.stats();
      engram.close();
      ok(`In sync — ${s.total} memories, ${s.links} links`);
    });
}
