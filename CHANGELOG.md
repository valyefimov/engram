# Changelog

## 1.0.0 — 2026-10-13

First public release. (`0.1.0` was published briefly as a pre-release and is superseded by this version.)

- MCP server with 14 tools (`engram_remember`, `engram_recall`, `engram_why`, `engram_check`, `engram_context`, sessions, graph, index…), resources and prompts
- Memory store on built-in `node:sqlite` with FTS5 search, dedup on write, statuses and history
- Knowledge graph with typed relations, lineage and `why` timelines
- Context compressor with token budgets and session handoff
- Indexer: ADRs (Nygard, MADR) → decisions; git → hotspots and revert/repeat-fix pitfalls
- Git-friendly `memories.jsonl` sync with last-writer-wins merge and tombstones
- CLI: `init`, `serve`, `status`, `summary`, `context`, `remember`, `recall`, `show`, `link`, `graph`, `why`, `check`, `forget`, `index`, `export`, `import`, `sync`, `skills`
- Six skills: remember-decision, recall, why-we-did-this, avoid-past-mistakes, project-summary, session-handoff
- Setup for Claude Code, Cursor and AGENTS.md-based agents
- Documentation site in English, Russian and Ukrainian
