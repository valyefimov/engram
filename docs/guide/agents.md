# Agents and editors

engram is a standard MCP server that runs over stdio:

```json
{
  "mcpServers": {
    "engram": { "command": "npx", "args": ["-y", "@vefimov/engram", "serve"] }
  }
}
```

The server finds the project by walking up from its working directory to the nearest `.engram/`, or to the git root. Override this with `--root <dir>` or the `ENGRAM_ROOT` variable.

## Claude Code

```bash
engram init --agent claude
```

This writes `.mcp.json`, copies the skills into `.claude/skills/` and adds an engram section to `CLAUDE.md`. To register the server by hand instead:

```bash
claude mcp add engram -- npx -y @vefimov/engram serve
```

The skills become slash commands: `/recall`, `/why-we-did-this`, `/remember-decision`, `/avoid-past-mistakes`, `/project-summary`, `/session-handoff`. To install them for every project, run `engram skills install --global`.

## Cursor

```bash
engram init --agent cursor
```

This writes `.cursor/mcp.json` and an always-applied rule, `.cursor/rules/engram.mdc`. The skills are available as MCP prompts.

## Codex CLI, Windsurf, Zed and others

`init` has no setup for these. Each client keeps its MCP servers in its own configuration, so add the same `command` and `args` as in the JSON above, using the format your client documents. Then put the instructions in `AGENTS.md`:

```bash
engram init --agent agents-md
```

A client without a skills system still gets every skill as an MCP prompt with the same name.

## Several agents, one memory

Every client points at the same `.engram/` directory, so Claude Code can record a decision that Cursor recalls an hour later. SQLite runs in WAL mode, which allows several servers to use the same database at once.
