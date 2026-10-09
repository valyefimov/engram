import { defineConfig, type DefaultTheme } from 'vitepress';

const base = '/engram/';
const repo = 'https://github.com/valyefimov/engram';

type Strings = {
  guide: string;
  reference: string;
  intro: string;
  start: string;
  concepts: string;
  agents: string;
  team: string;
  how: string;
  tools: string;
  cli: string;
  skills: string;
  api: string;
  roadmap: string;
  edit: string;
};

function sidebar(prefix: string, t: Strings): DefaultTheme.Sidebar {
  return [
    {
      text: t.guide,
      items: [
        { text: t.intro, link: `${prefix}/guide/what-is-engram` },
        { text: t.start, link: `${prefix}/guide/getting-started` },
        { text: t.concepts, link: `${prefix}/guide/concepts` },
        { text: t.agents, link: `${prefix}/guide/agents` },
        { text: t.team, link: `${prefix}/guide/team` },
        { text: t.how, link: `${prefix}/guide/how-it-works` },
      ],
    },
    {
      text: t.reference,
      items: [
        { text: t.tools, link: `${prefix}/reference/mcp-tools` },
        { text: t.cli, link: `${prefix}/reference/cli` },
        { text: t.skills, link: `${prefix}/reference/skills` },
        { text: t.api, link: `${prefix}/reference/api` },
      ],
    },
    { text: t.roadmap, link: `${prefix}/roadmap` },
  ];
}

function themeFor(prefix: string, t: Strings): DefaultTheme.Config {
  return {
    nav: [
      { text: t.guide, link: `${prefix}/guide/getting-started` },
      { text: t.reference, link: `${prefix}/reference/mcp-tools` },
      { text: t.roadmap, link: `${prefix}/roadmap` },
      { text: 'v0.1.0', items: [{ text: 'Changelog', link: `${repo}/blob/main/CHANGELOG.md` }] },
    ],
    sidebar: sidebar(prefix, t),
    editLink: { pattern: `${repo}/edit/main/docs/:path`, text: t.edit },
  };
}

const en: Strings = {
  guide: 'Guide',
  reference: 'Reference',
  intro: 'What is engram?',
  start: 'Getting started',
  concepts: 'Concepts',
  agents: 'Agents & editors',
  team: 'Team memory',
  how: 'How it works',
  tools: 'MCP tools',
  cli: 'CLI',
  skills: 'Skills',
  api: 'Programmatic API',
  roadmap: 'Roadmap',
  edit: 'Edit this page on GitHub',
};

const ru: Strings = {
  guide: 'Руководство',
  reference: 'Справочник',
  intro: 'Что такое engram?',
  start: 'Быстрый старт',
  concepts: 'Основные понятия',
  agents: 'Агенты и редакторы',
  team: 'Командная память',
  how: 'Как это работает',
  tools: 'MCP-инструменты',
  cli: 'CLI',
  skills: 'Skills',
  api: 'Программный API',
  roadmap: 'Дорожная карта',
  edit: 'Редактировать на GitHub',
};

const uk: Strings = {
  guide: 'Посібник',
  reference: 'Довідник',
  intro: 'Що таке engram?',
  start: 'Швидкий старт',
  concepts: 'Основні поняття',
  agents: 'Агенти та редактори',
  team: 'Командна пам’ять',
  how: 'Як це працює',
  tools: 'MCP-інструменти',
  cli: 'CLI',
  skills: 'Skills',
  api: 'Програмний API',
  roadmap: 'Дорожня карта',
  edit: 'Редагувати на GitHub',
};

export default defineConfig({
  base,
  cleanUrls: true,
  lastUpdated: true,
  title: 'engram',
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}logo.svg` }],
    ['meta', { name: 'theme-color', content: '#8b5cf6' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'engram — a second brain for AI coding agents' }],
    ['meta', { property: 'og:image', content: `https://valyefimov.github.io${base}og.png` }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
  ],
  locales: {
    root: {
      label: 'English',
      lang: 'en',
      description: 'Long-term, structured, queryable project memory for AI coding agents — over MCP.',
      themeConfig: themeFor('', en),
    },
    ru: {
      label: 'Русский',
      lang: 'ru',
      description: 'Долговременная структурированная память проекта для AI-агентов — через MCP.',
      themeConfig: {
        ...themeFor('/ru', ru),
        outline: { label: 'На этой странице' },
        docFooter: { prev: 'Назад', next: 'Далее' },
        lastUpdated: { text: 'Обновлено' },
        darkModeSwitchLabel: 'Тема',
        sidebarMenuLabel: 'Меню',
        returnToTopLabel: 'Наверх',
        langMenuLabel: 'Язык',
      },
    },
    uk: {
      label: 'Українська',
      lang: 'uk',
      description: 'Довготривала структурована пам’ять проєкту для AI-агентів — через MCP.',
      themeConfig: {
        ...themeFor('/uk', uk),
        outline: { label: 'На цій сторінці' },
        docFooter: { prev: 'Назад', next: 'Далі' },
        lastUpdated: { text: 'Оновлено' },
        darkModeSwitchLabel: 'Тема',
        sidebarMenuLabel: 'Меню',
        returnToTopLabel: 'Нагору',
        langMenuLabel: 'Мова',
      },
    },
  },
  themeConfig: {
    logo: '/logo.svg',
    socialLinks: [
      { icon: 'github', link: repo },
      { icon: 'npm', link: 'https://www.npmjs.com/package/@vefimov/engram' },
    ],
    search: { provider: 'local' },
    footer: {
      message: 'Released under the MIT License.',
      copyright: '© 2026 Valentyn Yefimov',
    },
  },
});
