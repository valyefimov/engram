# How it works

```
┌────────────────────────────────────────────────────────────┐
│          Agent (Claude Code / Cursor / Codex / …)          │
└──────────────────────────────┬─────────────────────────────┘
                               │ MCP (stdio)
┌──────────────────────────────▼─────────────────────────────┐
│                     engram MCP server                      │
│  tools: remember · recall · why · check · context · …      │
│  prompts: the bundled skills · resources: engram://…       │
├───────────────┬──────────────────┬─────────────────────────┤
│  Memory store │  Graph engine    │  Context compressor     │
│  CRUD, dedup, │  neighborhood,   │  token-budgeted packs,  │
│  FTS5 search  │  lineage, why,   │  project summary        │
│               │  pitfall check   │                         │
├───────────────┴──────────────────┴─────────────────────────┤
│  Indexer: ADRs → decisions · git → hotspots & reverts      │
└──────────────────────────────┬─────────────────────────────┘
                               │
             ┌─────────────────┴──────────────────┐
             ▼                                    ▼
   .engram/engram.db                     .engram/memories.jsonl
   SQLite + FTS5 (local index)           sorted JSONL (committed)
```

## Storage

engram uses Node's built-in `node:sqlite`, so there is nothing to compile and `npx` works everywhere Node 22.13+ runs. Tables: `memories`, `memories_fts` (FTS5, Porter + Unicode tokenizer), `links`, `sessions`, `tombstones`, `meta`. Migrations are append-only and tracked in `meta.schema_version`.

## Ranking

```
score = bm25(title×6, tags×3, content×1, files×1.5)
      × kind weight      (decision, pitfall 1.25 · principle 1.2 · … · session 0.8)
      × importance       (1 + 0.15 × (importance − 3))
      × status           (active 1 · rejected 0.85 · superseded 0.6 · archived 0.4)
      × recency          (loses up to 30% over a year)
```

Weak partial matches (below 20% of the best hit) are dropped.

## The indexer

`engram index` (also run by `init`) is idempotent:

- **ADRs** in `docs/adr`, `docs/decisions`, `adr`, … (configurable) are parsed — Nygard and MADR styles, front matter, `Superseded by ADR-0007` — and become `decision` memories with `supersedes` edges.
- **Git history** (last 500 commits by default) yields a *Code hotspots* fact — files that change most often — and low-importance pitfall candidates from reverts and "fix … again" commits, for the agent to confirm or discard.

## Configuration

`.engram/config.json`:

```json
{
  "project": "shop",
  "sync": { "jsonl": true },
  "context": { "budget": 2000 },
  "indexer": {
    "adrDirs": ["docs/adr", "docs/adrs", "docs/decisions", "doc/adr", "adr", "decisions"],
    "gitDepth": 500,
    "hotspotThreshold": 8
  }
}
```
