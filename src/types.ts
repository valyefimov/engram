import { z } from 'zod';

/**
 * What a memory *is*. The kind drives ranking, the shape of summaries and
 * which skills care about it (e.g. `avoid-past-mistakes` only looks at
 * pitfalls and rejected decisions).
 */
export const MEMORY_KINDS = [
  'decision', // an architectural / product decision we made (or rejected)
  'pitfall', // a mistake we already paid for — "don't do X, because Y"
  'principle', // a rule the project follows ("no ORMs in the hot path")
  'note', // anything worth remembering that is not one of the above
  'discussion', // the gist of a conversation: options, arguments, outcome
  'fact', // a plain fact about the project ("prod DB is Postgres 16")
  'session', // a summary of a working session, written at its end
  'file', // a pointer to a file / module with what it is for
] as const;

export type MemoryKind = (typeof MEMORY_KINDS)[number];

export const MEMORY_STATUSES = [
  'active', // current truth
  'superseded', // replaced by a newer memory (see `supersedes` links)
  'rejected', // an option we explicitly decided against
  'archived', // soft-deleted, kept for history
] as const;

export type MemoryStatus = (typeof MEMORY_STATUSES)[number];

/**
 * Typed edges of the knowledge graph. They are directed: `from --rel--> to`.
 */
export const RELATIONS = [
  'relates_to', // generic association
  'depends_on', // from needs to to hold
  'implements', // from is an implementation of decision/principle to
  'supersedes', // from replaced to
  'rejected_because', // from (rejected option) was rejected because of to
  'caused_by', // from (pitfall / bug) was caused by to
  'part_of', // from is a part of a larger topic / decision to
] as const;

export type Relation = (typeof RELATIONS)[number];

export const MemoryKindSchema = z.enum(MEMORY_KINDS);
export const MemoryStatusSchema = z.enum(MEMORY_STATUSES);
export const RelationSchema = z.enum(RELATIONS);

export interface Memory {
  id: string;
  kind: MemoryKind;
  title: string;
  content: string;
  tags: string[];
  /** Repo-relative paths this memory is about. */
  files: string[];
  status: MemoryStatus;
  /** 1 (trivia) … 5 (load-bearing). Used for ranking and compression. */
  importance: number;
  /** Who / what produced it: "agent", "user", "adr:docs/adr/0003.md", "git" … */
  source: string;
  sessionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Link {
  from: string;
  to: string;
  relation: Relation;
  note: string | null;
  createdAt: string;
}

export interface Session {
  id: string;
  agent: string | null;
  goal: string | null;
  summary: string | null;
  startedAt: string;
  endedAt: string | null;
}

const fields = {
  kind: MemoryKindSchema,
  title: z.string().trim().min(1).max(200),
  content: z.string(),
  tags: z.array(z.string().trim().toLowerCase().min(1)),
  files: z.array(z.string().trim().min(1)),
  status: MemoryStatusSchema,
  importance: z.number().int().min(1).max(5),
  source: z.string(),
};

export const NewMemorySchema = z.object({
  kind: fields.kind.default('note'),
  title: fields.title,
  content: fields.content.default(''),
  tags: fields.tags.default([]),
  files: fields.files.default([]),
  status: fields.status.default('active'),
  importance: fields.importance.default(3),
  source: fields.source.default('agent'),
  sessionId: z.string().nullable().default(null),
});

export type NewMemory = z.input<typeof NewMemorySchema>;

/** A partial update. Deliberately has no defaults: absent means "keep". */
export const MemoryPatchSchema = z.object(fields).partial();
export type MemoryPatch = z.input<typeof MemoryPatchSchema>;

export interface SearchOptions {
  query?: string;
  kinds?: MemoryKind[];
  tags?: string[];
  files?: string[];
  statuses?: MemoryStatus[];
  /** Include superseded / rejected / archived memories. Default: only active. */
  includeInactive?: boolean;
  limit?: number;
}

export interface SearchHit {
  memory: Memory;
  score: number;
  /** Short snippet around the match, if the query matched content. */
  snippet: string | null;
}
