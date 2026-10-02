import { checkPitfalls } from '../graph/graph.js';
import type { Engram } from '../store/engram.js';
import type { Memory } from '../types.js';
import { block, estimateTokens, oneLine, relativeTime, truncate } from './format.js';

export interface ContextOptions {
  /** What the agent is about to do. Drives relevance. */
  task?: string;
  /** Files the agent is about to touch. */
  files?: string[];
  /** Token budget for the whole pack. */
  budget?: number;
}

export interface ContextPack {
  markdown: string;
  tokens: number;
  budget: number;
  /** Memories rendered in full. */
  full: string[];
  /** Memories compressed to a single line. */
  compressed: string[];
  /** Memories that did not fit at all. */
  dropped: string[];
}

interface Candidate {
  memory: Memory;
  section: Section;
  priority: number;
}

type Section = 'principles' | 'pitfalls' | 'relevant' | 'decisions';

const SECTION_TITLE: Record<Section, string> = {
  principles: 'Project principles',
  pitfalls: 'Known pitfalls — check before you act',
  relevant: 'Relevant memory',
  decisions: 'Key decisions',
};

const SECTION_ORDER: Section[] = ['principles', 'pitfalls', 'relevant', 'decisions'];

/**
 * The context compressor. Assemble the most useful memory for the task at
 * hand and fit it into a token budget: the most important items are rendered
 * in full, the next tier is squeezed to one line each, the rest is dropped
 * (but reported, so the agent knows it can `recall` more).
 */
export function buildContext(engram: Engram, opts: ContextOptions = {}): ContextPack {
  const budget = opts.budget ?? engram.config.context.budget;
  const task = opts.task?.trim() ?? '';
  const candidates = new Map<string, Candidate>();
  const offer = (memory: Memory, section: Section, priority: number) => {
    const prev = candidates.get(memory.id);
    if (!prev || prev.priority < priority) candidates.set(memory.id, { memory, section, priority });
  };

  for (const m of engram.list({ kinds: ['principle'], limit: 20 })) {
    offer(m, 'principles', 50 + m.importance * 10);
  }

  if (task || opts.files?.length) {
    for (const w of checkPitfalls(engram, task || (opts.files ?? []).join(' '), {
      files: opts.files,
      limit: 6,
    })) {
      offer(w.memory, 'pitfalls', 80 + Math.min(w.score, 10) * 3);
    }
  } else {
    for (const m of engram.list({ kinds: ['pitfall'], limit: 8 })) {
      offer(m, 'pitfalls', 40 + m.importance * 8);
    }
  }

  if (task) {
    const hits = engram.search({ query: task, limit: 15 });
    hits.forEach((h, i) => offer(h.memory, 'relevant', 70 + Math.min(h.score, 10) * 2 - i));
  }
  if (opts.files?.length) {
    for (const m of engram.list({ files: opts.files, limit: 10 })) offer(m, 'relevant', 72);
  }

  for (const m of engram.list({ kinds: ['decision'], limit: 15 })) {
    offer(m, 'decisions', 20 + m.importance * 8);
  }

  // ---- header: where we left off
  const header: string[] = [`# Engram context${engram.config.project ? ` — ${engram.config.project}` : ''}`];
  if (task) header.push(`Task: ${task}`);
  const last = engram.recentSessions(5).find((s) => s.summary);
  if (last) {
    header.push(
      '',
      `## Last session (${relativeTime(last.endedAt ?? last.startedAt)}${last.agent ? `, ${last.agent}` : ''})`,
      last.goal ? `Goal: ${last.goal}` : '',
      truncate(last.summary ?? '', 700),
    );
  }
  let used = estimateTokens(header.join('\n'));

  // ---- greedy fill by priority: full → one line → dropped
  const ordered = [...candidates.values()]
    .filter((c) => c.memory.kind !== 'session')
    .sort((a, b) => b.priority - a.priority);
  const rendered = new Map<Section, string[]>();
  const full: string[] = [];
  const compressed: string[] = [];
  const dropped: string[] = [];
  const reserve = 40; // keep room for the footer

  for (const c of ordered) {
    const fullText = block(c.memory, { maxChars: c.section === 'pitfalls' ? 900 : 600 });
    const lineText = `- ${oneLine(c.memory)}`;
    const fullCost = estimateTokens(fullText) + 2;
    const lineCost = estimateTokens(lineText) + 1;
    // High-priority items always get the full treatment; the rest only while
    // there is plenty of budget left, so the tail can still fit as one-liners.
    const wantsFull = c.priority >= 60 || c.section === 'pitfalls' || used + fullCost <= budget * 0.6;
    let text: string | null = null;
    if (wantsFull && used + fullCost <= budget - reserve) {
      text = fullText;
      used += fullCost;
      full.push(c.memory.id);
    } else if (used + lineCost <= budget - reserve) {
      text = lineText;
      used += lineCost;
      compressed.push(c.memory.id);
    } else {
      dropped.push(c.memory.id);
    }
    if (text) {
      const list = rendered.get(c.section) ?? [];
      list.push(text);
      rendered.set(c.section, list);
    }
  }

  const body: string[] = [];
  for (const section of SECTION_ORDER) {
    const items = rendered.get(section);
    if (!items?.length) continue;
    body.push('', `## ${SECTION_TITLE[section]}`, '', items.join('\n\n'));
  }
  if (!body.length && !last) {
    body.push('', '_Memory is empty so far. Use `engram_remember` to store decisions, pitfalls and principles as you go._');
  }

  const footer: string[] = [];
  if (dropped.length) {
    footer.push('', `_${dropped.length} more memories did not fit the ${budget}-token budget — use \`engram_recall\` to dig deeper._`);
  }

  const markdown = [...header.filter((l, i) => l !== '' || header[i - 1] !== ''), ...body, ...footer]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return { markdown, tokens: estimateTokens(markdown), budget, full, compressed, dropped };
}
