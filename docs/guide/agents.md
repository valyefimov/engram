# Agents & editors

engram is a standard MCP server launched over stdio:

```json
{
  "mcpServers": {
    "engram": { "command": "npx", "args": ["-y", "@vefimov/engram", "serve"] }
  }
}
```

The server finds the project by walking up from its working directory to the nearest `.engram/` (or git root). Override with `--root <dir>` or `ENGRAM_ROOT`.

## Claude Code

```bash
engram init --agent claude
```

Writes `.mcp.json`, installs skills into `.claude/skills/`, and adds an engram section to `CLAUDE.md`. Or register by hand:

```bash
claude mcp add engram -- npx -y @vefimov/engram serve
```

Skills become slash commands: `/recall`, `/why-we-did-this`, `/remember-decision`, `/avoid-past-mistakes`, `/project-summary`, `/session-handoff`. Install them for all projects with `engram skills install --global`.

## Cursor

```bash
engram init --agent cursor
```

Writes `.cursor/mcp.json` and an always-applied rule `.cursor/rules/engram.mdc`. Skills are available as MCP prompts.

## Codex CLI, Windsurf, Zed and others

Add the server to the client's MCP configuration using the JSON above (Codex: `~/.codex/config.toml` `[mcp_servers.engram]`, Windsurf: `~/.codeium/windsurf/mcp_config.json`, Zed: `context_servers`). Then add the instructions to `AGENTS.md`:

```bash
engram init --agent agents-md
```

Clients without a skills system still get every skill as an **MCP prompt** with the same name.

## Several agents, one memory

Every client points at the same `.engram/` directory, so Claude Code can record a decision that Cursor recalls an hour later. SQLite runs in WAL mode, so concurrent servers are safe.
