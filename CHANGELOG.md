# Changelog

## 1.0.2 (2026-10-13)

- Rewrote the README and the documentation in all three languages in plainer wording.
- The home page now shows real `engram init` and `engram why` output from `examples/adr-demo` instead of invented numbers.
- Removed setup details for Codex CLI, Windsurf and Zed that hadn't been verified. `init` only configures Claude Code, Cursor and `AGENTS.md`; other MCP clients take the same server entry.

## 1.0.1 (2026-10-13)

- Fix the package page on npm: it rendered the Ukrainian README instead of the English one. Translated READMEs now live in `translations/` and are no longer part of the package.
- READMEs use absolute image and link URLs so they render the same on GitHub and npm.

## 1.0.0 (2026-10-13)

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
