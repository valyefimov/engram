import { randomBytes } from 'node:crypto';
import type { MemoryKind } from '../types.js';

const PREFIX: Record<MemoryKind, string> = {
  decision: 'dec',
  pitfall: 'pit',
  principle: 'pri',
  note: 'note',
  discussion: 'dis',
  fact: 'fact',
  session: 'ses',
  file: 'file',
};

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';

function randomId(length = 8): string {
  const bytes = randomBytes(length);
  let out = '';
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

/** Short, human-friendly ids: `dec_k3x9q2mf`. Easy to say in chat, easy to grep. */
export function memoryId(kind: MemoryKind): string {
  return `${PREFIX[kind]}_${randomId()}`;
}

export function sessionId(): string {
  return `s_${randomId(10)}`;
}

export function now(): string {
  return new Date().toISOString();
}
