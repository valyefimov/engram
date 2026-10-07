import { existsSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import type { Command } from 'commander';
import { writeConfig } from '../../config.js';
import { indexProject } from '../../indexer/index.js';
import { engramDir, findProjectRoot } from '../../paths.js';
import { Engram } from '../../store/engram.js';
import { exportJsonl } from '../../store/sync.js';
import { AGENTS, detectAgents, setupAgent, type Agent } from '../setup.js';
import { BANNER, c, fail, list, ok, spin, tildify } from '../ui.js';

export function registerInit(program: Command): void {
  program
    .command('init')
    .description('set up engram in this project and connect your agents')
    .option('-a, --agent <agents>', `comma separated: ${AGENTS.join(', ')}, all (default: auto-detect)`)
    .option('-p, --project <name>', 'project name used in summaries')
    .option('--no-skills', 'do not install skills into .claude/skills')
    .option('--no-index', 'do not scan ADRs and git history')
    .action((opts: { agent?: string; project?: string; skills: boolean; index: boolean }) => {
      console.log(BANNER + '\n');
      const root = findProjectRoot();
      const dir = engramDir(root);
      const fresh = !existsSync(dir);

      const engram = Engram.open({ root });
      if (fresh || !existsSync(join(dir, 'config.json'))) {
        writeConfig(dir, { project: opts.project ?? basename(root) });
        writeFileSync(join(dir, '.gitignore'), 'engram.db\nengram.db-*\n*.tmp\n');
      }
      if (engram.config.sync.jsonl) exportJsonl(engram);
      ok(`${fresh ? 'Created' : 'Found'} ${c.bold('.engram/')} in ${c.dim(tildify(root))}`);

      let agents: Agent[];
      if (!opts.agent) agents = detectAgents(root);
      else if (opts.agent === 'all') agents = AGENTS;
      else {
        agents = list(opts.agent) as Agent[];
        const bad = agents.filter((a) => !AGENTS.includes(a));
        if (bad.length) fail(`unknown agent: ${bad.join(', ')}. Use one of ${AGENTS.join(', ')}, all.`);
      }

      for (const agent of agents) {
        const { changed } = setupAgent(root, agent, { skills: opts.skills });
        const label = { claude: 'Claude Code', cursor: 'Cursor', 'agents-md': 'AGENTS.md' }[agent];
        const skills = changed.filter((f) => f.endsWith('SKILL.md')).length;
        const files = changed.filter((f) => !f.endsWith('SKILL.md'));
        if (skills) files.push(`${skills} skills`);
        ok(`${label}: ${files.length ? files.map((f) => c.dim(f)).join(', ') : c.dim('already set up')}`);
      }

      if (opts.index) {
        const spinner = spin('Indexing ADRs and git history…');
        const r = indexProject(engram);
        spinner.succeed(
          `Indexed in ${r.ms} ms — ${r.adr.added + r.adr.updated} ADRs, ${r.git.commits} commits, ` +
            `${r.git.hotspots} hotspots, ${r.git.scars} possible pitfalls`,
        );
      }

      const stats = engram.stats();
      engram.close();
      console.log(`
${c.bold('Done.')} ${stats.total} memories so far.

Next:
  1. Restart your agent so it picks up the ${c.cyan('engram')} MCP server.
  2. Tell it: ${c.italic('"Use engram."')} — it will start reading and writing memory on its own.
  3. Commit ${c.yellow('.engram/memories.jsonl')} to share memory with your team.

  ${c.dim('engram status · engram recall <query> · engram why <topic> · engram --help')}
`);
    });
}
