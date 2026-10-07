import type { Command } from 'commander';
import { serveStdio } from '../../mcp/server.js';
import { Engram } from '../../store/engram.js';

export function registerServe(program: Command): void {
  program
    .command('serve')
    .alias('mcp')
    .description('run the MCP server over stdio (this is what your agent launches)')
    .option('-r, --root <dir>', 'project root (default: auto-detect from cwd)')
    .action(async (o: { root?: string }) => {
      // stdout belongs to the MCP protocol — never print to it here.
      const engram = Engram.open({ root: o.root });
      await serveStdio(engram);
    });
}
