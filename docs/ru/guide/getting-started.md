# Быстрый старт

## Требования

- Node.js 22.13 или новее. engram использует встроенный модуль `node:sqlite`, поэтому ничего не компилируется.
- Агент с поддержкой MCP: Claude Code, Cursor, Windsurf, Zed, Codex CLI и другие.

## 1. Инициализируйте проект

В корне репозитория:

```bash
npx @vefimov/engram init
```

Или поставьте глобально:

```bash
npm i -g @vefimov/engram
engram init
```

`init` делает четыре вещи:

1. Создаёт `.engram/` с `config.json`, локальным индексом SQLite и `memories.jsonl`.
2. Регистрирует MCP-сервер для агентов: `.mcp.json` для Claude Code, `.cursor/mcp.json` для Cursor.
3. Копирует шесть [skills](../reference/skills) в `.claude/skills/` и добавляет короткий раздел о памяти в `CLAUDE.md` (или правило для Cursor, или `AGENTS.md`).
4. Импортирует то, что репозиторий уже знает. ADR становятся решениями, а из истории git берутся часто меняющиеся файлы и откаты.

По умолчанию агенты определяются автоматически. Выбрать их можно через `--agent`:

```bash
engram init --agent claude,cursor,agents-md
engram init --agent all
```

## 2. Перезапустите агента

Перезапустите агента, чтобы он подхватил MCP-сервер, и скажите:

> Используй engram.

Сервер присылает инструкции, в которых написано, когда агенту читать и писать память, и этого обычно хватает. В Claude Code skills можно вызвать и напрямую: `/recall auth`, `/why-we-did-this sessions`, `/remember-decision …`.

## 3. Посмотрите, что он знает

```bash
engram status             # счётчики и последняя активность
engram recall payments    # поиск
engram why sessions       # история темы
engram context "добавить ретраи в платёжный клиент"   # брифинг, который получит агент
engram summary            # обзор проекта
```

## 4. Закоммитьте память

```bash
git add .engram/memories.jsonl .engram/config.json .mcp.json CLAUDE.md .claude/skills
git commit -m "chore: add engram project memory"
```

`.engram/engram.db` служит локальным кэшем и лежит в `.gitignore`. Когда коллега делает pull, его engram сам вливает новый `memories.jsonl`. См. [командную память](./team).

## Наполните сами

Ждать агента необязательно. Запишите то, на чём новички спотыкаются всегда:

```bash
engram remember "Никаких ORM в горячем пути" -k principle -i 5 \
  -c "Чистый SQL через query builder в src/db. ORM дважды скрывал N+1."

engram remember "Вебхукам Stripe нужно сырое тело запроса" -k pitfall -t payments \
  -f src/webhooks/stripe.ts -c "express.json() ломает проверку подписи."
```

## Скриншоты

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
