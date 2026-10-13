# Programmatic API

The CLI and the MCP server are thin layers over a library, and you can use it directly.

```ts
import { Engram, buildContext, why, checkPitfalls } from '@vefimov/engram';

const engram = Engram.open({ root: '/path/to/repo' });

const { memory } = engram.remember({
  kind: 'decision',
  title: 'Keep sessions in Postgres',
  content: 'A Redis failover logged everyone out, and Postgres is one less moving part.',
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
| `Engram.open({ root?, create?, dbFile? })` | Opens the store, creating it if needed |
| `remember(input)` | Returns `{ memory, created }` |
| `get(id)` / `require(id)` | |
| `update(id, patch)` | |
| `supersede(oldId, input, note?)` | |
| `forget(id, { hard? })` | |
| `search(options)` | Returns `SearchHit[]` |
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
