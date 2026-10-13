# Агенти та редактори

engram працює як звичайний MCP-сервер через stdio:

```json
{
  "mcpServers": {
    "engram": { "command": "npx", "args": ["-y", "@vefimov/engram", "serve"] }
  }
}
```

Сервер знаходить проєкт, піднімаючись від робочої директорії до найближчої `.engram/` або до кореня git. Змінити це можна через `--root <dir>` або змінну `ENGRAM_ROOT`.

## Claude Code

```bash
engram init --agent claude
```

Команда створює `.mcp.json`, копіює skills у `.claude/skills/` і додає розділ про engram у `CLAUDE.md`. Якщо хочете зареєструвати сервер вручну:

```bash
claude mcp add engram -- npx -y @vefimov/engram serve
```

Skills стають slash-командами: `/recall`, `/why-we-did-this`, `/remember-decision`, `/avoid-past-mistakes`, `/project-summary`, `/session-handoff`. Щоб поставити їх для всіх проєктів, виконайте `engram skills install --global`.

## Cursor

```bash
engram init --agent cursor
```

Команда створює `.cursor/mcp.json` і правило `.cursor/rules/engram.mdc`, що застосовується завжди. Skills доступні як MCP prompts.

## Codex CLI, Windsurf, Zed та інші

Для них в `init` немає готового налаштування. Кожен клієнт зберігає MCP-сервери у власній конфігурації, тому додайте ті самі `command` і `args`, що в JSON вище, у форматі, який описано в документації клієнта. Потім покладіть інструкції в `AGENTS.md`:

```bash
engram init --agent agents-md
```

Клієнт без системи skills однаково отримає кожен skill як MCP prompt з тією самою назвою.

## Кілька агентів, одна пам’ять

Усі клієнти дивляться в одну директорію `.engram/`, тож Claude Code може записати рішення, яке Cursor згадає за годину. SQLite працює в режимі WAL, і це дозволяє кільком серверам користуватися однією базою одночасно.
