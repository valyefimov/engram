# Getting started

## Requirements

- **Node.js 22.13+** (engram uses the built-in `node:sqlite` module — nothing to compile)
- An MCP-capable agent: Claude Code, Cursor, Windsurf, Zed, Codex CLI, …

## 1. Initialize your project

In the root of your repository:

```bash
npx @vefimov/engram init
```

or install globally:

```bash
npm i -g @vefimov/engram
engram init
```

`init` does four things:

1. Creates `.engram/` with `config.json`, a local SQLite index and `memories.jsonl`.
2. Registers the MCP server for your agents (`.mcp.json` for Claude Code, `.cursor/mcp.json` for Cursor).
3. Installs six ready-made [skills](../reference/skills) into `.claude/skills/` and adds a short memory section to `CLAUDE.md` (or a Cursor rule / `AGENTS.md`).
4. Indexes what the repo already knows: ADRs become decisions, git history yields hotspots and reverted commits.

Choose agents explicitly with `--agent`:

```bash
engram init --agent claude,cursor,agents-md
engram init --agent all
```

## 2. Restart the agent and say the magic words

Restart your agent so it picks up the new MCP server, then:

> Use engram.

The server ships instructions that tell the agent *when* to read and write memory, so that is usually all it takes. In Claude Code you can also call the skills directly: `/recall auth`, `/why-we-did-this sessions`, `/remember-decision …`.

## 3. Watch memory grow

```bash
engram status             # what engram knows
engram recall payments    # search
engram why sessions       # history of a topic
engram context "add retries to the payment client"   # what the agent would see
engram summary            # project overview
```

## 4. Commit memory

```bash
git add .engram/memories.jsonl .engram/config.json .mcp.json CLAUDE.md .claude/skills
git commit -m "chore: add engram project memory"
```

`.engram/engram.db` is a local cache and is git-ignored. When teammates pull, their engram merges the new `memories.jsonl` automatically. See [Team memory](./team).

## Seed it yourself

You do not have to wait for the agent. Record the things a newcomer always gets wrong:

```bash
engram remember "No ORMs in the hot path" -k principle -i 5 \
  -c "Raw SQL via the query builder in src/db. ORMs hid N+1s twice."

engram remember "Stripe webhooks need the raw body" -k pitfall -t payments \
  -f src/webhooks/stripe.ts -c "express.json() breaks signature verification."
```

## Screenshots

**`engram init`**

![engram init](/screenshots/init.png)

**`engram why sessions`**

![engram why sessions](/screenshots/why.png)

**`engram check`**

![engram check](/screenshots/check.png)

**`engram context`**

![engram context](/screenshots/context.png)

**`engram status`**

![engram status](/screenshots/status.png)
