# MCP tools

Every tool returns Markdown, which models read better than JSON. Errors come back as tool errors with a readable message.

## Reading

### `engram_session_start`
Opens a session for a goal and returns the context pack.
`goal?` · `agent?` · `files?` · `budget?`

### `engram_context`
A briefing for a task within a token budget: principles, relevant decisions, pitfalls, the last session.
`task?` · `files?` · `budget?` (200 to 20000)

### `engram_recall`
Full-text search with filters.
`query?` · `kinds?` · `tags?` · `files?` · `include_inactive?` · `limit?` (up to 50)

### `engram_get`
One memory in full, with its links. `id`

### `engram_related`
Walks the graph around a memory in both directions. `id` · `depth?` (1 to 4) · `relations?`

### `engram_why`
A timeline for a topic: decisions, what they replaced, what was rejected and why, related pitfalls. `topic`

### `engram_check`
Checks a plan against pitfalls and previously rejected approaches. `plan` · `files?`

### `engram_summary`
A project overview from memory. `detail?`: `short` or `full`

## Writing

### `engram_remember`
Stores a memory. If an active memory has the same kind and title, it is updated instead.
`kind` · `title` · `content?` · `tags?` · `files?` · `importance?` (1 to 5) · `status?` · `supersedes?` · `links?: [{ to, relation, note? }]`

### `engram_update`
Edits a memory. `id` plus any of `title`, `content`, `kind`, `tags`, `files`, `importance`, `status`

### `engram_link`
Connects two memories. `from` · `to` · `relation` · `note?`

### `engram_forget`
Archives a memory, or deletes it with `hard`. `id` · `hard?`

### `engram_session_end`
Closes the session with a handoff summary. `summary` · `session_id?` · `tags?`

### `engram_index`
Runs the ADR and git indexer again.

## Resources

- `engram://summary`: the project summary
- `engram://memory/{id}`: a single memory (the list is browsable)

## Prompts

Each bundled [skill](./skills) is also an MCP prompt, with an optional `input` argument.
