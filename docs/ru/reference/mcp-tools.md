# MCP-инструменты

Все инструменты возвращают Markdown, потому что модели читают его лучше, чем JSON. Ошибки приходят как tool errors с понятным сообщением.

## Чтение

### `engram_session_start`
Открывает сессию под цель и возвращает контекст-пакет.
`goal?` · `agent?` · `files?` · `budget?`

### `engram_context`
Брифинг под задачу в рамках бюджета токенов: принципы, подходящие решения, грабли, прошлая сессия.
`task?` · `files?` · `budget?` (от 200 до 20000)

### `engram_recall`
Полнотекстовый поиск с фильтрами.
`query?` · `kinds?` · `tags?` · `files?` · `include_inactive?` · `limit?` (до 50)

### `engram_get`
Одна запись целиком, со связями. `id`

### `engram_related`
Обходит граф вокруг записи в обе стороны. `id` · `depth?` (от 1 до 4) · `relations?`

### `engram_why`
Хронология темы: решения, что они заменили, что отвергли и почему, связанные грабли. `topic`

### `engram_check`
Проверяет план на грабли и ранее отвергнутые подходы. `plan` · `files?`

### `engram_summary`
Обзор проекта из памяти. `detail?`: `short` или `full`

## Запись

### `engram_remember`
Сохраняет запись. Если активная запись с тем же видом и заголовком уже есть, она обновляется.
`kind` · `title` · `content?` · `tags?` · `files?` · `importance?` (от 1 до 5) · `status?` · `supersedes?` · `links?: [{ to, relation, note? }]`

### `engram_update`
Редактирует запись. `id` и любые из `title`, `content`, `kind`, `tags`, `files`, `importance`, `status`

### `engram_link`
Связывает две записи. `from` · `to` · `relation` · `note?`

### `engram_forget`
Архивирует запись или удаляет её с `hard`. `id` · `hard?`

### `engram_session_end`
Закрывает сессию с итогом. `summary` · `session_id?` · `tags?`

### `engram_index`
Заново запускает индексатор ADR и git.

## Ресурсы

- `engram://summary`: обзор проекта
- `engram://memory/{id}`: одна запись (список можно просматривать)

## Prompts

Каждый встроенный [skill](./skills) доступен и как MCP prompt с необязательным аргументом `input`.
