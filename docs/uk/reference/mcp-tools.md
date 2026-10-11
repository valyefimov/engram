# MCP-інструменти

Усі інструменти повертають Markdown — LLM читають його краще за JSON. Помилки приходять як tool errors зі зрозумілим повідомленням.

## Читання

### `engram_session_start`
Відкрити сесію під мету й отримати контекст-пакет.
`goal?` · `agent?` · `files?` · `budget?`

### `engram_context`
Брифінг під завдання в межах бюджету токенів: принципи, релевантні рішення, граблі, минула сесія.
`task?` · `files?` · `budget?` (200–20000)

### `engram_recall`
Повнотекстовий пошук із фільтрами.
`query?` · `kinds?` · `tags?` · `files?` · `include_inactive?` · `limit?` (≤ 50)

### `engram_get`
Один запис повністю, зі зв’язками. `id`

### `engram_related`
Обхід графа навколо запису в обидва боки. `id` · `depth?` (1–4) · `relations?`

### `engram_why`
Хронологія теми: рішення, що вони замінили, що відхилили й чому, пов’язані граблі. `topic`

### `engram_check`
Перевірити план на граблі й раніше відхилені підходи. `plan` · `files?`

### `engram_summary`
Огляд проєкту з пам’яті. `detail?`: `short` | `full`

## Запис

### `engram_remember`
Зберегти запис. Той самий вид + заголовок, що й в активного → оновлення.
`kind` · `title` · `content?` · `tags?` · `files?` · `importance?` (1–5) · `status?` · `supersedes?` · `links?: [{ to, relation, note? }]`

### `engram_update`
Змінити запис. `id` + будь-які з `title`, `content`, `kind`, `tags`, `files`, `importance`, `status`

### `engram_link`
Зв’язати два записи. `from` · `to` · `relation` · `note?`

### `engram_forget`
Архівувати (за замовчуванням) або видалити. `id` · `hard?`

### `engram_session_end`
Закрити сесію з підсумком. `summary` · `session_id?` · `tags?`

### `engram_index`
Перезапустити індексатор ADR і git.

## Ресурси

- `engram://summary` — огляд проєкту
- `engram://memory/{id}` — один запис (список доступний)

## Prompts

Кожен вбудований [skill](./skills) також доступний як MCP prompt з необов’язковим аргументом `input`.
