---
layout: home

hero:
  name: engram
  text: Долговременная память для AI-агентов
  tagline: Решения, грабли, принципы и заметки о сессиях хранятся в вашем репозитории и доступны Claude Code, Cursor и любому MCP-клиенту.
  image:
    src: /logo.svg
    alt: engram
  actions:
    - theme: brand
      text: Быстрый старт
      link: /ru/guide/getting-started
    - theme: alt
      text: Что такое engram?
      link: /ru/guide/what-is-engram
    - theme: alt
      text: GitHub
      link: https://github.com/valyefimov/engram

features:
  - title: Помнит причины
    details: Решение записывается вместе с аргументами, отвергнутые варианты тоже. Когда спрашивают, почему не взяли Redis, ответ берётся из записи.
  - title: Записи связаны между собой
    details: Типизированные рёбра, такие как supersedes, rejected_because и caused_by, позволяют агенту пройти от решения к проблеме, которая его вызвала.
  - title: Сверяет план со старыми ошибками
    details: engram_check сравнивает то, что агент собирается сделать, с записанными граблями и отвергнутыми подходами ещё до написания кода.
  - title: Брифинг укладывается в бюджет токенов
    details: Важные записи приходят целиком, следующие урезаются до одной строки, остальное достаётся через recall.
  - title: Любой MCP-клиент
    details: Это обычный MCP-сервер. init настраивает Claude Code, Cursor и AGENTS.md, другим клиентам подходит та же запись сервера.
  - title: Локально, а делится через git
    details: SQLite с полнотекстовым поиском на вашей машине, без нативных зависимостей. Отсортированный memories.jsonl лежит в git рядом с кодом.
---

<div class="home-section">

## Посмотрите в деле

Минута настоящего вывода. Озвучка синтезированная.

<video controls preload="metadata" poster="/demo-poster.png" style="width:100%;border-radius:12px;box-shadow:0 20px 60px -20px rgba(124,58,237,.45)">
  <source src="/demo.ru.mp4" type="video/mp4">
</video>

## От установки до ответа

Ниже пример из `examples/adr-demo`: три ADR о том, где хранить сессии.

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

Затем перезапустите агента и скажите ему «используй engram». Он получает брифинг в начале каждой задачи, сверяет планы со старыми ошибками, записывает решения по ходу дела и оставляет заметку для следующей сессии.

</div>
