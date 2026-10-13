<p align="center">
  <img src="https://raw.githubusercontent.com/valyefimov/engram/main/docs/public/logo.svg" width="96" alt="engram">
</p>

<h1 align="center">engram</h1>

<p align="center">
  <b>Другий мозок для вашого AI-агента.</b><br>
  Довготривала структурована пам’ять проєкту — рішення, граблі, принципи та минулі сесії —<br>
  для Claude Code, Cursor і будь-якого MCP-клієнта. Локально. Поширюється через git.
</p>

<p align="center">
  <a href="https://valyefimov.github.io/engram/uk/">Документація</a> ·
  <a href="https://valyefimov.github.io/engram/uk/guide/getting-started">Швидкий старт</a> ·
  <a href="https://valyefimov.github.io/engram/demo.uk.mp4">Демо-відео</a> ·
  <a href="https://github.com/valyefimov/engram/blob/main/README.md">English</a> ·
  <a href="https://github.com/valyefimov/engram/blob/main/translations/README.ru.md">Русский</a>
</p>

<p align="center">
  <a href="https://valyefimov.github.io/engram/demo.uk.mp4"><img src="https://raw.githubusercontent.com/valyefimov/engram/main/docs/public/demo-poster.png" width="760" alt="демо engram"></a>
</p>

---

AI-агенти страждають на амнезію. Кожна сесія починається з нуля: агент знову читає ті самі файли, знову пропонує підхід, від якого ви відмовилися місяць тому, і повертає баг, який ви вже двічі виправляли.

**engram дає агенту пам’ять.** Він пам’ятає те, що пам’ятав би добрий колега, — *чому* все влаштовано саме так — і віддає це агенту через [MCP](https://modelcontextprotocol.io) саме тоді, коли треба.

```bash
npx @vefimov/engram init
```

Потім скажіть агенту: **«використовуй engram»**. Відтепер він:

- 🧠 починає кожне завдання з короткого брифінгу — принципи, релевантні рішення, відомі граблі, де зупинилася минула сесія;
- 💬 каже *«3 тижні тому ми вирішили не використовувати Redis через X. Показати те обговорення?»*;
- 🪤 перевіряє план на старі помилки **до** того, як писати код;
- ✍️ сам записує рішення, відхилені варіанти й шрами — нікому не треба пам’ятати про ADR;
- 🔎 відповідає на *«де ми обговорювали авторизацію?»*, навіть якщо це було сорок діалогів тому.

## Можливості

| | |
| --- | --- |
| **Граф знань** | Записи пов’язані типізованими ребрами: `supersedes`, `rejected_because`, `caused_by`, `depends_on`, `implements`, `part_of` |
| **Історія, а не перезапис** | Передумали — рішення заміщується, а не стирається. Відхилені варіанти зберігаються |
| **Хронологія `why`** | `engram why sessions` → що обрали, що це замінило, що відхилили й чому |
| **Перевірка граблів** | `engram_check` звіряє план із граблями та відхиленими підходами |
| **Стиснення контексту** | Пакети під бюджет токенів: важливе повністю, наступне в один рядок, решта — через `recall` |
| **Безперервність сесій** | Нотатки передачі — зроблено / вирішено / відкрито / далі — з яких починається наступна сесія |
| **Індексатор репозиторію** | Імпортує ADR (Nygard, MADR) як рішення; знаходить hotspots і відкати в git-історії |
| **Швидкий багатомовний пошук** | SQLite FTS5 + BM25, стемінг, Unicode — англійська, українська, російська та інші |
| **Командна пам’ять** | Відсортований `memories.jsonl` у git; зливається під час `git pull` |
| **Шість skills** | `remember-decision`, `recall`, `why-we-did-this`, `avoid-past-mistakes`, `project-summary`, `session-handoff` |
| **Будь-який агент** | Claude Code, Cursor, Windsurf, Zed, Codex CLI — одна пам’ять для всіх |
| **Без нативних залежностей** | Вбудований у Node `node:sqlite`. `npx` просто працює |

## Швидкий старт

```bash
# у вашому репозиторії
npx @vefimov/engram init            # або: npm i -g @vefimov/engram && engram init
```

`init` створює `.engram/`, реєструє MCP-сервер (`.mcp.json`, `.cursor/mcp.json`), встановлює skills у `.claude/skills/`, додає розділ про пам’ять у `CLAUDE.md` / `AGENTS.md` та індексує ADR і git-історію.

Перезапустіть агента й скажіть **«використовуй engram»**. Потім закомітьте пам’ять:

```bash
git add .engram/memories.jsonl .engram/config.json .mcp.json CLAUDE.md .claude/skills
```

Ручне налаштування MCP для будь-якого клієнта:

```json
{
  "mcpServers": {
    "engram": { "command": "npx", "args": ["-y", "@vefimov/engram", "serve"] }
  }
}
```

## CLI

```bash
engram status                                   # що знає engram
engram recall payments --kind pitfall           # пошук
engram why sessions                             # історія теми
engram check "перенести сесії в MongoDB"        # які старі помилки застосовні
engram context "пришвидшити логін" -b 1500      # що бачить агент
engram remember "Жодних ORM у гарячому шляху" -k principle -i 5 -c "…"
engram export --format md -o docs/MEMORY.md     # читабельне вивантаження
```

Деталі — у [документації](https://valyefimov.github.io/engram/uk/).

## Ліцензія

[MIT](https://github.com/valyefimov/engram/blob/main/LICENSE) © Валентин Єфімов
