#!/usr/bin/env node
// node:sqlite prints an ExperimentalWarning on Node 22 — it is stable enough
// for us and the noise confuses people (and pollutes MCP client logs).
const emit = process.emitWarning.bind(process);
process.emitWarning = ((warning: string | Error, ...rest: unknown[]) => {
  const msg = typeof warning === 'string' ? warning : warning.message;
  if (/SQLite/i.test(msg)) return;
  return (emit as (...a: unknown[]) => void)(warning, ...rest);
}) as typeof process.emitWarning;

const { createProgram } = await import('../cli/program.js');
await createProgram().parseAsync(process.argv);
