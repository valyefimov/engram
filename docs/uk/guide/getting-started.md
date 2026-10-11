# Швидкий старт

## Вимоги

- **Node.js 22.13+** (engram використовує вбудований модуль `node:sqlite` — нічого не компілюється)
- Агент з підтримкою MCP: Claude Code, Cursor, Windsurf, Zed, Codex CLI, …

## 1. Ініціалізуйте проєкт

У корені репозиторію:

```bash
npx @vefimov/engram init
```

або глобально:

```bash
npm i -g @vefimov/engram
engram init
```

`init` робить чотири речі:

1. Створює `.engram/` з `config.json`, локальним SQLite-індексом і `memories.jsonl`.
2. Реєструє MCP-сервер для агентів (`.mcp.json` для Claude Code, `.cursor/mcp.json` для Cursor).
3. Встановлює шість готових [skills](../reference/skills) у `.claude/skills/` і додає короткий розділ про пам’ять у `CLAUDE.md` (або правило Cursor / `AGENTS.md`).
4. Індексує те, що репозиторій уже знає: ADR стають рішеннями, з git-історії витягуються hotspots і відкочені коміти.

Агентів можна вказати явно через `--agent`:

```bash
engram init --agent claude,cursor,agents-md
engram init --agent all
```

## 2. Перезапустіть агента й скажіть чарівні слова

Перезапустіть агента, щоб він підхопив MCP-сервер, потім:

> Використовуй engram.

Сервер віддає інструкції, які пояснюють агенту, *коли* читати й писати пам’ять, — зазвичай цього достатньо. У Claude Code skills можна викликати напряму: `/recall auth`, `/why-we-did-this sessions`, `/remember-decision …`.

## 3. Дивіться, як росте пам’ять

```bash
engram status             # що знає engram
engram recall payments    # пошук
engram why sessions       # історія теми
engram context "додати ретраї в платіжний клієнт"   # що побачить агент
engram summary            # огляд проєкту
```

## 4. Закомітьте пам’ять

```bash
git add .engram/memories.jsonl .engram/config.json .mcp.json CLAUDE.md .claude/skills
git commit -m "chore: add engram project memory"
```

`.engram/engram.db` — локальний кеш, він у `.gitignore`. Коли колеги роблять pull, їхній engram автоматично вливає новий `memories.jsonl`. Див. [Командна пам’ять](./team).

## Наповніть самі

Не обов’язково чекати на агента. Запишіть те, на чому новачки завжди спотикаються:

```bash
engram remember "Жодних ORM у гарячому шляху" -k principle -i 5 \
  -c "Чистий SQL через query builder у src/db. ORM двічі ховав N+1."

engram remember "Вебхукам Stripe потрібне сире тіло запиту" -k pitfall -t payments \
  -f src/webhooks/stripe.ts -c "express.json() ламає перевірку підпису."
```

## Скриншоти

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
