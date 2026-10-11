---
layout: home

hero:
  name: engram
  text: Другий мозок для вашого AI-агента
  tagline: Довготривала структурована пам’ять проєкту — рішення, граблі, принципи та минулі сесії — для Claude Code, Cursor і будь-якого MCP-клієнта. Локально. Поширюється через git.
  image:
    src: /logo.svg
    alt: engram
  actions:
    - theme: brand
      text: Швидкий старт
      link: /uk/guide/getting-started
    - theme: alt
      text: Навіщо engram?
      link: /uk/guide/what-is-engram
    - theme: alt
      text: GitHub
      link: https://github.com/valyefimov/engram

features:
  - icon: 🧠
    title: Пам’ятає «чому»
    details: Рішення разом з аргументами, відхилені варіанти й що що замінило. «Чому ми не використовуємо Redis?» отримує справжню відповідь, а не галюцинацію.
  - icon: 🕸️
    title: Граф знань, а не лог
    details: Типізовані зв’язки — supersedes, rejected_because, caused_by, depends_on — агент може пройти від рішення до шраму, який до нього призвів.
  - icon: 🪤
    title: Не наступає на ті самі граблі
    details: engram_check звіряє план із записаними граблями та раніше відхиленими підходами — ще до того, як агент почне писати код.
  - icon: 🗜️
    title: Стиснення контексту
    details: Брифінги в межах бюджету токенів — важливе повністю, решта в один рядок, усе інше — на відстані одного recall.
  - icon: 🔌
    title: Працює з будь-яким агентом
    details: Стандартний MCP-сервер і готові skills. Claude Code, Cursor, Windsurf, Zed, Codex — одна пам’ять для всіх.
  - icon: 🏠
    title: Локально, через git
    details: SQLite + FTS5 на вашій машині, без нативних залежностей. Відсортований memories.jsonl комітиться — пам’ять команди живе поруч із кодом.
---

<div class="home-section">

## Подивіться в дії

Хвилина, справжній вивід, без монтажу.

<video controls preload="metadata" poster="/demo-poster.png" style="width:100%;border-radius:12px;box-shadow:0 20px 60px -20px rgba(124,58,237,.45)">
  <source src="/demo.uk.mp4" type="video/mp4">
</video>


## Пам’ять за тридцять секунд

<pre class="terminal"><span class="p">$</span> npx @vefimov/engram init
<span class="g">✔</span> Created .engram/ in ~/code/shop
<span class="g">✔</span> Claude Code: .mcp.json, CLAUDE.md, <span class="d">6 skills</span>
<span class="g">✔</span> Indexed in 84 ms — 12 ADRs, 500 commits, 7 hotspots, 3 possible pitfalls
<span></span>
<span class="p">$</span> engram why сесії
<span class="y">↩️</span> 2026-03-02 — Зберігати сесії в Redis <span class="d">(superseded)</span>
     Швидко, TTL з коробки.
     <span class="c">caused_by →</span> Failover Redis розлогінив усіх користувачів
<span class="g">✅</span> 2026-05-19 — Сесії в Postgres
     На одну рухому частину менше.
<span class="r">❌</span> 2026-05-19 — Сесії в MongoDB <span class="d">(rejected)</span>
     <span class="c">rejected_because →</span> немає транзакцій з таблицею замовлень</pre>

Потім скажіть агенту **«використовуй engram»**. Відтепер він починає кожне завдання з релевантної пам’яті, перевіряє плани на старі помилки, сам записує рішення й залишає нотатку для наступної сесії.

</div>
