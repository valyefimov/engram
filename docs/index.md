---
layout: home

hero:
  name: engram
  text: Long-term memory for coding agents
  tagline: Decisions, pitfalls, principles and session notes, stored in your repo and served to Claude Code, Cursor or any MCP client.
  image:
    src: /logo.svg
    alt: engram
  actions:
    - theme: brand
      text: Get started
      link: /guide/getting-started
    - theme: alt
      text: What is engram?
      link: /guide/what-is-engram
    - theme: alt
      text: GitHub
      link: https://github.com/valyefimov/engram

features:
  - title: It remembers the reasons
    details: A decision is stored with its reasoning, and so are the options you rejected. When someone asks why you don't use Redis, the answer comes from the record.
  - title: Memories are linked
    details: Typed edges such as supersedes, rejected_because and caused_by let the agent follow a decision back to the problem that caused it.
  - title: It checks plans against old mistakes
    details: engram_check compares what the agent is about to do with recorded pitfalls and rejected approaches, before any code is written.
  - title: Briefings fit a token budget
    details: Important memories come in full, the next tier is cut to one line, and the rest is a recall away.
  - title: Any MCP client
    details: It's a standard MCP server. init sets up Claude Code, Cursor and AGENTS.md; other clients take the same server entry.
  - title: Local, and shared through git
    details: SQLite with full-text search on your machine, no native dependencies. A sorted memories.jsonl goes into git next to the code.
---

<div class="home-section">

## See it in action

One minute of real output. The narration is synthetic.

<video controls preload="metadata" poster="/demo-poster.png" style="width:100%;border-radius:12px;box-shadow:0 20px 60px -20px rgba(124,58,237,.45)">
  <source src="/demo.mp4" type="video/mp4">
</video>

## From install to an answer

Below is the example project in `examples/adr-demo`, which has three ADRs about where to keep sessions.

<pre class="terminal"><span class="p">$</span> npx @vefimov/engram init
<span class="g">✔</span> Created .engram/ in ~/code/shop
<span class="g">✔</span> Claude Code: .mcp.json, CLAUDE.md, <span class="d">6 skills</span>
<span class="g">✔</span> Indexed in 66 ms — 3 ADRs, 1 commits, 0 hotspots, 0 possible pitfalls
<span class="d"></span>
<span class="p">$</span> engram why sessions
<span class="y">↩️</span> ADR-0001: Cache sessions in Redis <span class="d">(superseded)</span>
  Context: Login latency is dominated by the session lookup in Postgres.
  Decision: Store sessions in Redis with a 30-day TTL.
<span class="r">❌</span> ADR-0002: Store sessions in MongoDB <span class="d">(rejected)</span>
  Rejected: no transactions spanning sessions and the orders table.
<span class="g">✅</span> ADR-0003: Keep sessions in Postgres <span class="d">(active)</span>
  Sessions live in Postgres with an hourly cleanup job.
  <span class="c">dec_edkgurku —supersedes→ dec_40bmzazh</span></pre>

Then restart your agent and tell it "use engram". It gets a briefing at the start of each task, checks plans against old mistakes, records decisions as they happen, and leaves a note for the next session.

</div>
