# Concepts

## Memories

A memory is a small, self-contained record written for a future reader with no context.

| Field | Meaning |
| --- | --- |
| `id` | Short and readable: `dec_k3x9q2mf`, `pit_…`, `pri_…` |
| `kind` | What it is (see below) |
| `title` | A specific, searchable headline — the decision itself, not the topic |
| `content` | Details and, above all, the **reasoning** |
| `tags` | Lowercase topics: `auth`, `db`, `payments` |
| `files` | Repo-relative paths it is about — used for file-aware recall |
| `status` | `active`, `superseded`, `rejected` or `archived` |
| `importance` | 1 (trivia) … 5 (load-bearing) — drives ranking and compression |
| `source` | `agent`, `user`, `adr:docs/adr/0003.md`, `git:…` |

### Kinds

| Kind | Use it for |
| --- | --- |
| `decision` | An architectural or product choice — or an option you turned down (`status: rejected`) |
| `pitfall` | Something that bit you: what happened, why, how to avoid it |
| `principle` | A rule every change must respect |
| `fact` | A plain fact: "prod DB is Postgres 16" |
| `discussion` | The gist of a debate: options, arguments, outcome |
| `note` | Anything else worth keeping |
| `file` | What a module is for, when that is not obvious from the code |
| `session` | A summary written at the end of a working session |

### Dedup on write

Agents like to "remember" the same thing twice. Remembering a memory with the same kind and title as an active one **updates** it instead (tags and files are merged, importance takes the max).

## Statuses and history

engram never overwrites history when you change your mind:

- **superseded** — replaced by a newer memory. `supersede(old, new)` marks the old one and adds a `new —supersedes→ old` edge.
- **rejected** — an option you considered and turned down. Keeping these is what makes "why don't we use X?" answerable.
- **archived** — soft-deleted: hidden from recall, kept for history. A hard delete leaves a tombstone so it propagates to teammates.

Recall shows only `active` memories by default; `include_inactive` (or `--all`) shows everything.

## The knowledge graph

Memories are connected by typed, directed edges:

| Relation | Reads as |
| --- | --- |
| `relates_to` | generic association |
| `depends_on` | *from* only holds while *to* holds |
| `implements` | *from* implements decision / principle *to* |
| `supersedes` | *from* replaced *to* |
| `rejected_because` | option *from* was rejected because of *to* |
| `caused_by` | pitfall *from* was caused by *to* |
| `part_of` | *from* is part of a larger topic *to* |

`engram_why` walks `supersedes`, `rejected_because` and `caused_by` to turn scattered memories into a timeline. `engram_related` walks any edges, in both directions.

## Sessions

`engram_session_start` opens a session for a goal and returns a context pack. `engram_session_end` stores a handoff summary — **done / decided / open / next** — as a searchable `session` memory. The next session's context pack starts with it.

## The context pack

The context compressor builds a briefing for a task within a token budget (default 2000):

1. **Principles**, **pitfalls relevant to the task**, **relevant memories**, **key decisions** are gathered and prioritized.
2. The highest-priority items are rendered **in full**.
3. The next tier is **compressed to one line** each (id + title + tags).
4. The rest is **dropped** — and the pack says how many, so the agent knows to `recall` for more.

## Search

Full-text search uses SQLite FTS5 with BM25 ranking (title ≫ tags > content > files), Porter stemming and Unicode tokenization — it works in English, Russian, Ukrainian and other languages. Scores are then boosted by kind, importance, status and recency. Queries are tolerant: terms are OR-ed and longer terms are prefix-matched, so "auth" finds "authentication".
