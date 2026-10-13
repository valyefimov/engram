# CLI

```
engram <command> [options]
```

| Command | What it does |
| --- | --- |
| `init` | Sets up `.engram/`, connects agents, installs skills, indexes the repo |
| `serve` (`mcp`) | Runs the MCP server over stdio |
| `status` | Counts by kind and status, last activity |
| `summary [--full]` | Project overview |
| `context [task…]` | Prints the context pack an agent would get (`-b` budget, `-f` files, `--raw`) |
| `remember <title>` (`add`) | Stores a memory (`-k` kind, `-c` content, `-t` tags, `-f` files, `-i` importance, `-s` status, `--supersedes id`) |
| `recall [query…]` (`search`) | Searches (`-k` kinds, `-t` tags, `-f` files, `-a` include inactive, `-n` limit, `--json`) |
| `show <id>` (`get`) | One memory with its links (`--json`) |
| `link <from> <relation> <to>` | Connects memories (`-n` note) |
| `graph <id>` | Shows the neighborhood in the graph (`-d` depth) |
| `why <topic…>` | History of a topic |
| `check <plan…>` | Checks a plan against pitfalls (`-f` files) |
| `forget <id>` | Archives, or deletes with `--hard` |
| `index` | Imports ADRs and git signals (`--no-adr`, `--no-git`) |
| `export` | `--format jsonl` or `md`, `-o file` |
| `import <file>` | Merges a JSONL export |
| `sync` | Re-reads and cleanly rewrites `memories.jsonl` |
| `skills list` | Lists the bundled skills |
| `skills install` | Copies skills into `.claude/skills` (`--global`, `--dir`) |

## `init` options

| Option | |
| --- | --- |
| `-a, --agent <list>` | `claude`, `cursor`, `agents-md`, `all`. The default is to detect them. |
| `-p, --project <name>` | Project name used in summaries |
| `--no-skills` | Don't install skills |
| `--no-index` | Don't scan ADRs and git history |

## Environment

| Variable | |
| --- | --- |
| `ENGRAM_ROOT` | Forces the project root |
