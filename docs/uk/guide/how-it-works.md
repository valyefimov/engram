# Як це працює

```
┌────────────────────────────────────────────────────────────┐
│          Агент (Claude Code / Cursor / Codex / …)          │
└──────────────────────────────┬─────────────────────────────┘
                               │ MCP (stdio)
┌──────────────────────────────▼─────────────────────────────┐
│                     engram MCP server                      │
│  tools: remember · recall · why · check · context · …      │
│  prompts: вбудовані skills · resources: engram://…         │
├───────────────┬──────────────────┬─────────────────────────┤
│  Сховище      │  Граф            │  Компресор контексту    │
│  CRUD, дедуп, │  сусіди, лінія,  │  пакети під бюджет,     │
│  пошук FTS5   │  why, граблі     │  огляд проєкту          │
├───────────────┴──────────────────┴─────────────────────────┤
│  Індексатор: ADR → рішення · git → hotspots і відкати      │
└──────────────────────────────┬─────────────────────────────┘
                               │
             ┌─────────────────┴──────────────────┐
             ▼                                    ▼
   .engram/engram.db                     .engram/memories.jsonl
   SQLite + FTS5 (локальний індекс)      відсортований JSONL (у git)
```

## Зберігання

engram використовує вбудований у Node `node:sqlite` — компілювати нічого, `npx` працює всюди, де є Node 22.13+. Таблиці: `memories`, `memories_fts` (FTS5, токенізатор Porter + Unicode), `links`, `sessions`, `tombstones`, `meta`. Міграції лише додаються й відстежуються в `meta.schema_version`.

## Ранжування

```
score = bm25(title×6, tags×3, content×1, files×1.5)
      × вага виду       (decision, pitfall 1.25 · principle 1.2 · … · session 0.8)
      × важливість      (1 + 0.15 × (importance − 3))
      × статус          (active 1 · rejected 0.85 · superseded 0.6 · archived 0.4)
      × свіжість        (втрачає до 30% за рік)
```

Слабкі часткові збіги (нижче 20% від найкращого) відкидаються.

## Індексатор

`engram index` (запускається й у `init`) ідемпотентний:

- **ADR** у `docs/adr`, `docs/decisions`, `adr`, … (налаштовується) розбираються — стилі Nygard і MADR, front matter, `Superseded by ADR-0007` — і стають записами `decision` з ребрами `supersedes`.
- **Git-історія** (за замовчуванням останні 500 комітів) дає факт *Code hotspots* — файли, що змінюються найчастіше, — і кандидатів у граблі низької важливості з revert’ів і комітів «fix … again», які агент підтвердить або видалить.

## Конфігурація

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
