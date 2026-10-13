<p align="center">
  <img src="https://raw.githubusercontent.com/valyefimov/engram/main/docs/public/logo.svg" width="96" alt="engram logo">
</p>

<h1 align="center">engram</h1>

<p align="center">
  <b>A second brain for your coding agent.</b><br>
  Long-term, structured, queryable project memory — decisions, pitfalls, principles and past sessions —<br>
  for Claude Code, Cursor and any MCP client. Local-first. Shared through git.
</p>

<p align="center">
  <a href="https://github.com/valyefimov/engram/actions/workflows/ci.yml"><img src="https://github.com/valyefimov/engram/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@vefimov/engram"><img src="https://img.shields.io/npm/v/@vefimov/engram?color=8b5cf6" alt="npm"></a>
  <img src="https://img.shields.io/badge/node-%E2%89%A522.13-22d3ee" alt="node >= 22.13">
  <img src="https://img.shields.io/badge/MCP-server-a78bfa" alt="MCP">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT"></a>
</p>

<p align="center">
  <a href="https://valyefimov.github.io/engram/">Documentation</a> ·
  <a href="https://valyefimov.github.io/engram/guide/getting-started">Getting started</a> ·
  <a href="https://valyefimov.github.io/engram/demo.mp4">Demo video</a> ·
  <a href="https://github.com/valyefimov/engram/blob/main/translations/README.ru.md">Русский</a> ·
  <a href="https://github.com/valyefimov/engram/blob/main/translations/README.uk.md">Українська</a>
</p>

<p align="center">
  <a href="https://valyefimov.github.io/engram/demo.mp4"><img src="https://raw.githubusercontent.com/valyefimov/engram/main/docs/public/demo-poster.png" width="760" alt="engram demo — click to watch"></a>
</p>

---

AI coding agents have amnesia. Every session starts from zero: the agent re-reads the same files, re-proposes the approach you rejected last month and re-introduces the bug you already fixed twice.

**engram gives your agent a memory.** It remembers what a good teammate would — *why* things are the way they are — and serves it to the agent over [MCP](https://modelcontextprotocol.io) exactly when it is needed.

```bash
npx @vefimov/engram init
```

Then tell your agent: **"use engram."** From that moment it:

- 🧠 opens every task with a short briefing — principles, relevant decisions, known pitfalls, where the last session stopped;
- 💬 says *"three weeks ago we decided not to use Redis because of X — want to see that discussion?"*;
- 🪤 checks its plan against old mistakes **before** writing code;
- ✍️ records decisions, rejected options and scars as they happen — no one has to remember to write ADRs;
- 🔎 answers *"where did we discuss auth?"* even if that was forty conversations ago.

## Features

| | |
| --- | --- |
| **Knowledge graph** | Memories linked with typed edges: `supersedes`, `rejected_because`, `caused_by`, `depends_on`, `implements`, `part_of` |
| **History, not overwrite** | Changing your mind supersedes a decision instead of erasing it. Rejected options are kept — that's what makes "why not X?" answerable |
| **`why` timelines** | `engram why sessions` → what we picked, what it replaced, what we rejected, and why |
| **Pitfall check** | `engram_check` compares a plan against recorded pitfalls and rejected approaches |
| **Context compressor** | Token-budgeted packs: important memories in full, the next tier in one line, the rest one `recall` away |
| **Session continuity** | Handoff notes — done / decided / open / next — that the next session starts from |
| **Repo indexer** | Imports existing ADRs (Nygard, MADR) as decisions; learns hotspots and reverts from git history |
| **Fast multilingual search** | SQLite FTS5 + BM25, stemming, Unicode — English, Russian, Ukrainian and more |
| **Team memory** | A sorted `memories.jsonl` you commit; merges on `git pull`, last-writer-wins, tombstones for deletes |
| **Six skills** | `remember-decision`, `recall`, `why-we-did-this`, `avoid-past-mistakes`, `project-summary`, `session-handoff` |
| **Any agent** | Claude Code, Cursor, Windsurf, Zed, Codex CLI — one memory for all of them |
| **Zero native deps** | Built on Node's built-in `node:sqlite`. `npx` just works |

## Screenshots

<table>
  <tr>
    <td><img src="https://raw.githubusercontent.com/valyefimov/engram/main/docs/public/screenshots/why.png" alt="engram why"></td>
    <td><img src="https://raw.githubusercontent.com/valyefimov/engram/main/docs/public/screenshots/context.png" alt="engram context"></td>
  </tr>
  <tr>
    <td align="center"><code>engram why sessions</code></td>
    <td align="center"><code>engram context "speed up login"</code></td>
  </tr>
  <tr>
    <td><img src="https://raw.githubusercontent.com/valyefimov/engram/main/docs/public/screenshots/check.png" alt="engram check"></td>
    <td><img src="https://raw.githubusercontent.com/valyefimov/engram/main/docs/public/screenshots/init.png" alt="engram init"></td>
  </tr>
  <tr>
    <td align="center"><code>engram check "add retries…"</code></td>
    <td align="center"><code>engram init</code></td>
  </tr>
</table>

## Quick start

```bash
# in your repository
npx @vefimov/engram init            # or: npm i -g @vefimov/engram && engram init
```

`init` creates `.engram/`, registers the MCP server (`.mcp.json`, `.cursor/mcp.json`), installs skills into `.claude/skills/`, adds a memory section to `CLAUDE.md` / `AGENTS.md`, and indexes your ADRs and git history.

Restart your agent and say **"use engram"**. Then commit the memory:

```bash
git add .engram/memories.jsonl .engram/config.json .mcp.json CLAUDE.md .claude/skills
```

Manual MCP setup for any client:

```json
{
  "mcpServers": {
    "engram": { "command": "npx", "args": ["-y", "@vefimov/engram", "serve"] }
  }
}
```

## MCP tools

| Tool | |
| --- | --- |
| `engram_session_start` / `engram_session_end` | Open a session with a context pack · close it with a handoff summary |
| `engram_remember` / `engram_update` / `engram_forget` | Write memory (with `supersedes` and `links`) |
| `engram_recall` / `engram_get` | Search with filters · one memory with links |
| `engram_why` | Timeline of a topic |
| `engram_check` | Check a plan against pitfalls and rejected approaches |
| `engram_context` / `engram_summary` | Token-budgeted briefing · project overview |
| `engram_link` / `engram_related` | Build and walk the knowledge graph |
| `engram_index` | Re-index ADRs and git history |

Plus resources (`engram://summary`, `engram://memory/{id}`) and every skill as an MCP prompt. [Full reference →](https://valyefimov.github.io/engram/reference/mcp-tools)

## CLI

```bash
engram status                                   # what engram knows
engram recall payments --kind pitfall           # search
engram why sessions                             # history of a topic
engram check "move sessions to MongoDB"         # past mistakes that apply
engram context "speed up login" -b 1500         # what the agent sees
engram remember "No ORMs in the hot path" -k principle -i 5 -c "…"
engram link dec_a1 rejected_because pit_b2
engram export --format md -o docs/MEMORY.md     # human-readable dump
```

[All commands →](https://valyefimov.github.io/engram/reference/cli)

## How it works

```
Agent ──MCP──▶ engram server ──▶ memory store (SQLite + FTS5)  ──▶ .engram/engram.db       (local index)
                    │            graph engine · context compressor
                    │            indexer (ADRs, git)            ──▶ .engram/memories.jsonl (commit this)
                    └── tools · resources · prompts (skills)
```

Read more: [Concepts](https://valyefimov.github.io/engram/guide/concepts) · [How it works](https://valyefimov.github.io/engram/guide/how-it-works) · [Team memory](https://valyefimov.github.io/engram/guide/team)

## Roadmap

- **v1.0** — MCP server, memory + graph, context compressor, sessions, ADR/git indexer, skills, CLI, JSONL sync ✅
- **v1.1** — code-aware indexer (tree-sitter), optional local embeddings, stale-memory detection
- **v1.2** — multiple projects, sync beyond git, web UI for the graph
- **v2.0** — embeddings out of the box, one-command integrations, plugins

## Contributing

Issues and PRs are welcome — see [CONTRIBUTING.md](https://github.com/valyefimov/engram/blob/main/CONTRIBUTING.md).

## License

[MIT](https://github.com/valyefimov/engram/blob/main/LICENSE) © Valentyn Yefimov
