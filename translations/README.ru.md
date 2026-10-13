<p align="center">
  <img src="https://raw.githubusercontent.com/valyefimov/engram/main/docs/public/logo.svg" width="96" alt="engram">
</p>

<h1 align="center">engram</h1>

<p align="center">
  <b>Второй мозг для вашего AI-агента.</b><br>
  Долговременная структурированная память проекта — решения, грабли, принципы и прошлые сессии —<br>
  для Claude Code, Cursor и любого MCP-клиента. Локально. Шарится через git.
</p>

<p align="center">
  <a href="https://valyefimov.github.io/engram/ru/">Документация</a> ·
  <a href="https://valyefimov.github.io/engram/ru/guide/getting-started">Быстрый старт</a> ·
  <a href="https://valyefimov.github.io/engram/demo.ru.mp4">Демо-видео</a> ·
  <a href="https://github.com/valyefimov/engram/blob/main/README.md">English</a> ·
  <a href="https://github.com/valyefimov/engram/blob/main/translations/README.uk.md">Українська</a>
</p>

<p align="center">
  <a href="https://valyefimov.github.io/engram/demo.ru.mp4"><img src="https://raw.githubusercontent.com/valyefimov/engram/main/docs/public/demo-poster.png" width="760" alt="демо engram"></a>
</p>

---

AI-агенты страдают амнезией. Каждая сессия начинается с нуля: агент заново читает те же файлы, снова предлагает подход, от которого вы отказались месяц назад, и возвращает баг, который вы уже дважды чинили.

**engram даёт агенту память.** Он помнит то, что помнил бы хороший коллега, — *почему* всё устроено именно так — и отдаёт это агенту через [MCP](https://modelcontextprotocol.io) ровно тогда, когда нужно.

```bash
npx @vefimov/engram init
```

Потом скажите агенту: **«используй engram»**. С этого момента он:

- 🧠 начинает каждую задачу с короткого брифинга — принципы, релевантные решения, известные грабли, где остановилась прошлая сессия;
- 💬 говорит *«3 недели назад мы решили не использовать Redis из-за X. Показать то обсуждение?»*;
- 🪤 проверяет план на старые ошибки **до** того, как писать код;
- ✍️ сам записывает решения, отвергнутые варианты и шрамы — никому не нужно помнить про ADR;
- 🔎 отвечает на *«где мы обсуждали авторизацию?»*, даже если это было сорок диалогов назад.

## Возможности

| | |
| --- | --- |
| **Граф знаний** | Записи связаны типизированными рёбрами: `supersedes`, `rejected_because`, `caused_by`, `depends_on`, `implements`, `part_of` |
| **История, а не перезапись** | Передумали — решение замещается, а не стирается. Отвергнутые варианты сохраняются |
| **Хронология `why`** | `engram why sessions` → что выбрали, что это заменило, что отвергли и почему |
| **Проверка граблей** | `engram_check` сверяет план с граблями и отвергнутыми подходами |
| **Сжатие контекста** | Пакеты под бюджет токенов: важное целиком, следующее в одну строку, остальное — через `recall` |
| **Непрерывность сессий** | Заметки передачи — сделано / решено / открыто / дальше — с которых начинается следующая сессия |
| **Индексатор репозитория** | Импортирует ADR (Nygard, MADR) как решения; находит hotspots и откаты в git-истории |
| **Быстрый многоязычный поиск** | SQLite FTS5 + BM25, стемминг, Unicode — английский, русский, украинский и другие |
| **Командная память** | Отсортированный `memories.jsonl` в git; сливается при `git pull` |
| **Шесть skills** | `remember-decision`, `recall`, `why-we-did-this`, `avoid-past-mistakes`, `project-summary`, `session-handoff` |
| **Любой агент** | Claude Code, Cursor, Windsurf, Zed, Codex CLI — одна память на всех |
| **Без нативных зависимостей** | Встроенный в Node `node:sqlite`. `npx` просто работает |

## Быстрый старт

```bash
# в вашем репозитории
npx @vefimov/engram init            # или: npm i -g @vefimov/engram && engram init
```

`init` создаёт `.engram/`, регистрирует MCP-сервер (`.mcp.json`, `.cursor/mcp.json`), ставит skills в `.claude/skills/`, добавляет раздел о памяти в `CLAUDE.md` / `AGENTS.md` и индексирует ADR и git-историю.

Перезапустите агента и скажите **«используй engram»**. Затем закоммитьте память:

```bash
git add .engram/memories.jsonl .engram/config.json .mcp.json CLAUDE.md .claude/skills
```

Ручная настройка MCP для любого клиента:

```json
{
  "mcpServers": {
    "engram": { "command": "npx", "args": ["-y", "@vefimov/engram", "serve"] }
  }
}
```

## CLI

```bash
engram status                                   # что знает engram
engram recall payments --kind pitfall           # поиск
engram why sessions                             # история темы
engram check "перенести сессии в MongoDB"       # какие старые ошибки применимы
engram context "ускорить логин" -b 1500         # что видит агент
engram remember "Никаких ORM в горячем пути" -k principle -i 5 -c "…"
engram export --format md -o docs/MEMORY.md     # читаемая выгрузка
```

Подробности — в [документации](https://valyefimov.github.io/engram/ru/).

## Лицензия

[MIT](https://github.com/valyefimov/engram/blob/main/LICENSE) © Валентин Ефимов
