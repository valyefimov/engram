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
│  Indexer: ADRs → decisions · git → hotspots and reverts    │
└──────────────────────────────┬─────────────────────────────┘
                               │
             ┌─────────────────┴──────────────────┐
             ▼                                    ▼
   .engram/engram.db                     .engram/memories.jsonl
   SQLite + FTS5 (local index)           sorted JSONL (committed)
```

## Storage

engram uses Node's built-in `node:sqlite`, so there is nothing to compile and `npx` works anywhere Node 22.13 or newer runs. The tables are `memories`, `memories_fts` (FTS5 with the Porter and Unicode tokenizer), `links`, `sessions`, `tombstones` and `meta`. Migrations are append-only and tracked in `meta.schema_version`.

## Ranking

```
score = bm25(title×6, tags×3, content×1, files×1.5)
      × kind weight      (decision, pitfall 1.25 · principle 1.2 · … · session 0.8)
      × importance       (1 + 0.15 × (importance − 3))
      × status           (active 1 · rejected 0.85 · superseded 0.6 · archived 0.4)
      × recency          (loses up to 30% over a year)
```

Weak partial matches, below 20% of the best hit, are dropped.

## The indexer

`engram index` also runs during `init`. It can be run repeatedly:

- ADRs in `docs/adr`, `docs/decisions`, `adr` and similar folders (configurable) are parsed. It handles Nygard and MADR styles, front matter and lines like `Superseded by ADR-0007`. Each becomes a `decision` memory, with `supersedes` edges where the ADRs point at each other.
- Git history, the last 500 commits by default, gives a "Code hotspots" fact listing the files that change most. Reverts and "fix … again" commits become low-importance pitfall candidates for the agent to confirm or discard.

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
