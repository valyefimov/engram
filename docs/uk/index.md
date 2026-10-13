---
layout: home

hero:
  name: engram
  text: Довготривала пам’ять для AI-агентів
  tagline: Рішення, граблі, принципи та нотатки про сесії зберігаються у вашому репозиторії й доступні Claude Code, Cursor і будь-якому MCP-клієнту.
  image:
    src: /logo.svg
    alt: engram
  actions:
    - theme: brand
      text: Швидкий старт
      link: /uk/guide/getting-started
    - theme: alt
      text: Що таке engram?
      link: /uk/guide/what-is-engram
    - theme: alt
      text: GitHub
      link: https://github.com/valyefimov/engram

features:
  - title: Пам’ятає причини
    details: Рішення записується разом з аргументами, відхилені варіанти теж. Коли питають, чому не взяли Redis, відповідь береться із запису.
  - title: Записи пов’язані між собою
    details: Типізовані ребра, такі як supersedes, rejected_because і caused_by, дають агентові змогу пройти від рішення до проблеми, яка його спричинила.
  - title: Звіряє план зі старими помилками
    details: engram_check порівнює те, що агент збирається зробити, із записаними граблями й відхиленими підходами ще до написання коду.
  - title: Брифінг вкладається в бюджет токенів
    details: Важливі записи приходять повністю, наступні скорочуються до одного рядка, решта діставається через recall.
  - title: Будь-який MCP-клієнт
    details: Це звичайний MCP-сервер. init налаштовує Claude Code, Cursor і AGENTS.md, іншим клієнтам підійде той самий запис сервера.
  - title: Локально, а ділиться через git
    details: SQLite з повнотекстовим пошуком на вашій машині, без нативних залежностей. Відсортований memories.jsonl лежить у git поруч із кодом.
---

<div class="home-section">

## Подивіться в дії

Хвилина справжнього виводу. Озвучення синтезоване.

<video controls preload="metadata" poster="/demo-poster.png" style="width:100%;border-radius:12px;box-shadow:0 20px 60px -20px rgba(124,58,237,.45)">
  <source src="/demo.uk.mp4" type="video/mp4">
</video>

## Від встановлення до відповіді

Нижче приклад з `examples/adr-demo`: три ADR про те, де зберігати сесії.

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

Потім перезапустіть агента й скажіть йому «використовуй engram». Він отримує брифінг на початку кожного завдання, звіряє плани зі старими помилками, записує рішення по ходу справи й залишає нотатку для наступної сесії.

</div>
