# Programmatic API

Everything the CLI and the MCP server do is available as a library.

```ts
import { Engram, buildContext, why, checkPitfalls } from '@vefimov/engram';

const engram = Engram.open({ root: '/path/to/repo' });

const { memory } = engram.remember({
  kind: 'decision',
  title: 'Keep sessions in Postgres',
  content: 'Redis failover logged everyone out; one less moving part.',
  tags: ['auth', 'sessions'],
  importance: 4,
});

const hits = engram.search({ query: 'session storage', includeInactive: true });
const story = why(engram, 'sessions');
const warnings = checkPitfalls(engram, 'move sessions to MongoDB');
const pack = buildContext(engram, { task: 'refactor login', budget: 1500 });

engram.close();
```

## `Engram`

| Method | |
| --- | --- |
| `Engram.open({ root?, create?, dbFile? })` | Open (and create) the store |
| `remember(input)` | → `{ memory, created }` |
| `get(id)` / `require(id)` | |
| `update(id, patch)` | |
| `supersede(oldId, input, note?)` | |
| `forget(id, { hard? })` | |
| `search(options)` | → `SearchHit[]` |
| `list(options)` / `all()` | |
| `link(from, to, relation, note?)` / `unlink` / `links(id)` | |
| `startSession` / `endSession` / `recentSessions` | |
| `stats()` | |
| `batch(fn)` | Many writes, one JSONL flush |

## Embedding the MCP server

```ts
import { Engram, createServer } from '@vefimov/engram';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

const server = createServer(Engram.open());
await server.connect(new StreamableHTTPServerTransport({ sessionIdGenerator: undefined }));
```
