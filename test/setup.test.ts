import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { registerMcp, setupAgent, upsertSnippet } from '../src/cli/setup.js';
import { loadSkills, parseSkill } from '../src/skills/catalog.js';
import { tempDir } from './helpers.js';

describe('agent setup', () => {
  it('ships valid skills', () => {
    const skills = loadSkills();
    expect(skills.map((s) => s.name)).toEqual([
      'avoid-past-mistakes',
      'project-summary',
      'recall',
      'remember-decision',
      'session-handoff',
      'why-we-did-this',
    ]);
    for (const s of skills) expect(s.body).toContain('$ARGUMENTS');
  });

  it('parses skills checked out with CRLF line endings', () => {
    const skill = parseSkill('SKILL.md', '---\r\nname: x\r\ndescription: y\r\n---\r\n\r\nbody $ARGUMENTS\r\n');
    expect(skill).toMatchObject({ name: 'x', description: 'y', body: 'body $ARGUMENTS' });
  });

  it('merges into an existing .mcp.json', () => {
    const file = join(tempDir(), '.mcp.json');
    writeFileSync(file, JSON.stringify({ mcpServers: { other: { command: 'x' } } }));
    expect(registerMcp(file)).toBe(true);
    expect(registerMcp(file)).toBe(false);
    const json = JSON.parse(readFileSync(file, 'utf8'));
    expect(Object.keys(json.mcpServers)).toEqual(['other', 'engram']);
  });

  it('keeps the CLAUDE.md snippet idempotent', () => {
    const file = join(tempDir(), 'CLAUDE.md');
    writeFileSync(file, '# My project\n');
    expect(upsertSnippet(file)).toBe(true);
    expect(upsertSnippet(file)).toBe(false);
    const text = readFileSync(file, 'utf8');
    expect(text.startsWith('# My project')).toBe(true);
    expect(text.match(/engram:start/g)).toHaveLength(1);
  });

  it('sets up Claude Code and Cursor', () => {
    const root = tempDir();
    expect(setupAgent(root, 'claude').changed).toContain('.mcp.json');
    expect(setupAgent(root, 'claude').changed).toEqual([]);
    expect(setupAgent(root, 'cursor').changed).toEqual(['.cursor/mcp.json', '.cursor/rules/engram.mdc']);
  });
});
