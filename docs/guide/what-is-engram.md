# What is engram?

AI coding agents have amnesia. Every session starts from zero: the agent re-reads the same files, re-proposes the approach you rejected last month, and re-introduces the bug you already fixed twice. Long conversations get compacted and the important parts fall out first.

**engram is a memory layer for agents.** It stores what a good teammate would remember about a project — and nothing that is already obvious from the code:

- **Decisions** and their reasoning — including the options you *rejected* and why.
- **Pitfalls** — mistakes you already paid for, and how to avoid them.
- **Principles** — the rules of the codebase ("no ORMs in the hot path").
- **Sessions** — where the last piece of work stopped and what comes next.
- **Facts, notes, discussions** — everything else worth keeping.

These memories are connected into a **knowledge graph** (`supersedes`, `rejected_because`, `caused_by`, `depends_on`, …), searchable with full-text search in any language, and served to agents through the [Model Context Protocol](https://modelcontextprotocol.io).

## What it feels like

1. You run `npx @vefimov/engram init` once.
2. You tell the agent: **"use engram"**.
3. From then on the agent:
   - starts each task with a short briefing: principles, relevant decisions, known pitfalls, where you left off;
   - says *"three weeks ago we decided not to use Redis because of X — want to see that discussion?"*;
   - checks its plan against old pitfalls before writing code;
   - records new decisions and scars without being asked;
   - can answer "where did we discuss auth?" even if that was forty conversations ago.

## Why not…

| Existing approach | Where it falls short | engram |
| --- | --- | --- |
| Simple memory plugins | A flat list of notes | Typed knowledge graph with history (superseded / rejected) |
| Built-in assistant memory | Closed, per-tool, per-user | Local, open format, works across every MCP client |
| Session-memory tools | Lost when you switch tools | One store for Claude Code, Cursor, Codex, … |
| Hand-written ADRs | People forget to write them | The agent proposes and writes them as you work — and engram imports the ones you already have |
| A huge `CLAUDE.md` | Always loaded, always stale, no history | Retrieved on demand within a token budget |

## Design principles

- **Local-first.** Your memory lives in `.engram/` in your repo. No server, no account, no telemetry.
- **Plain data.** The source of truth is a sorted JSONL file you can read, diff, review and commit.
- **Zero native dependencies.** Built on Node's built-in `node:sqlite` with FTS5 — `npx` just works.
- **Agent-agnostic.** A standard MCP server, plus skills and prompts that teach any agent *when* to read and write.
- **History over overwrite.** Changing your mind supersedes a decision instead of erasing it.

Ready? → [Getting started](./getting-started)
