---
layout: home

hero:
  name: engram
  text: A second brain for your coding agent
  tagline: Long-term, structured, queryable project memory — decisions, pitfalls, principles and past sessions — for Claude Code, Cursor and any MCP client. Local-first. Shared through git.
  image:
    src: /logo.svg
    alt: engram
  actions:
    - theme: brand
      text: Get started
      link: /guide/getting-started
    - theme: alt
      text: Why engram?
      link: /guide/what-is-engram
    - theme: alt
      text: GitHub
      link: https://github.com/valyefimov/engram

features:
  - icon: 🧠
    title: Remembers the why
    details: Decisions with their reasoning, rejected options and what replaced what. "Why don't we use Redis?" gets a real answer, not a hallucination.
  - icon: 🕸️
    title: A knowledge graph, not a log
    details: Typed links — supersedes, rejected_because, caused_by, depends_on — so the agent can walk from a decision to the scar that caused it.
  - icon: 🪤
    title: Doesn't step on the same rake twice
    details: engram_check compares a plan against recorded pitfalls and previously rejected approaches before the agent writes code.
  - icon: 🗜️
    title: Context compressor
    details: Token-budgeted briefings — the important stuff in full, the rest squeezed to one line, the remainder one recall away.
  - icon: 🔌
    title: Works with any agent
    details: A standard MCP server plus ready-made skills. Claude Code, Cursor, Windsurf, Zed, Codex — one memory for all of them.
  - icon: 🏠
    title: Local-first, git-shared
    details: SQLite + FTS5 on your machine, zero native deps. A sorted memories.jsonl you commit — your team's memory travels with the code.
---

<div class="home-section">

## See it in action

One minute, real output, no edits.

<video controls preload="metadata" poster="/demo-poster.png" style="width:100%;border-radius:12px;box-shadow:0 20px 60px -20px rgba(124,58,237,.45)">
  <source src="/demo.mp4" type="video/mp4">
</video>


## Thirty seconds to a memory

<pre class="terminal"><span class="p">$</span> npx @vefimov/engram init
<span class="g">✔</span> Created .engram/ in ~/code/shop
<span class="g">✔</span> Claude Code: .mcp.json, CLAUDE.md, <span class="d">6 skills</span>
<span class="g">✔</span> Indexed in 84 ms — 12 ADRs, 500 commits, 7 hotspots, 3 possible pitfalls
<span></span>
<span class="p">$</span> engram why sessions
<span class="y">↩️</span> 2026-03-02 — Cache sessions in Redis <span class="d">(superseded)</span>
     Fast, TTL out of the box.
     <span class="c">caused_by →</span> Redis failover logged everyone out
<span class="g">✅</span> 2026-05-19 — Keep sessions in Postgres
     One less moving part; failover is the DB's problem now.
<span class="r">❌</span> 2026-05-19 — Store sessions in MongoDB <span class="d">(rejected)</span>
     <span class="c">rejected_because →</span> no transactions with the orders table</pre>

Then tell your agent **"use engram"**. From that moment it opens each task with the relevant memory, checks plans against old mistakes, records decisions as they happen, and leaves a handoff note for the next session.

</div>
