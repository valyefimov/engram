# Contributing

Issues and pull requests are welcome.

## Setup

```bash
git clone https://github.com/valyefimov/engram.git
cd engram
npm install
npm test
```

You need Node 22.13 or newer, because engram uses `node:sqlite`.

## Scripts

| | |
| --- | --- |
| `npm run dev -- <command>` | Run the CLI from source, for example `npm run dev -- status` |
| `npm test` / `npm run test:watch` | Vitest |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run build` | Compile to `dist/` |
| `npm run docs:dev` | The docs site with hot reload |
| `npm run media` | Re-render the screenshots and demo videos. Needs Chrome, ffmpeg and `pip install edge-tts` |

## Layout

```
src/
  store/      SQLite schema, the Engram class, search, JSONL sync
  graph/      neighborhood, lineage, why, pitfall check
  context/    context pack (the compressor), project summary, formatting
  indexer/    ADR and git indexers
  mcp/        MCP server, tool renderers, server instructions
  cli/        commander program, commands, agent setup
  skills/     skill loader (the skills themselves live in /skills)
skills/       bundled SKILL.md files
translations/ the README in Russian and Ukrainian
docs/         VitePress site (en, ru, uk)
```

The translated READMEs sit in `translations/` on purpose. npm picks any `README.*` file in the package root for the package page, and an earlier release showed the Ukrainian one.

## Guidelines

- Keep the package free of native dependencies.
- A schema change goes into a new migration in `src/store/db.ts`. Don't edit an existing one.
- Tool output is Markdown written for a model: short, specific, with ids.
- Docs changes should cover all three languages. If you can only write one, open the pull request anyway and say so.
- Commit messages follow the usual prefixes: `feat:`, `fix:`, `docs:`, `test:`, `chore:`.
