# Агенты и редакторы

engram работает как обычный MCP-сервер через stdio:

```json
{
  "mcpServers": {
    "engram": { "command": "npx", "args": ["-y", "@vefimov/engram", "serve"] }
  }
}
```

Сервер находит проект, поднимаясь от рабочей директории к ближайшей `.engram/` или к корню git. Изменить это можно через `--root <dir>` или переменную `ENGRAM_ROOT`.

## Claude Code

```bash
engram init --agent claude
```

Команда создаёт `.mcp.json`, копирует skills в `.claude/skills/` и добавляет раздел про engram в `CLAUDE.md`. Если хотите зарегистрировать сервер вручную:

```bash
claude mcp add engram -- npx -y @vefimov/engram serve
```

Skills становятся slash-командами: `/recall`, `/why-we-did-this`, `/remember-decision`, `/avoid-past-mistakes`, `/project-summary`, `/session-handoff`. Чтобы поставить их для всех проектов, выполните `engram skills install --global`.

## Cursor

```bash
engram init --agent cursor
```

Команда создаёт `.cursor/mcp.json` и всегда применяемое правило `.cursor/rules/engram.mdc`. Skills доступны как MCP prompts.

## Codex CLI, Windsurf, Zed и другие

Для них в `init` нет готовой настройки. Каждый клиент хранит MCP-серверы в своей конфигурации, поэтому добавьте те же `command` и `args`, что в JSON выше, в формате, который описан в документации клиента. Затем положите инструкции в `AGENTS.md`:

```bash
engram init --agent agents-md
```

Клиент без системы skills всё равно получит каждый skill как MCP prompt с тем же именем.

## Несколько агентов, одна память

Все клиенты смотрят в одну директорию `.engram/`, поэтому Claude Code может записать решение, которое Cursor вспомнит через час. SQLite работает в режиме WAL, и это позволяет нескольким серверам пользоваться одной базой одновременно.
