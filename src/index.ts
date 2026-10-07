/**
 * Programmatic API. The CLI and the MCP server are thin layers on top of this;
 * use it to embed engram in your own agent or tooling.
 */
export { Engram, type OpenOptions, type RememberResult, type Stats } from './store/engram.js';
export { exportJsonl, importRecords, parseJsonl, serialize } from './store/sync.js';
export { buildContext, type ContextOptions, type ContextPack } from './context/pack.js';
export { projectSummary } from './context/summary.js';
export { checkPitfalls, lineage, neighborhood, why, type Subgraph, type WhyReport } from './graph/graph.js';
export { indexProject } from './indexer/index.js';
export { createServer, serveStdio } from './mcp/server.js';
export { loadSkills, type Skill } from './skills/catalog.js';
export { ConfigSchema, type EngramConfig } from './config.js';
export { VERSION } from './version.js';
export * from './types.js';
