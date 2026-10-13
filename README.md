<p align="center">
  <img src="https://raw.githubusercontent.com/valyefimov/engram/main/docs/public/logo.svg" width="96" alt="engram logo">
</p>

<h1 align="center">engram</h1>

<p align="center">
  Long-term memory for AI coding agents.<br>
  It keeps decisions, pitfalls and session notes in your repo and gives them to the agent over MCP.
</p>

<p align="center">
  <a href="https://github.com/valyefimov/engram/actions/workflows/ci.yml"><img src="https://github.com/valyefimov/engram/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@vefimov/engram"><img src="https://img.shields.io/npm/v/@vefimov/engram?color=8b5cf6" alt="npm"></a>
  <img src="https://img.shields.io/badge/node-%E2%89%A522.13-22d3ee" alt="node >= 22.13">
  <img src="https://img.shields.io/badge/MCP-server-a78bfa" alt="MCP">
  <a href="https://github.com/valyefimov/engram/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT"></a>
</p>

<p align="center">
  <a href="https://valyefimov.github.io/engram/">Documentation</a> ·
  <a href="https://valyefimov.github.io/engram/guide/getting-started">Getting started</a> ·
  <a href="https://valyefimov.github.io/engram/demo.mp4">Demo video</a> ·
  <a href="https://github.com/valyefimov/engram/blob/main/translations/README.ru.md">Русский</a> ·
  <a href="https://github.com/valyefimov/engram/blob/main/translations/README.uk.md">Українська</a>
</p>

<p align="center">
  <a href="https://valyefimov.github.io/engram/demo.mp4"><img src="https://raw.githubusercontent.com/valyefimov/engram/main/docs/public/demo-poster.png" width="760" alt="engram demo, click to watch"></a>
</p>

---

A coding agent forgets everything when the session ends. The next one reads the same files again, suggests the approach you dropped last month, and can reintroduce a bug you already fixed twice.

engram stores what a teammate would remember: why the code looks the way it does. Decisions go in with their reasoning, and so do the options you rejected. Mistakes you paid for go in as pitfalls. Everything lives in `.engram/` inside your repo, and the agent reads it through an MCP server.

```bash
npx @vefimov/engram init
```

Restart your agent and tell it "use engram". From then on, it should:

- start a task by asking engram for a short briefing: project principles, relevant decisions, known pitfalls, and where the last session stopped;
- check a plan against recorded pitfalls and rejected options before it writes code;
- write down decisions and problems as they come up, and mark a decision as superseded when you change your mind;
- answer "why do we do it this way?" from the recorded history instead of guessing.

The server sends the agent instructions on when to read and when to write, so "use engram" is meant to be enough. The test suite drives the server through the MCP SDK client, and the CLI is exercised end to end. How well a given agent follows the instructions varies, and it hasn't been checked in every client.

## What it stores

Each memory has a kind (decision, pitfall, principle, fact, note, discussion, file or session), a title, free text, tags, related files, a status and an importance from 1 to 5. Memories link to each other with typed edges: `supersedes`, `rejected_because`, `caused_by`, `depends_on`, `implements`, `part_of`, `relates_to`.

When you change your mind, the old decision is marked superseded and linked to the new one. It isn't deleted. Rejected options stay too, which is what lets `engram why` answer "why didn't we use Redis?".

## Quick start

```bash
# in your repository
npx @vefimov/engram init            # or: npm i -g @vefimov/engram && engram init
```

`init` creates `.engram/`, registers the MCP server (`.mcp.json` for Claude Code, `.cursor/mcp.json` for Cursor), copies six skills into `.claude/skills/`, adds a short section to `CLAUDE.md` or `AGENTS.md`, and imports your ADRs and git history.

Then commit the memory so your team gets it too:

```bash
git add .engram/memories.jsonl .engram/config.json .mcp.json CLAUDE.md .claude/skills
```

Any other MCP client can use the same server entry:

```json
{
  "mcpServers": {
    "engram": { "command": "npx", "args": ["-y", "@vefimov/engram", "serve"] }
  }
}
```

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

## MCP tools

| Tool | What it does |
| --- | --- |
| `engram_session_start`, `engram_session_end` | Open a session and get a context pack; close it with a handoff summary |
| `engram_remember`, `engram_update`, `engram_forget` | Write memory, with `supersedes` and `links` |
| `engram_recall`, `engram_get` | Search with filters; read one memory with its links |
| `engram_why` | The history of a topic as a timeline |
| `engram_check` | Compare a plan with recorded pitfalls and rejected options |
| `engram_context`, `engram_summary` | A briefing that fits a token budget; a project overview |
| `engram_link`, `engram_related` | Add and walk edges in the graph |
| `engram_index` | Re-import ADRs and git history |

The server also exposes `engram://summary` and `engram://memory/{id}` as resources, and each bundled skill as an MCP prompt. See the [reference](https://valyefimov.github.io/engram/reference/mcp-tools) for the arguments.

## CLI

```bash
engram status                                   # counts and last activity
engram recall payments --kind pitfall           # search
engram why sessions                             # history of a topic
engram check "move sessions to MongoDB"         # pitfalls that apply to a plan
engram context "speed up login" -b 1500        # what the agent would see
engram remember "No ORMs in the hot path" -k principle -i 5 -c "…"
engram link dec_a1 rejected_because pit_b2
engram export --format md -o docs/MEMORY.md     # readable dump
```

All commands are in the [CLI reference](https://valyefimov.github.io/engram/reference/cli).

## How it works

```
Agent ──MCP──▶ engram server ──▶ memory store (SQLite + FTS5)  ──▶ .engram/engram.db       (local index)
                    │            graph engine, context compressor
                    │            indexer (ADRs, git)            ──▶ .engram/memories.jsonl (commit this)
                    └── tools, resources, prompts (skills)
```

The database is a local index built on Node's built-in `node:sqlite`, so there is nothing to compile. `memories.jsonl` is the source of truth: one record per line, sorted by id, so diffs stay small and merges rarely conflict. When it changes under you (a `git pull`, say), engram merges it into the local index the next time it opens. The newest `updatedAt` wins, and deletions travel as tombstones.

The context pack fits memories into a token budget. The most important ones go in full, the next tier is cut to one line each, and the rest is left out with a note on how many were dropped.

More detail: [concepts](https://valyefimov.github.io/engram/guide/concepts), [how it works](https://valyefimov.github.io/engram/guide/how-it-works), [team memory](https://valyefimov.github.io/engram/guide/team).

## Roadmap

- 1.0: the MCP server, memory and graph, context packs, sessions, the ADR and git importer, skills, the CLI and JSONL sync. This is what you get today.
- 1.1: a code-aware indexer (tree-sitter), optional local embeddings, detection of stale memories.
- 1.2: several projects, sync beyond git, a web UI for the graph.
- 2.0: embeddings out of the box, one-command setup for more agents, plugins.

These are plans, not promises.

## Contributing

Issues and pull requests are welcome. See [CONTRIBUTING.md](https://github.com/valyefimov/engram/blob/main/CONTRIBUTING.md).

## License

[MIT](https://github.com/valyefimov/engram/blob/main/LICENSE) © Valentyn Yefimov
