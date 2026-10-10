# Программный API

Всё, что делают CLI и MCP-сервер, доступно как библиотека.

```ts
import { Engram, buildContext, why, checkPitfalls } from '@vefimov/engram';

const engram = Engram.open({ root: '/path/to/repo' });

const { memory } = engram.remember({
  kind: 'decision',
  title: 'Сессии в Postgres',
  content: 'Failover Redis разлогинил всех; на одну движущуюся часть меньше.',
  tags: ['auth', 'sessions'],
  importance: 4,
});

const hits = engram.search({ query: 'хранение сессий', includeInactive: true });
const story = why(engram, 'сессии');
const warnings = checkPitfalls(engram, 'перенести сессии в MongoDB');
const pack = buildContext(engram, { task: 'рефакторинг логина', budget: 1500 });

engram.close();
```

## `Engram`

| Метод | |
| --- | --- |
| `Engram.open({ root?, create?, dbFile? })` | Открыть (и создать) хранилище |
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
| `batch(fn)` | Много записей, одна запись в JSONL |

## Встраивание MCP-сервера

```ts
import { Engram, createServer } from '@vefimov/engram';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

const server = createServer(Engram.open());
await server.connect(new StreamableHTTPServerTransport({ sessionIdGenerator: undefined }));
```
