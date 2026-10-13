# MCP-інструменти

Усі інструменти повертають Markdown, бо моделі читають його краще, ніж JSON. Помилки приходять як tool errors зі зрозумілим повідомленням.

## Читання

### `engram_session_start`
Відкриває сесію під мету й повертає контекст-пакет.
`goal?` · `agent?` · `files?` · `budget?`

### `engram_context`
Брифінг під завдання в межах бюджету токенів: принципи, відповідні рішення, граблі, минула сесія.
`task?` · `files?` · `budget?` (від 200 до 20000)

### `engram_recall`
Повнотекстовий пошук із фільтрами.
`query?` · `kinds?` · `tags?` · `files?` · `include_inactive?` · `limit?` (до 50)

### `engram_get`
Один запис повністю, зі зв’язками. `id`

### `engram_related`
Обходить граф навколо запису в обидва боки. `id` · `depth?` (від 1 до 4) · `relations?`

### `engram_why`
Хронологія теми: рішення, що вони замінили, що відхилили й чому, пов’язані граблі. `topic`

### `engram_check`
Перевіряє план на граблі й раніше відхилені підходи. `plan` · `files?`

### `engram_summary`
Огляд проєкту з пам’яті. `detail?`: `short` або `full`

## Запис

### `engram_remember`
Зберігає запис. Якщо активний запис з тим самим видом і заголовком уже є, він оновлюється.
`kind` · `title` · `content?` · `tags?` · `files?` · `importance?` (від 1 до 5) · `status?` · `supersedes?` · `links?: [{ to, relation, note? }]`

### `engram_update`
Редагує запис. `id` і будь-які з `title`, `content`, `kind`, `tags`, `files`, `importance`, `status`

### `engram_link`
Зв’язує два записи. `from` · `to` · `relation` · `note?`

### `engram_forget`
Архівує запис або видаляє його з `hard`. `id` · `hard?`

### `engram_session_end`
Закриває сесію з підсумком. `summary` · `session_id?` · `tags?`

### `engram_index`
Знову запускає індексатор ADR і git.

## Ресурси

- `engram://summary`: огляд проєкту
- `engram://memory/{id}`: один запис (список можна переглядати)

## Prompts

Кожен вбудований [skill](./skills) доступний і як MCP prompt з необов’язковим аргументом `input`.
