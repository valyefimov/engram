# Examples

## `adr-demo`

Three ADRs telling a small story: sessions moved from Redis to Postgres, MongoDB was rejected.

```bash
cd examples/adr-demo
git init -q && git add -A && git commit -qm "adrs"
npx @vefimov/engram init --no-skills --agent claude
npx @vefimov/engram why sessions
```
