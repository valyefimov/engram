# Агенти та редактори

engram — стандартний MCP-сервер, що працює через stdio:

```json
{
  "mcpServers": {
    "engram": { "command": "npx", "args": ["-y", "@vefimov/engram", "serve"] }
  }
}
```

Сервер знаходить проєкт, піднімаючись від робочої директорії до найближчої `.engram/` (або кореня git). Перевизначити можна через `--root <dir>` або `ENGRAM_ROOT`.

## Claude Code

```bash
engram init --agent claude
```

Створює `.mcp.json`, встановлює skills у `.claude/skills/` і додає розділ engram у `CLAUDE.md`. Або вручну:

```bash
claude mcp add engram -- npx -y @vefimov/engram serve
```

Skills стають slash-командами: `/recall`, `/why-we-did-this`, `/remember-decision`, `/avoid-past-mistakes`, `/project-summary`, `/session-handoff`. Для всіх проєктів одразу: `engram skills install --global`.

## Cursor

```bash
engram init --agent cursor
```

Створює `.cursor/mcp.json` і завжди застосовуване правило `.cursor/rules/engram.mdc`. Skills доступні як MCP prompts.

## Codex CLI, Windsurf, Zed та інші

Додайте сервер у MCP-конфіг клієнта (JSON вище; Codex: `~/.codex/config.toml` `[mcp_servers.engram]`, Windsurf: `~/.codeium/windsurf/mcp_config.json`, Zed: `context_servers`). Потім додайте інструкції в `AGENTS.md`:

```bash
engram init --agent agents-md
```

Клієнти без системи skills однаково отримують кожен skill як **MCP prompt** з тією самою назвою.

## Кілька агентів — одна пам’ять

Усі клієнти дивляться в одну `.engram/`, тож Claude Code може записати рішення, яке Cursor згадає за годину. SQLite працює в режимі WAL — паралельні сервери безпечні.
