# MCP-инструменты

Все инструменты возвращают Markdown — LLM читают его лучше JSON. Ошибки приходят как tool errors с понятным сообщением.

## Чтение

### `engram_session_start`
Открыть сессию под цель и получить контекст-пакет.
`goal?` · `agent?` · `files?` · `budget?`

### `engram_context`
Брифинг под задачу в рамках бюджета токенов: принципы, релевантные решения, грабли, прошлая сессия.
`task?` · `files?` · `budget?` (200–20000)

### `engram_recall`
Полнотекстовый поиск с фильтрами.
`query?` · `kinds?` · `tags?` · `files?` · `include_inactive?` · `limit?` (≤ 50)

### `engram_get`
Одна запись целиком, со связями. `id`

### `engram_related`
Обход графа вокруг записи в обе стороны. `id` · `depth?` (1–4) · `relations?`

### `engram_why`
Хронология темы: решения, что они заменили, что отвергли и почему, связанные грабли. `topic`

### `engram_check`
Проверить план на грабли и ранее отвергнутые подходы. `plan` · `files?`

### `engram_summary`
Обзор проекта из памяти. `detail?`: `short` | `full`

## Запись

### `engram_remember`
Сохранить запись. Тот же вид + заголовок, что у активной → обновление.
`kind` · `title` · `content?` · `tags?` · `files?` · `importance?` (1–5) · `status?` · `supersedes?` · `links?: [{ to, relation, note? }]`

### `engram_update`
Изменить запись. `id` + любые из `title`, `content`, `kind`, `tags`, `files`, `importance`, `status`

### `engram_link`
Связать две записи. `from` · `to` · `relation` · `note?`

### `engram_forget`
Архивировать (по умолчанию) или удалить. `id` · `hard?`

### `engram_session_end`
Закрыть сессию с итогом. `summary` · `session_id?` · `tags?`

### `engram_index`
Перезапустить индексатор ADR и git.

## Ресурсы

- `engram://summary` — обзор проекта
- `engram://memory/{id}` — одна запись (список доступен)

## Prompts

Каждый встроенный [skill](./skills) также доступен как MCP prompt с необязательным аргументом `input`.
