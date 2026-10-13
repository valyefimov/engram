# Roadmap

## v1.0 — memory that works ✅

- MCP server: 14 tools, resources, prompts, server instructions
- Memory store on SQLite + FTS5 (zero native deps), dedup on write
- Knowledge graph with typed edges, lineage, `why`, pitfall check
- Context compressor with token budgets, session handoff
- ADR import, git hotspots and revert detection
- 6 skills, CLI, git-friendly JSONL sync with tombstones
- Docs in English, Russian and Ukrainian

## v1.1 — understanding the code

- Code-aware indexer (tree-sitter / ts-morph): symbols as `file` nodes linked to decisions
- Optional local embeddings (bge / nomic) for hybrid semantic + keyword recall
- Automatic context routing for large tool outputs
- Memory hygiene: detect stale memories whose files changed or disappeared

## v1.2 — teams

- Multiple projects and a personal cross-project memory
- Sync beyond git (optional server)
- Web UI to explore and edit the graph

## v2.0

- Local embeddings out of the box
- One-command integrations for popular agents
- Plugin system for custom indexers and memory kinds

Have an idea? [Open an issue](https://github.com/valyefimov/engram/issues).
