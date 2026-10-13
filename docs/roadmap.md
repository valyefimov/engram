# Roadmap

These are plans. Dates and scope can change.

## 1.0: what exists today

- An MCP server with 14 tools, resources, prompts and server instructions
- A memory store on SQLite and FTS5 with no native dependencies, with duplicate handling on write
- A knowledge graph with typed edges, lineage, `why` and a pitfall check
- A context compressor with token budgets, and session handoff
- An ADR importer, plus git hotspots and revert detection
- Six skills, a CLI, and git-friendly JSONL sync with tombstones
- Documentation in English, Russian and Ukrainian

## 1.1: understanding the code

- A code-aware indexer (tree-sitter or ts-morph), with symbols as `file` nodes linked to decisions
- Optional local embeddings (bge or nomic) for hybrid semantic and keyword recall
- Routing of large tool outputs
- Detection of stale memories whose files changed or disappeared

## 1.2: teams

- Several projects, and a personal memory shared across them
- Sync beyond git, through an optional server
- A web UI to browse and edit the graph

## 2.0

- Local embeddings out of the box
- One-command setup for more agents
- A plugin system for custom indexers and memory kinds

Have an idea? [Open an issue](https://github.com/valyefimov/engram/issues).
