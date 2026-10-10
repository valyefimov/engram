# Быстрый старт

## Требования

- **Node.js 22.13+** (engram использует встроенный модуль `node:sqlite` — ничего не компилируется)
- Агент с поддержкой MCP: Claude Code, Cursor, Windsurf, Zed, Codex CLI, …

## 1. Инициализируйте проект

В корне репозитория:

```bash
npx @vefimov/engram init
```

или глобально:

```bash
npm i -g @vefimov/engram
engram init
```

`init` делает четыре вещи:

1. Создаёт `.engram/` с `config.json`, локальным SQLite-индексом и `memories.jsonl`.
2. Регистрирует MCP-сервер для агентов (`.mcp.json` для Claude Code, `.cursor/mcp.json` для Cursor).
3. Ставит шесть готовых [skills](../reference/skills) в `.claude/skills/` и добавляет короткий раздел о памяти в `CLAUDE.md` (или правило Cursor / `AGENTS.md`).
4. Индексирует то, что репозиторий уже знает: ADR становятся решениями, из git-истории извлекаются hotspots и откаченные коммиты.

Агентов можно указать явно через `--agent`:

```bash
engram init --agent claude,cursor,agents-md
engram init --agent all
```

## 2. Перезапустите агента и скажите волшебные слова

Перезапустите агента, чтобы он подхватил MCP-сервер, затем:

> Используй engram.

Сервер отдаёт инструкции, которые объясняют агенту, *когда* читать и писать память, — обычно этого достаточно. В Claude Code skills можно вызывать напрямую: `/recall auth`, `/why-we-did-this sessions`, `/remember-decision …`.

## 3. Смотрите, как растёт память

```bash
engram status             # что знает engram
engram recall payments    # поиск
engram why sessions       # история темы
engram context "добавить ретраи в платёжный клиент"   # что увидит агент
engram summary            # обзор проекта
```

## 4. Закоммитьте память

```bash
git add .engram/memories.jsonl .engram/config.json .mcp.json CLAUDE.md .claude/skills
git commit -m "chore: add engram project memory"
```

`.engram/engram.db` — локальный кэш, он в `.gitignore`. Когда коллеги делают pull, их engram автоматически вливает новый `memories.jsonl`. См. [Командная память](./team).

## Наполните сами

Не обязательно ждать агента. Запишите то, на чём новички всегда спотыкаются:

```bash
engram remember "Никаких ORM в горячем пути" -k principle -i 5 \
  -c "Чистый SQL через query builder в src/db. ORM дважды прятал N+1."

engram remember "Вебхукам Stripe нужно сырое тело запроса" -k pitfall -t payments \
  -f src/webhooks/stripe.ts -c "express.json() ломает проверку подписи."
```

## Скриншоты

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
