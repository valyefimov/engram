# What is engram?

A coding agent forgets everything when a session ends. The next one reads the same files again, suggests the approach you dropped last month, and can bring back a bug you fixed twice. Long conversations get compacted, and the details that matter tend to go first.

engram is a memory for the agent. It stores what a teammate would remember about the project and skips what the code already says:

- decisions and their reasoning, including options you rejected and why;
- pitfalls: mistakes you already paid for, and how to avoid them;
- principles, the rules of the codebase ("no ORMs in the hot path");
- sessions: where the last piece of work stopped and what comes next;
- facts, notes and discussions worth keeping.

These memories are linked into a graph (`supersedes`, `rejected_because`, `caused_by`, `depends_on` and so on), searchable in any language, and served to agents through the [Model Context Protocol](https://modelcontextprotocol.io).

## How you use it

1. Run `npx @vefimov/engram init` once in your repo.
2. Tell the agent: "use engram".
3. From then on the agent should:
   - begin a task with a short briefing: principles, relevant decisions, known pitfalls, where you left off;
   - bring up earlier decisions when they matter ("three weeks ago we decided against Redis because of X");
   - check its plan against old pitfalls before writing code;
   - record new decisions and pitfalls as they come up;
   - answer "where did we discuss auth?" from the record, even if that was forty conversations ago.

## How it compares

| Existing approach | Where it falls short | engram |
| --- | --- | --- |
| Simple memory plugins | A flat list of notes | A graph with history: superseded and rejected memories are kept |
| An assistant's built-in memory | Tied to one tool and one user | Local, an open file format, any MCP client |
| Per-session memory tools | Lost when you switch tools | One store for every client in the project |
| ADRs written by hand | People forget to write them | The agent writes them as you work, and engram imports the ones you already have |
| One large `CLAUDE.md` | Always loaded, goes stale, has no history | Retrieved on demand within a token budget |

## Design choices

- The memory lives in `.engram/` in your repo. There is no server, no account and no telemetry.
- The source of truth is a sorted JSONL file you can read, diff, review and commit.
- It uses Node's built-in `node:sqlite` with FTS5, so there is nothing to compile and `npx` works.
- The server speaks standard MCP. Skills and prompts teach an agent when to read and write.
- Changing your mind supersedes a decision. The old one stays in the history.

Next: [getting started](./getting-started).
