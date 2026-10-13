# Програмний API

CLI і MCP-сервер зроблено як тонкі шари над бібліотекою, і нею можна користуватися напряму.

```ts
import { Engram, buildContext, why, checkPitfalls } from '@vefimov/engram';

const engram = Engram.open({ root: '/path/to/repo' });

const { memory } = engram.remember({
  kind: 'decision',
  title: 'Сесії в Postgres',
  content: 'Failover Redis розлогінив усіх, а Postgres означає на одну рухому частину менше.',
  tags: ['auth', 'sessions'],
  importance: 4,
});

const hits = engram.search({ query: 'зберігання сесій', includeInactive: true });
const story = why(engram, 'сесії');
const warnings = checkPitfalls(engram, 'перенести сесії в MongoDB');
const pack = buildContext(engram, { task: 'рефакторинг логіну', budget: 1500 });

engram.close();
```

## `Engram`

| Метод | |
| --- | --- |
| `Engram.open({ root?, create?, dbFile? })` | Відкриває сховище, за потреби створює |
| `remember(input)` | Повертає `{ memory, created }` |
| `get(id)` / `require(id)` | |
| `update(id, patch)` | |
| `supersede(oldId, input, note?)` | |
| `forget(id, { hard? })` | |
| `search(options)` | Повертає `SearchHit[]` |
| `list(options)` / `all()` | |
| `link(from, to, relation, note?)` / `unlink` / `links(id)` | |
| `startSession` / `endSession` / `recentSessions` | |
| `stats()` | |
| `batch(fn)` | Багато записів, один запис у JSONL |

## Вбудовування MCP-сервера

```ts
import { Engram, createServer } from '@vefimov/engram';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

const server = createServer(Engram.open());
await server.connect(new StreamableHTTPServerTransport({ sessionIdGenerator: undefined }));
```
