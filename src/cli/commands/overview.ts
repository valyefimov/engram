import type { Command } from 'commander';
import { relativeTime } from '../../context/format.js';
import { buildContext } from '../../context/pack.js';
import { projectSummary } from '../../context/summary.js';
import { Engram } from '../../store/engram.js';
import { MEMORY_KINDS } from '../../types.js';
import { VERSION } from '../../version.js';
import { c, kindBadge, list, md, tildify } from '../ui.js';

const open = () => Engram.open({ create: false });

export function registerOverview(program: Command): void {
  program
    .command('status')
    .description('what engram knows about this project')
    .action(() => {
      const engram = open();
      const s = engram.stats();
      console.log(`${c.bold.magenta('engram')} ${c.dim('v' + VERSION)}  ${c.dim(tildify(engram.root))}\n`);
      if (!s.total) console.log(c.dim('  No memories yet. Ask your agent to "use engram", or run `engram remember`.\n'));
      const max = Math.max(1, ...Object.values(s.byKind));
      for (const k of MEMORY_KINDS) {
        const n = s.byKind[k] ?? 0;
        if (!n) continue;
        console.log(`  ${kindBadge(k)} ${String(n).padStart(4)} ${c.magenta('▇'.repeat(Math.ceil((n / max) * 24)))}`);
      }
      if (s.total) {
        const statuses = Object.entries(s.byStatus).map(([k, v]) => `${v} ${k}`).join(', ');
        console.log(`\n  ${s.total} memories (${statuses}) · ${s.links} links · ${s.sessions} sessions`);
        console.log(`  last update ${relativeTime(s.lastUpdated!)}`);
      }
      const last = engram.recentSessions(1)[0];
      if (last) console.log(`  last session ${relativeTime(last.startedAt)}${last.goal ? ` — ${last.goal}` : ''}`);
      engram.close();
    });

  program
    .command('summary')
    .description('project overview from memory')
    .option('--full', 'everything, not just the highlights')
    .action((o) => {
      const engram = open();
      console.log(md(projectSummary(engram, { detail: o.full ? 'full' : 'short' })));
      engram.close();
    });

  program
    .command('context')
    .description('print the token-budgeted context pack an agent would get')
    .argument('[task...]')
    .option('-b, --budget <tokens>', 'token budget')
    .option('-f, --file <files>', 'files the task touches')
    .option('--raw', 'print markdown without terminal styling')
    .action((words: string[], o) => {
      const engram = open();
      const pack = buildContext(engram, {
        task: words.join(' ') || undefined,
        files: list(o.file),
        budget: o.budget ? Number(o.budget) : undefined,
      });
      console.log(o.raw ? pack.markdown : md(pack.markdown));
      if (!o.raw) {
        console.log(
          c.dim(
            `\n~${pack.tokens}/${pack.budget} tokens · ${pack.full.length} full · ${pack.compressed.length} compressed · ${pack.dropped.length} dropped`,
          ),
        );
      }
      engram.close();
    });
}
