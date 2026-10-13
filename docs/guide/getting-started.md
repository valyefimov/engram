# Getting started

## Requirements

- Node.js 22.13 or newer. engram uses the built-in `node:sqlite` module, so nothing is compiled.
- An agent that speaks MCP: Claude Code, Cursor, Windsurf, Zed, Codex CLI and others.

## 1. Initialize the project

In the root of your repository:

```bash
npx @vefimov/engram init
```

Or install it globally:

```bash
npm i -g @vefimov/engram
engram init
```

`init` does four things:

1. Creates `.engram/` with `config.json`, a local SQLite index and `memories.jsonl`.
2. Registers the MCP server for your agents: `.mcp.json` for Claude Code, `.cursor/mcp.json` for Cursor.
3. Copies six [skills](../reference/skills) into `.claude/skills/` and adds a short memory section to `CLAUDE.md` (or a Cursor rule, or `AGENTS.md`).
4. Imports what the repo already knows. ADRs become decisions, and git history yields frequently changed files and reverted commits.

By default it detects your agents. You can choose them with `--agent`:

```bash
engram init --agent claude,cursor,agents-md
engram init --agent all
```

## 2. Restart the agent

Restart your agent so it loads the MCP server, then say:

> Use engram.

The server sends instructions that tell the agent when to read and write memory, which should be enough. In Claude Code you can also call the skills directly: `/recall auth`, `/why-we-did-this sessions`, `/remember-decision …`.

## 3. Look at what it knows

```bash
engram status             # counts and last activity
engram recall payments    # search
engram why sessions       # history of a topic
engram context "add retries to the payment client"   # the briefing an agent would get
engram summary            # project overview
```

## 4. Commit the memory

```bash
git add .engram/memories.jsonl .engram/config.json .mcp.json CLAUDE.md .claude/skills
git commit -m "chore: add engram project memory"
```

`.engram/engram.db` is a local cache and is git-ignored. When a teammate pulls, their engram merges the new `memories.jsonl` automatically. See [team memory](./team).

## Seed it yourself

You don't have to wait for the agent. Write down the things newcomers always get wrong:

```bash
engram remember "No ORMs in the hot path" -k principle -i 5 \
  -c "Raw SQL via the query builder in src/db. ORMs hid N+1 queries twice."

engram remember "Stripe webhooks need the raw body" -k pitfall -t payments \
  -f src/webhooks/stripe.ts -c "express.json() breaks signature verification."
```

## Screenshots

`engram init`

![engram init](/screenshots/init.png)

`engram why sessions`

![engram why sessions](/screenshots/why.png)

`engram check`

![engram check](/screenshots/check.png)

`engram context`

![engram context](/screenshots/context.png)

`engram status`

![engram status](/screenshots/status.png)
