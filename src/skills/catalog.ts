import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

export interface Skill {
  name: string;
  description: string;
  /** Markdown body (without front matter). */
  body: string;
  /** Path to the SKILL.md this was loaded from. */
  file: string;
}

/** `skills/` ships next to `dist/` and `src/` in the package. */
export function skillsDir(): string {
  return fileURLToPath(new URL('../../skills', import.meta.url));
}

export function parseSkill(file: string, text: string): Skill {
  // git on Windows may check files out with CRLF
  const m = text.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error(`engram: ${file} has no front matter`);
  const meta: Record<string, string> = {};
  for (const line of m[1]!.split('\n')) {
    const kv = line.match(/^([a-zA-Z_-]+):\s*(.*)$/);
    if (kv) meta[kv[1]!] = kv[2]!.replace(/^["']|["']$/g, '').trim();
  }
  if (!meta.name || !meta.description) throw new Error(`engram: ${file} needs name and description`);
  return { name: meta.name, description: meta.description, body: m[2]!.trim(), file };
}

export function loadSkills(dir = skillsDir()): Skill[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(dir, d.name, 'SKILL.md')))
    .map((d) => {
      const file = join(dir, d.name, 'SKILL.md');
      return parseSkill(file, readFileSync(file, 'utf8'));
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}
