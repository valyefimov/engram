import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';

export const ConfigSchema = z.object({
  /** Human readable project name, shown in summaries. */
  project: z.string().default(''),
  sync: z
    .object({
      /**
       * Mirror every write into `.engram/memories.jsonl`. That file is meant to
       * be committed: it is how memory travels between machines and teammates.
       */
      jsonl: z.boolean().default(true),
    })
    .prefault({}),
  context: z
    .object({
      /** Default token budget for `engram_context` / session resume packs. */
      budget: z.number().int().positive().default(2000),
    })
    .prefault({}),
  indexer: z
    .object({
      /** Globs (simple dir prefixes) that hold ADRs / decision records. */
      adrDirs: z
        .array(z.string())
        .default(['docs/adr', 'docs/adrs', 'docs/decisions', 'doc/adr', 'adr', 'decisions']),
      /** How many commits of git history to look at for hotspots. */
      gitDepth: z.number().int().positive().default(500),
      /** Files changed at least this many times are reported as hotspots. */
      hotspotThreshold: z.number().int().positive().default(8),
    })
    .prefault({}),
});

export type EngramConfig = z.infer<typeof ConfigSchema>;

export const CONFIG_FILE = 'config.json';

export function loadConfig(engramDir: string): EngramConfig {
  const file = join(engramDir, CONFIG_FILE);
  if (!existsSync(file)) return ConfigSchema.parse({});
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(file, 'utf8'));
  } catch (err) {
    throw new Error(`engram: cannot parse ${file}: ${(err as Error).message}`);
  }
  const parsed = ConfigSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`engram: invalid ${file}:\n${issues}`);
  }
  return parsed.data;
}

export function writeConfig(engramDir: string, config: Partial<EngramConfig>): void {
  const full = ConfigSchema.parse(config);
  writeFileSync(join(engramDir, CONFIG_FILE), JSON.stringify(full, null, 2) + '\n');
}
