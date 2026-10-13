# Concepts

## Memories

A memory is a small note written for a future reader who has no context.

| Field | Meaning |
| --- | --- |
| `id` | Short and readable: `dec_k3x9q2mf`, `pit_…`, `pri_…` |
| `kind` | What it is, see below |
| `title` | A specific headline you can search for: the decision itself, not the topic |
| `content` | The details and, above all, the reasoning |
| `tags` | Lowercase topics such as `auth`, `db`, `payments` |
| `files` | Repo-relative paths it concerns, used for file-aware recall |
| `status` | `active`, `superseded`, `rejected` or `archived` |
| `importance` | 1 (trivia) to 5 (load-bearing); affects ranking and compression |
| `source` | `agent`, `user`, `adr:docs/adr/0003.md`, `git:…` |

### Kinds

| Kind | Use it for |
| --- | --- |
| `decision` | An architectural or product choice, or an option you turned down (`status: rejected`) |
| `pitfall` | Something that bit you: what happened, why, how to avoid it |
| `principle` | A rule every change should follow |
| `fact` | A plain fact, like "prod DB is Postgres 16" |
| `discussion` | The gist of a debate: options, arguments, outcome |
| `note` | Anything else worth keeping |
| `file` | What a module is for, when the code doesn't make it obvious |
| `session` | A summary written at the end of a working session |

### Duplicates

Agents tend to remember the same thing twice. If you store a memory with the same kind and title as an active one, engram updates the existing memory. Tags and files are merged, and the higher importance wins.

## Status and history

Changing your mind doesn't overwrite anything:

- `superseded`: replaced by a newer memory. `supersede(old, new)` marks the old one and adds a `new —supersedes→ old` edge.
- `rejected`: an option you considered and turned down. These make "why don't we use X?" answerable.
- `archived`: soft-deleted. It's hidden from recall but kept for history. A hard delete leaves a tombstone so the deletion reaches your teammates.

Recall returns only `active` memories by default. Pass `include_inactive` (or `--all` on the CLI) to see the rest.

## The graph

Memories are connected by directed, typed edges:

| Relation | Reads as |
| --- | --- |
| `relates_to` | a general association |
| `depends_on` | *from* only holds while *to* holds |
| `implements` | *from* implements the decision or principle *to* |
| `supersedes` | *from* replaced *to* |
| `rejected_because` | the option *from* was rejected because of *to* |
| `caused_by` | the pitfall *from* was caused by *to* |
| `part_of` | *from* belongs to the larger topic *to* |

`engram_why` follows `supersedes`, `rejected_because` and `caused_by` and turns the scattered memories into a timeline. `engram_related` follows any edge in both directions.

## Sessions

`engram_session_start` opens a session for a goal and returns a context pack. `engram_session_end` stores a handoff summary (done, decided, open, next) as a searchable `session` memory. The next session's context pack starts with it.

## The context pack

The context compressor builds a briefing for a task within a token budget, 2000 by default:

1. It gathers principles, pitfalls relevant to the task, relevant memories and key decisions, and ranks them.
2. The highest-ranked items are written in full.
3. The next tier is cut to one line each: id, title and tags.
4. The rest is left out. The pack says how many were dropped, so the agent knows it can call `recall` for more.

## Search

Full-text search uses SQLite FTS5 with BM25 ranking (title counts most, then tags, content and files), Porter stemming and Unicode tokenization, so it handles English, Russian, Ukrainian and other languages. The score is then adjusted by kind, importance, status and age. Queries are forgiving: terms are OR-ed together and longer terms match by prefix, so "auth" finds "authentication".
