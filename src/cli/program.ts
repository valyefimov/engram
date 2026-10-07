import { Command } from 'commander';
import { VERSION } from '../version.js';
import { registerData } from './commands/data.js';
import { registerInit } from './commands/init.js';
import { registerMemory } from './commands/memory.js';
import { registerOverview } from './commands/overview.js';
import { registerServe } from './commands/serve.js';
import { registerSkills } from './commands/skills.js';

export function createProgram(): Command {
  const program = new Command()
    .name('engram')
    .description('A second brain for AI coding agents — long-term project memory over MCP.')
    .version(VERSION, '-v, --version')
    .showHelpAfterError();

  registerInit(program);
  registerServe(program);
  registerOverview(program);
  registerMemory(program);
  registerData(program);
  registerSkills(program);
  return program;
}
