# Агенты и редакторы

engram — стандартный MCP-сервер, работающий через stdio:

```json
{
  "mcpServers": {
    "engram": { "command": "npx", "args": ["-y", "@vefimov/engram", "serve"] }
  }
}
```

Сервер находит проект, поднимаясь от рабочей директории к ближайшей `.engram/` (или корню git). Переопределить можно через `--root <dir>` или `ENGRAM_ROOT`.

## Claude Code

```bash
engram init --agent claude
```

Создаёт `.mcp.json`, ставит skills в `.claude/skills/` и добавляет раздел engram в `CLAUDE.md`. Или вручную:

```bash
claude mcp add engram -- npx -y @vefimov/engram serve
```

Skills становятся slash-командами: `/recall`, `/why-we-did-this`, `/remember-decision`, `/avoid-past-mistakes`, `/project-summary`, `/session-handoff`. Для всех проектов сразу: `engram skills install --global`.

## Cursor

```bash
engram init --agent cursor
```

Создаёт `.cursor/mcp.json` и всегда применяемое правило `.cursor/rules/engram.mdc`. Skills доступны как MCP prompts.

## Codex CLI, Windsurf, Zed и другие

Добавьте сервер в MCP-конфиг клиента (JSON выше; Codex: `~/.codex/config.toml` `[mcp_servers.engram]`, Windsurf: `~/.codeium/windsurf/mcp_config.json`, Zed: `context_servers`). Затем добавьте инструкции в `AGENTS.md`:

```bash
engram init --agent agents-md
```

Клиенты без системы skills всё равно получают каждый skill как **MCP prompt** с тем же именем.

## Несколько агентов — одна память

Все клиенты смотрят в одну `.engram/`, поэтому Claude Code может записать решение, которое Cursor вспомнит через час. SQLite работает в режиме WAL — параллельные серверы безопасны.
