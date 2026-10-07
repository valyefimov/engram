import { join } from 'node:path';
import type { Command } from 'commander';
import { findProjectRoot } from '../../paths.js';
import { loadSkills } from '../../skills/catalog.js';
import { installSkills } from '../setup.js';
import { c, ok } from '../ui.js';

export function registerSkills(program: Command): void {
  const skills = program.command('skills').description('bundled agent skills');

  skills
    .command('list')
    .description('list bundled skills')
    .action(() => {
      for (const s of loadSkills()) console.log(`${c.bold.cyan(s.name.padEnd(22))} ${c.dim(s.description.split('. ')[0] + '.')}`);
    });

  skills
    .command('install')
    .description('copy skills into .claude/skills (or --dir)')
    .option('-d, --dir <dir>', 'target directory')
    .option('-g, --global', 'install into ~/.claude/skills for all projects')
    .action((o: { dir?: string; global?: boolean }) => {
      const home = process.env.HOME ?? process.env.USERPROFILE ?? '.';
      const dir = o.dir ?? (o.global ? join(home, '.claude', 'skills') : join(findProjectRoot(), '.claude', 'skills'));
      const written = installSkills(dir);
      ok(written.length ? `Installed ${written.length} skills into ${dir}` : `Skills in ${dir} are up to date`);
    });
}
