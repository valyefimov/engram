# Team memory

## The model

- `.engram/memories.jsonl` — **source of truth**. One JSON record per line, sorted by id: memories, links, sessions and tombstones. Commit it.
- `.engram/engram.db` — a **local SQLite index** rebuilt from the JSONL. Git-ignored.

Every write is mirrored to the JSONL file (atomically: write-then-rename). Every time engram opens, it hashes the JSONL; if the file changed since engram last wrote it — `git pull`, a merge, a manual edit — the records are merged into the local index.

## Merge rules

- **Memories:** last writer wins, by `updatedAt`.
- **Tombstones** (hard deletes) win over the memory they point at.
- **Links and sessions:** union.
- **Unresolved git conflict markers** in the JSONL are tolerated: both sides are merged, and the file is rewritten cleanly.

Because the file is sorted by id and ids are random, two people adding memories rarely touch neighboring lines — most merges are conflict-free.

## Reviewing what the agent learned

Memory is code-reviewable. A pull request diff shows exactly which decisions and pitfalls were added. For a readable dump:

```bash
engram export --format md -o docs/MEMORY.md
```

## Onboarding

A new developer — or a new agent — can ask:

> Explain the architecture of auth.

and get the recorded history of decisions instead of a guess. `engram summary --full` gives the whole picture.

## Privacy

Memory is written for teammates. The server instructions tell agents not to store secrets, credentials or personal data — but review `memories.jsonl` like any other committed file. To keep memory private to your machine, add `.engram/memories.jsonl` to `.gitignore` or set `"sync": { "jsonl": false }`.
