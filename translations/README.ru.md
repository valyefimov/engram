<p align="center">
  <img src="https://raw.githubusercontent.com/valyefimov/engram/main/docs/public/logo.svg" width="96" alt="engram">
</p>

<h1 align="center">engram</h1>

<p align="center">
  Долговременная память для AI-агентов, которые пишут код.<br>
  Решения, грабли и заметки о сессиях хранятся в репозитории, а агент получает их по MCP.
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

Когда сессия заканчивается, агент забывает всё. Следующая снова читает те же файлы, предлагает подход, от которого вы отказались месяц назад, и может вернуть баг, который вы уже дважды чинили.

engram хранит то, что помнил бы коллега: почему код устроен именно так. Решения записываются вместе с аргументами, отвергнутые варианты тоже. Ошибки, за которые уже заплатили, попадают в «грабли». Всё лежит в `.engram/` внутри репозитория, а агент читает это через MCP-сервер.

```bash
npx @vefimov/engram init
```

Перезапустите агента и скажите ему «используй engram». После этого он должен:

- начинать задачу с короткого брифинга от engram: принципы проекта, подходящие решения, известные грабли и то, где остановилась прошлая сессия;
- перед написанием кода сверять план с записанными граблями и уже отвергнутыми вариантами;
- записывать решения и проблемы по мере появления и помечать решение замещённым, когда вы передумали;
- отвечать на вопрос «почему мы так делаем?» по записанной истории, а не по догадке.

Сервер присылает агенту инструкции о том, когда читать и когда писать память, поэтому фразы «используй engram» должно хватать. Тесты гоняют сервер через клиент MCP SDK, а CLI проверен целиком. Насколько хорошо конкретный агент следует инструкциям, зависит от агента, и проверено это не во всех клиентах.

## Быстрый старт

```bash
# в вашем репозитории
npx @vefimov/engram init            # или: npm i -g @vefimov/engram && engram init
```

`init` создаёт `.engram/`, регистрирует MCP-сервер (`.mcp.json` для Claude Code, `.cursor/mcp.json` для Cursor), копирует шесть skills в `.claude/skills/`, добавляет короткий раздел в `CLAUDE.md` или `AGENTS.md` и импортирует ваши ADR и историю git.

Потом закоммитьте память, чтобы она досталась и команде:

```bash
git add .engram/memories.jsonl .engram/config.json .mcp.json CLAUDE.md .claude/skills
```

Любой другой MCP-клиент может использовать ту же запись сервера:

```json
{
  "mcpServers": {
    "engram": { "command": "npx", "args": ["-y", "@vefimov/engram", "serve"] }
  }
}
```

## Что хранится

У каждой записи есть вид (decision, pitfall, principle, fact, note, discussion, file или session), заголовок, текст, теги, связанные файлы, статус и важность от 1 до 5. Записи связываются типизированными рёбрами: `supersedes`, `rejected_because`, `caused_by`, `depends_on`, `implements`, `part_of`, `relates_to`.

Когда вы передумали, старое решение помечается замещённым и связывается с новым. Оно не удаляется. Отвергнутые варианты тоже остаются, поэтому `engram why` может ответить, почему не взяли Redis.

## CLI

```bash
engram status                                   # счётчики и последняя активность
engram recall payments --kind pitfall           # поиск
engram why sessions                             # история темы
engram check "перенести сессии в MongoDB"       # какие грабли относятся к плану
engram context "ускорить логин" -b 1500         # что увидит агент
engram remember "Никаких ORM в горячем пути" -k principle -i 5 -c "…"
engram export --format md -o docs/MEMORY.md     # читаемая выгрузка
```

Остальные команды описаны в [справочнике по CLI](https://valyefimov.github.io/engram/ru/reference/cli).

## Как это устроено

База данных служит локальным индексом на встроенном в Node `node:sqlite`, ничего компилировать не нужно. Источник истины лежит в `memories.jsonl`: одна запись на строку, отсортировано по id, поэтому диффы небольшие, а конфликты при слиянии редки. Когда файл меняется без вас (например, после `git pull`), engram вливает его в локальный индекс при следующем запуске. Побеждает самый свежий `updatedAt`, а удаления передаются через tombstones.

Подробнее в [документации](https://valyefimov.github.io/engram/ru/guide/concepts).

## Дорожная карта

- 1.0: MCP-сервер, память и граф, контекст-пакеты, сессии, импорт ADR и git, skills, CLI, синхронизация через JSONL. Это то, что есть сейчас.
- 1.1: индексатор кода (tree-sitter), необязательные локальные эмбеддинги, поиск устаревших записей.
- 1.2: несколько проектов, синхронизация не только через git, веб-интерфейс для графа.
- 2.0: эмбеддинги из коробки, настройка для других агентов одной командой, плагины.

Это планы, а не обещания.

## Лицензия

[MIT](https://github.com/valyefimov/engram/blob/main/LICENSE) © Valentyn Yefimov
