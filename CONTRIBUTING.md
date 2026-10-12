# Contributing

Thanks for wanting to make agents a little less forgetful.

## Setup

```bash
git clone https://github.com/valyefimov/engram.git
cd engram
npm install
npm test
```

Node 22.13+ is required (`node:sqlite`).

## Useful scripts

| | |
| --- | --- |
| `npm run dev -- <command>` | Run the CLI from source, e.g. `npm run dev -- status` |
| `npm test` / `npm run test:watch` | Vitest |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run build` | Compile to `dist/` |
| `npm run docs:dev` | Docs site with hot reload |
| `npm run media` | Re-render screenshots and the narrated demo videos (needs Chrome, ffmpeg, `pip install edge-tts`) |

## Layout

```
src/
  store/      SQLite schema, the Engram class, search, JSONL sync
  graph/      neighbourhood, lineage, why, pitfall check
  context/    context pack (compressor), project summary, formatting
  indexer/    ADR and git indexers
  mcp/        MCP server, tool renderers, server instructions
  cli/        commander program, commands, agent setup
  skills/     skill loader (the skills themselves live in /skills)
skills/       bundled SKILL.md files
docs/         VitePress site (en / ru / uk)
```

## Guidelines

- Keep zero native dependencies.
- Schema changes go in a **new** migration in `src/store/db.ts`.
- Tool output is Markdown written for an LLM: short, specific, with ids.
- Docs changes should be made in all three languages (English, Russian, Ukrainian). If you can only write one, open the PR anyway and say so.
- Conventional-ish commit messages: `feat:`, `fix:`, `docs:`, `test:`, `chore:`.
