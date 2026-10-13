# Team memory

## How it's stored

- `.engram/memories.jsonl` is the source of truth. It has one JSON record per line, sorted by id: memories, links, sessions and tombstones. You commit it.
- `.engram/engram.db` is a local SQLite index built from the JSONL. It is git-ignored.

Every write is mirrored to the JSONL file, written to a temporary file and renamed so a crash can't leave half a file. Each time engram opens, it hashes the JSONL. If the file changed since engram last wrote it, because of a `git pull`, a merge or a manual edit, the records are merged into the local index.

## Merge rules

- Memories: the newest `updatedAt` wins.
- Tombstones (hard deletes) win over the memory they point at.
- Links and sessions are combined.
- Unresolved git conflict markers in the JSONL are tolerated. Both sides are merged and the file is rewritten cleanly.

The file is sorted by random ids, so two people adding memories rarely touch neighboring lines. Most merges go through without a conflict.

## Reviewing what the agent learned

Memory can be reviewed like code. A pull request diff shows which decisions and pitfalls were added. For something easier to read:

```bash
engram export --format md -o docs/MEMORY.md
```

## Onboarding

A new developer, or a new agent, can ask:

> Explain how authentication works here.

and get the recorded history of decisions instead of a guess. `engram summary --full` prints the whole picture.

## Privacy

Memory is written for your teammates. The server instructions tell agents not to store secrets, credentials or personal data, but review `memories.jsonl` as you would any committed file. To keep memory on your machine only, add `.engram/memories.jsonl` to `.gitignore`, or set `"sync": { "jsonl": false }`.
