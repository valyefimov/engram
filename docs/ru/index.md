---
layout: home

hero:
  name: engram
  text: Второй мозг для вашего AI-агента
  tagline: Долговременная структурированная память проекта — решения, грабли, принципы и прошлые сессии — для Claude Code, Cursor и любого MCP-клиента. Локально. Шарится через git.
  image:
    src: /logo.svg
    alt: engram
  actions:
    - theme: brand
      text: Быстрый старт
      link: /ru/guide/getting-started
    - theme: alt
      text: Зачем engram?
      link: /ru/guide/what-is-engram
    - theme: alt
      text: GitHub
      link: https://github.com/valyefimov/engram

features:
  - icon: 🧠
    title: Помнит «почему»
    details: Решения вместе с аргументами, отвергнутые варианты и что что заменило. «Почему мы не используем Redis?» получает реальный ответ, а не галлюцинацию.
  - icon: 🕸️
    title: Граф знаний, а не лог
    details: Типизированные связи — supersedes, rejected_because, caused_by, depends_on — агент может пройти от решения к шраму, который к нему привёл.
  - icon: 🪤
    title: Не наступает на те же грабли
    details: engram_check сверяет план с записанными граблями и ранее отвергнутыми подходами — до того, как агент начнёт писать код.
  - icon: 🗜️
    title: Сжатие контекста
    details: Брифинги в рамках бюджета токенов — важное целиком, остальное в одну строку, всё прочее — на расстоянии одного recall.
  - icon: 🔌
    title: Работает с любым агентом
    details: Стандартный MCP-сервер и готовые skills. Claude Code, Cursor, Windsurf, Zed, Codex — одна память на всех.
  - icon: 🏠
    title: Локально, шарится через git
    details: SQLite + FTS5 на вашей машине, без нативных зависимостей. Отсортированный memories.jsonl коммитится — память команды живёт рядом с кодом.
---

<div class="home-section">

## Посмотрите в деле

Минута, настоящий вывод, без монтажа.

<video controls preload="metadata" poster="/demo-poster.png" style="width:100%;border-radius:12px;box-shadow:0 20px 60px -20px rgba(124,58,237,.45)">
  <source src="/demo.ru.mp4" type="video/mp4">
</video>


## Память за тридцать секунд

<pre class="terminal"><span class="p">$</span> npx @vefimov/engram init
<span class="g">✔</span> Created .engram/ in ~/code/shop
<span class="g">✔</span> Claude Code: .mcp.json, CLAUDE.md, <span class="d">6 skills</span>
<span class="g">✔</span> Indexed in 84 ms — 12 ADRs, 500 commits, 7 hotspots, 3 possible pitfalls
<span></span>
<span class="p">$</span> engram why сессии
<span class="y">↩️</span> 2026-03-02 — Хранить сессии в Redis <span class="d">(superseded)</span>
     Быстро, TTL из коробки.
     <span class="c">caused_by →</span> Failover Redis разлогинил всех пользователей
<span class="g">✅</span> 2026-05-19 — Сессии в Postgres
     На одну движущуюся часть меньше.
<span class="r">❌</span> 2026-05-19 — Сессии в MongoDB <span class="d">(rejected)</span>
     <span class="c">rejected_because →</span> нет транзакций с таблицей заказов</pre>

Потом скажите агенту **«используй engram»**. С этого момента он начинает каждую задачу с релевантной памяти, проверяет планы на старые ошибки, сам записывает решения и оставляет заметку для следующей сессии.

</div>
