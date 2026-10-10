# MCP tools

All tools return Markdown — LLMs read it better than JSON. Errors come back as tool errors with a readable message.

## Reading

### `engram_session_start`
Open a session for a goal and get the context pack.
`goal?` · `agent?` · `files?` · `budget?`

### `engram_context`
Token-budgeted briefing for a task: principles, relevant decisions, pitfalls, last session.
`task?` · `files?` · `budget?` (200–20000)

### `engram_recall`
Full-text search with filters.
`query?` · `kinds?` · `tags?` · `files?` · `include_inactive?` · `limit?` (≤ 50)

### `engram_get`
One memory in full, with its links. `id`

### `engram_related`
Walk the graph around a memory, both directions. `id` · `depth?` (1–4) · `relations?`

### `engram_why`
Timeline of a topic: decisions, what they replaced, what was rejected and why, related pitfalls. `topic`

### `engram_check`
Check a plan against pitfalls and previously rejected approaches. `plan` · `files?`

### `engram_summary`
Project overview from memory. `detail?`: `short` | `full`

## Writing

### `engram_remember`
Store a memory. Same kind + title as an active memory → updates it.
`kind` · `title` · `content?` · `tags?` · `files?` · `importance?` (1–5) · `status?` · `supersedes?` · `links?: [{ to, relation, note? }]`

### `engram_update`
Edit a memory. `id` + any of `title`, `content`, `kind`, `tags`, `files`, `importance`, `status`

### `engram_link`
Connect two memories. `from` · `to` · `relation` · `note?`

### `engram_forget`
Archive (default) or hard-delete. `id` · `hard?`

### `engram_session_end`
Close the session with a handoff summary. `summary` · `session_id?` · `tags?`

### `engram_index`
Re-run the ADR and git indexer.

## Resources

- `engram://summary` — the project summary
- `engram://memory/{id}` — a single memory (listable)

## Prompts

Every bundled [skill](./skills) is also exposed as an MCP prompt with an optional `input` argument.
