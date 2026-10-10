# CLI

```
engram <command> [options]
```

| Command | What it does |
| --- | --- |
| `init` | Set up `.engram/`, connect agents, install skills, index the repo |
| `serve` (`mcp`) | Run the MCP server over stdio |
| `status` | Counts by kind and status, last activity |
| `summary [--full]` | Project overview |
| `context [task…]` | Print the context pack an agent would get (`-b` budget, `-f` files, `--raw`) |
| `remember <title>` (`add`) | Store a memory (`-k` kind, `-c` content, `-t` tags, `-f` files, `-i` importance, `-s` status, `--supersedes id`) |
| `recall [query…]` (`search`) | Search (`-k` kinds, `-t` tags, `-f` files, `-a` include inactive, `-n` limit, `--json`) |
| `show <id>` (`get`) | One memory with links (`--json`) |
| `link <from> <relation> <to>` | Connect memories (`-n` note) |
| `graph <id>` | Neighbourhood in the graph (`-d` depth) |
| `why <topic…>` | History of a topic |
| `check <plan…>` | Check a plan against pitfalls (`-f` files) |
| `forget <id>` | Archive, or `--hard` delete |
| `index` | Import ADRs and git signals (`--no-adr`, `--no-git`) |
| `export` | `--format jsonl|md`, `-o file` |
| `import <file>` | Merge a JSONL export |
| `sync` | Re-read and cleanly rewrite `memories.jsonl` |
| `skills list` | Bundled skills |
| `skills install` | Copy skills to `.claude/skills` (`--global`, `--dir`) |

## `init` options

| Option | |
| --- | --- |
| `-a, --agent <list>` | `claude`, `cursor`, `agents-md`, `all` (default: auto-detect) |
| `-p, --project <name>` | Project name for summaries |
| `--no-skills` | Do not install skills |
| `--no-index` | Do not scan ADRs and git history |

## Environment

| Variable | |
| --- | --- |
| `ENGRAM_ROOT` | Force the project root |
