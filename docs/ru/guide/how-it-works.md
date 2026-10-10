# Как это работает

```
┌────────────────────────────────────────────────────────────┐
│          Агент (Claude Code / Cursor / Codex / …)          │
└──────────────────────────────┬─────────────────────────────┘
                               │ MCP (stdio)
┌──────────────────────────────▼─────────────────────────────┐
│                     engram MCP server                      │
│  tools: remember · recall · why · check · context · …      │
│  prompts: встроенные skills · resources: engram://…        │
├───────────────┬──────────────────┬─────────────────────────┤
│  Хранилище    │  Граф            │  Компрессор контекста   │
│  CRUD, дедуп, │  соседи, линия,  │  пакеты под бюджет,     │
│  поиск FTS5   │  why, грабли     │  обзор проекта          │
├───────────────┴──────────────────┴─────────────────────────┤
│  Индексатор: ADR → решения · git → hotspots и откаты       │
└──────────────────────────────┬─────────────────────────────┘
                               │
             ┌─────────────────┴──────────────────┐
             ▼                                    ▼
   .engram/engram.db                     .engram/memories.jsonl
   SQLite + FTS5 (локальный индекс)      отсортированный JSONL (в git)
```

## Хранение

engram использует встроенный в Node `node:sqlite` — компилировать нечего, `npx` работает везде, где есть Node 22.13+. Таблицы: `memories`, `memories_fts` (FTS5, токенизатор Porter + Unicode), `links`, `sessions`, `tombstones`, `meta`. Миграции только добавляются и отслеживаются в `meta.schema_version`.

## Ранжирование

```
score = bm25(title×6, tags×3, content×1, files×1.5)
      × вес вида        (decision, pitfall 1.25 · principle 1.2 · … · session 0.8)
      × важность        (1 + 0.15 × (importance − 3))
      × статус          (active 1 · rejected 0.85 · superseded 0.6 · archived 0.4)
      × свежесть        (теряет до 30% за год)
```

Слабые частичные совпадения (ниже 20% от лучшего) отбрасываются.

## Индексатор

`engram index` (запускается и в `init`) идемпотентен:

- **ADR** в `docs/adr`, `docs/decisions`, `adr`, … (настраивается) разбираются — стили Nygard и MADR, front matter, `Superseded by ADR-0007` — и становятся записями `decision` с рёбрами `supersedes`.
- **Git-история** (по умолчанию последние 500 коммитов) даёт факт *Code hotspots* — чаще всего меняющиеся файлы — и кандидатов в грабли низкой важности из revert'ов и коммитов «fix … again», которые агент подтвердит или удалит.

## Конфигурация

`.engram/config.json`:

```json
{
  "project": "shop",
  "sync": { "jsonl": true },
  "context": { "budget": 2000 },
  "indexer": {
    "adrDirs": ["docs/adr", "docs/adrs", "docs/decisions", "doc/adr", "adr", "decisions"],
    "gitDepth": 500,
    "hotspotThreshold": 8
  }
}
```
