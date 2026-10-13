<p align="center">
  <img src="https://raw.githubusercontent.com/valyefimov/engram/main/docs/public/logo.svg" width="96" alt="engram">
</p>

<h1 align="center">engram</h1>

<p align="center">
  Довготривала пам’ять для AI-агентів, які пишуть код.<br>
  Рішення, граблі та нотатки про сесії зберігаються в репозиторії, а агент отримує їх через MCP.
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

Коли сесія закінчується, агент забуває все. Наступна знову читає ті самі файли, пропонує підхід, від якого ви відмовилися місяць тому, і може повернути баг, який ви вже двічі виправляли.

engram зберігає те, що пам’ятав би колега: чому код влаштований саме так. Рішення записуються разом з аргументами, відхилені варіанти теж. Помилки, за які вже заплатили, потрапляють у «граблі». Усе лежить у `.engram/` усередині репозиторію, а агент читає це через MCP-сервер.

```bash
npx @vefimov/engram init
```

Перезапустіть агента й скажіть йому «використовуй engram». Після цього він має:

- починати завдання з короткого брифінгу від engram: принципи проєкту, відповідні рішення, відомі граблі та те, де зупинилася минула сесія;
- перед написанням коду звіряти план із записаними граблями та вже відхиленими варіантами;
- записувати рішення й проблеми в міру появи та позначати рішення заміщеним, коли ви передумали;
- відповідати на питання «чому ми так робимо?» за записаною історією, а не за здогадкою.

Сервер надсилає агентові інструкції про те, коли читати й коли писати пам’ять, тому фрази «використовуй engram» має вистачати. Тести проганяють сервер через клієнт MCP SDK, а CLI перевірено повністю. Наскільки добре конкретний агент дотримується інструкцій, залежить від агента, і перевірено це не в усіх клієнтах.

## Швидкий старт

```bash
# у вашому репозиторії
npx @vefimov/engram init            # або: npm i -g @vefimov/engram && engram init
```

`init` створює `.engram/`, реєструє MCP-сервер (`.mcp.json` для Claude Code, `.cursor/mcp.json` для Cursor), копіює шість skills у `.claude/skills/`, додає короткий розділ у `CLAUDE.md` або `AGENTS.md` та імпортує ваші ADR й історію git.

Потім закомітьте пам’ять, щоб вона дісталася й команді:

```bash
git add .engram/memories.jsonl .engram/config.json .mcp.json CLAUDE.md .claude/skills
```

Будь-який інший MCP-клієнт може використати той самий запис сервера:

```json
{
  "mcpServers": {
    "engram": { "command": "npx", "args": ["-y", "@vefimov/engram", "serve"] }
  }
}
```

## Що зберігається

Кожен запис має вид (decision, pitfall, principle, fact, note, discussion, file або session), заголовок, текст, теги, пов’язані файли, статус і важливість від 1 до 5. Записи зв’язуються типізованими ребрами: `supersedes`, `rejected_because`, `caused_by`, `depends_on`, `implements`, `part_of`, `relates_to`.

Коли ви передумали, старе рішення позначається заміщеним і зв’язується з новим. Воно не видаляється. Відхилені варіанти теж лишаються, тому `engram why` може відповісти, чому не взяли Redis.

## CLI

```bash
engram status                                   # лічильники й остання активність
engram recall payments --kind pitfall           # пошук
engram why sessions                             # історія теми
engram check "перенести сесії в MongoDB"        # які граблі стосуються плану
engram context "пришвидшити логін" -b 1500      # що побачить агент
engram remember "Жодних ORM у гарячому шляху" -k principle -i 5 -c "…"
engram export --format md -o docs/MEMORY.md     # читабельне вивантаження
```

Решту команд описано в [довіднику CLI](https://valyefimov.github.io/engram/uk/reference/cli).

## Як це влаштовано

База даних править за локальний індекс на вбудованому в Node `node:sqlite`, нічого компілювати не потрібно. Джерело істини лежить у `memories.jsonl`: один запис на рядок, відсортовано за id, тому діфи невеликі, а конфлікти під час злиття трапляються рідко. Коли файл змінюється без вас (наприклад, після `git pull`), engram вливає його в локальний індекс під час наступного запуску. Перемагає найсвіжіший `updatedAt`, а видалення передаються через tombstones.

Докладніше в [документації](https://valyefimov.github.io/engram/uk/guide/concepts).

## Дорожня карта

- 1.0: MCP-сервер, пам’ять і граф, контекст-пакети, сесії, імпорт ADR і git, skills, CLI, синхронізація через JSONL. Це те, що є зараз.
- 1.1: індексатор коду (tree-sitter), необов’язкові локальні ембедінги, пошук застарілих записів.
- 1.2: кілька проєктів, синхронізація не лише через git, веб-інтерфейс для графа.
- 2.0: ембедінги з коробки, налаштування для інших агентів однією командою, плагіни.

Це плани, а не обіцянки.

## Ліцензія

[MIT](https://github.com/valyefimov/engram/blob/main/LICENSE) © Valentyn Yefimov
