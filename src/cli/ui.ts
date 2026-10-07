import { homedir } from 'node:os';
import chalk from 'chalk';
import ora from 'ora';
import { relativeTime } from '../context/format.js';
import type { Memory, MemoryKind, MemoryStatus } from '../types.js';

const KIND_COLOR: Record<MemoryKind, (s: string) => string> = {
  decision: chalk.cyan,
  pitfall: chalk.red,
  principle: chalk.magenta,
  note: chalk.white,
  discussion: chalk.blue,
  fact: chalk.green,
  session: chalk.gray,
  file: chalk.yellow,
};

const STATUS_MARK: Record<MemoryStatus, string> = {
  active: '',
  superseded: chalk.yellow(' ↩ superseded'),
  rejected: chalk.red(' ✗ rejected'),
  archived: chalk.gray(' archived'),
};

export const c = chalk;

export function kindBadge(kind: MemoryKind): string {
  return KIND_COLOR[kind](kind.padEnd(10));
}

export function memoryLine(m: Memory, extra?: string | null): string {
  const tags = m.tags.length ? ' ' + chalk.dim(m.tags.map((t) => `#${t}`).join(' ')) : '';
  const head = `${chalk.dim(m.id.padEnd(14))} ${kindBadge(m.kind)} ${chalk.bold(m.title)}${STATUS_MARK[m.status]}${tags}`;
  const meta = chalk.dim(`  ${'★'.repeat(m.importance)}${'☆'.repeat(5 - m.importance)} · ${relativeTime(m.updatedAt)}`);
  return extra ? `${head}${meta}\n${' '.repeat(26)}${chalk.dim(extra)}` : `${head}${meta}`;
}

/** Very small markdown → terminal renderer: headings, bold, code, quotes. */
export function md(text: string): string {
  return text
    .split('\n')
    .map((line) => {
      if (/^# /.test(line)) return chalk.bold.underline(line.slice(2));
      if (/^##+ /.test(line)) return chalk.bold.cyan(line.replace(/^#+ /, '').replace(/`([^`]+)`/g, (_, s) => chalk.dim(s)));
      return line
        .replace(/\*\*(.+?)\*\*/g, (_, s) => chalk.bold(s))
        .replace(/`([^`]+)`/g, (_, s) => chalk.yellow(s))
        .replace(/«(.+?)»/g, (_, s) => chalk.bgYellow.black(s))
        .replace(/^_(.+)_$/, (_, s) => chalk.dim(s));
    })
    .join('\n');
}

export function ok(msg: string): void {
  console.log(`${chalk.green('✔')} ${msg}`);
}

export function info(msg: string): void {
  console.log(`${chalk.cyan('›')} ${msg}`);
}

export function warn(msg: string): void {
  console.error(`${chalk.yellow('!')} ${msg}`);
}

export function fail(msg: string): never {
  console.error(`${chalk.red('✖')} ${msg}`);
  process.exit(1);
}

export function list(v: string | undefined): string[] {
  return v ? v.split(',').map((s) => s.trim()).filter(Boolean) : [];
}

export const BANNER = `${chalk.bold.magenta('engram')} ${chalk.dim('— a second brain for your coding agent')}`;

/** `/Users/me/code/x` → `~/code/x` */
export function tildify(p: string): string {
  const home = homedir();
  return p === home || p.startsWith(home + '/') ? '~' + p.slice(home.length) : p;
}

/** A spinner on a TTY, a plain ✔ line otherwise (CI, pipes, recordings). */
export function spin(text: string): { succeed(msg: string): void } {
  if (process.stdout.isTTY) {
    const s = ora(text).start();
    return { succeed: (msg) => s.succeed(msg) };
  }
  return { succeed: ok };
}
