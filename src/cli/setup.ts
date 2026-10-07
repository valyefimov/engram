import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { loadSkills, type Skill } from '../skills/catalog.js';

export type Agent = 'claude' | 'cursor' | 'agents-md';
export const AGENTS: Agent[] = ['claude', 'cursor', 'agents-md'];

export const MCP_ENTRY = {
  command: 'npx',
  args: ['-y', '@vefimov/engram', 'serve'],
};

const START = '<!-- engram:start -->';
const END = '<!-- engram:end -->';

export const AGENT_SNIPPET = `${START}
## Project memory (engram)

This project uses [engram](https://valyefimov.github.io/engram/) as long-term memory, available through the \`engram\` MCP server.

- At the start of a task call \`engram_session_start\` with the goal; read the context it returns.
- Before non-trivial changes call \`engram_check\` with the plan and files.
- Record decisions, rejected options, pitfalls and principles with \`engram_remember\` as they happen.
- Answer "why…?" / "did we…?" questions from \`engram_why\` / \`engram_recall\`, not from guesses.
- Finish meaningful work with \`engram_session_end\` and a short summary.
${END}`;

/** Detect which agents this repo is set up for. Claude Code is always included. */
export function detectAgents(root: string): Agent[] {
  const found: Agent[] = ['claude'];
  if (existsSync(join(root, '.cursor')) || existsSync(join(root, '.cursorrules'))) found.push('cursor');
  if (existsSync(join(root, 'AGENTS.md'))) found.push('agents-md');
  return found;
}

/** Add (or refresh) the engram entry in an MCP JSON config. Returns true if the file changed. */
export function registerMcp(file: string): boolean {
  let json: { mcpServers?: Record<string, unknown> } = {};
  if (existsSync(file)) {
    try {
      json = JSON.parse(readFileSync(file, 'utf8'));
    } catch {
      throw new Error(`${file} is not valid JSON — fix it or add the engram server by hand`);
    }
  }
  json.mcpServers ??= {};
  const before = JSON.stringify(json.mcpServers.engram);
  json.mcpServers.engram = MCP_ENTRY;
  if (before === JSON.stringify(MCP_ENTRY)) return false;
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(json, null, 2) + '\n');
  return true;
}

/** Insert or replace the engram block between markers. Returns true if changed. */
export function upsertSnippet(file: string, snippet = AGENT_SNIPPET): boolean {
  const current = existsSync(file) ? readFileSync(file, 'utf8') : '';
  let next: string;
  const s = current.indexOf(START);
  const e = current.indexOf(END);
  if (s !== -1 && e !== -1 && e > s) {
    next = current.slice(0, s) + snippet + current.slice(e + END.length);
  } else {
    next = current ? `${current.trimEnd()}\n\n${snippet}\n` : `${snippet}\n`;
  }
  if (next === current) return false;
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, next);
  return true;
}

export function installSkills(targetDir: string, skills: Skill[] = loadSkills()): string[] {
  const written: string[] = [];
  for (const skill of skills) {
    const file = join(targetDir, skill.name, 'SKILL.md');
    const content = readFileSync(skill.file, 'utf8');
    if (existsSync(file) && readFileSync(file, 'utf8') === content) continue;
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, content);
    written.push(file);
  }
  return written;
}

function cursorRule(): string {
  return `---
description: Project long-term memory via the engram MCP server
alwaysApply: true
---

${AGENT_SNIPPET.replace(START, '').replace(END, '').trim()}
`;
}

export interface SetupResult {
  changed: string[];
}

export function setupAgent(root: string, agent: Agent, opts: { skills?: boolean } = {}): SetupResult {
  const changed: string[] = [];
  const track = (file: string, didChange: boolean) => didChange && changed.push(file);
  switch (agent) {
    case 'claude': {
      track('.mcp.json', registerMcp(join(root, '.mcp.json')));
      track('CLAUDE.md', upsertSnippet(join(root, 'CLAUDE.md')));
      if (opts.skills !== false) {
        for (const f of installSkills(join(root, '.claude', 'skills'))) changed.push(f.slice(root.length + 1));
      }
      break;
    }
    case 'cursor': {
      track('.cursor/mcp.json', registerMcp(join(root, '.cursor', 'mcp.json')));
      const rule = join(root, '.cursor', 'rules', 'engram.mdc');
      const content = cursorRule();
      if (!existsSync(rule) || readFileSync(rule, 'utf8') !== content) {
        mkdirSync(dirname(rule), { recursive: true });
        writeFileSync(rule, content);
        changed.push('.cursor/rules/engram.mdc');
      }
      break;
    }
    case 'agents-md': {
      track('AGENTS.md', upsertSnippet(join(root, 'AGENTS.md')));
      break;
    }
  }
  return { changed };
}
