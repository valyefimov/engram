# Швидкий старт

## Вимоги

- Node.js 22.13 або новіший. engram використовує вбудований модуль `node:sqlite`, тому нічого не компілюється.
- Агент з підтримкою MCP: Claude Code, Cursor, Windsurf, Zed, Codex CLI та інші.

## 1. Ініціалізуйте проєкт

У корені репозиторію:

```bash
npx @vefimov/engram init
```

Або поставте глобально:

```bash
npm i -g @vefimov/engram
engram init
```

`init` робить чотири речі:

1. Створює `.engram/` з `config.json`, локальним індексом SQLite і `memories.jsonl`.
2. Реєструє MCP-сервер для агентів: `.mcp.json` для Claude Code, `.cursor/mcp.json` для Cursor.
3. Копіює шість [skills](../reference/skills) у `.claude/skills/` і додає короткий розділ про пам’ять у `CLAUDE.md` (або правило для Cursor, або `AGENTS.md`).
4. Імпортує те, що репозиторій уже знає. ADR стають рішеннями, а з історії git беруться файли, що часто змінюються, і відкати.

За замовчуванням агенти визначаються автоматично. Обрати їх можна через `--agent`:

```bash
engram init --agent claude,cursor,agents-md
engram init --agent all
```

## 2. Перезапустіть агента

Перезапустіть агента, щоб він підхопив MCP-сервер, і скажіть:

> Використовуй engram.

Сервер надсилає інструкції, у яких сказано, коли агентові читати й писати пам’ять, і цього зазвичай вистачає. У Claude Code skills можна викликати й напряму: `/recall auth`, `/why-we-did-this sessions`, `/remember-decision …`.

## 3. Подивіться, що він знає

```bash
engram status             # лічильники й остання активність
engram recall payments    # пошук
engram why sessions       # історія теми
engram context "додати ретраї в платіжний клієнт"   # брифінг, який отримає агент
engram summary            # огляд проєкту
```

## 4. Закомітьте пам’ять

```bash
git add .engram/memories.jsonl .engram/config.json .mcp.json CLAUDE.md .claude/skills
git commit -m "chore: add engram project memory"
```

`.engram/engram.db` править за локальний кеш і лежить у `.gitignore`. Коли колега робить pull, його engram сам вливає новий `memories.jsonl`. Див. [командну пам’ять](./team).

## Наповніть самі

Чекати на агента необов’язково. Запишіть те, на чому новачки спотикаються завжди:

```bash
engram remember "Жодних ORM у гарячому шляху" -k principle -i 5 \
  -c "Чистий SQL через query builder у src/db. ORM двічі ховав N+1."

engram remember "Вебхукам Stripe потрібне сире тіло запиту" -k pitfall -t payments \
  -f src/webhooks/stripe.ts -c "express.json() ламає перевірку підпису."
```

## Скриншоти

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
