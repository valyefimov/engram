#!/usr/bin/env node
/**
 * Renders terminal screenshots and demo-video frames from REAL engram output.
 *
 *   node scripts/media/render.mjs <workdir>
 *
 * Needs: a built engram (npm run build), Google Chrome, ffmpeg, and
 * edge-tts (`pip install edge-tts`) for natural neural voices. Falls back to
 * macOS `say` when edge-tts is missing (sounds robotic — fine for drafts).
 *
 * Output: docs/public/screenshots/*.png and docs/public/demo{,.ru,.uk}.mp4
 */
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { ansiToHtml, terminalPage } from './ansi-to-html.mjs';

const repo = resolve(new URL('../..', import.meta.url).pathname);
const work = resolve(process.argv[2] ?? join(repo, '.media'));
const project = join(work, 'shop');
const frames = join(work, 'frames');
const shotsDir = join(repo, 'docs/public/screenshots');
const chrome = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const edgeTts = process.env.EDGE_TTS ?? 'edge-tts';

const LANGS = {
  en: { file: 'demo.mp4', voice: 'en-US-BrianNeural', fallback: 'Eddy (English (US))' },
  ru: { file: 'demo.ru.mp4', voice: 'ru-RU-DmitryNeural', fallback: 'Milena' },
  uk: { file: 'demo.uk.mp4', voice: 'uk-UA-OstapNeural', fallback: 'Lesya' },
};
const bin = join(repo, 'dist/bin/engram.js');

rmSync(work, { recursive: true, force: true });
mkdirSync(frames, { recursive: true });
mkdirSync(shotsDir, { recursive: true });

// ---------------------------------------------------------------- demo repo
cpSync(join(repo, 'examples/adr-demo'), project, { recursive: true });
const sh = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { cwd: project, stdio: ['ignore', 'pipe', 'pipe'], ...opts }).toString();
const git = (...a) => sh('git', ['-c', 'user.name=Dev', '-c', 'user.email=dev@example.com', ...a]);
git('init', '-q');
git('add', '-A');
git('commit', '-qm', 'docs: session ADRs');

const engram = (...args) =>
  sh('node', [bin, ...args], { env: { ...process.env, FORCE_COLOR: '3', COLUMNS: '110' } }).replace(/\r/g, '').replaceAll(project, '~/code/shop');

// a little history the agent "remembered" in earlier sessions
const seedHistory = async () => {
  const { Engram } = await import(join(repo, 'dist/index.js'));
  const e = Engram.open({ root: project });
  e.remember({ kind: 'principle', title: 'Every query on the login path must hit an index', tags: ['auth', 'perf'], importance: 5,
    content: 'Login p95 budget is 150 ms. Check EXPLAIN before merging anything that touches src/auth.' });
  e.remember({ kind: 'pitfall', title: 'Bcrypt cost 14 made login take 900 ms', tags: ['auth', 'perf'], importance: 4, files: ['src/auth/password.ts'],
    content: 'Raising the cost factor looked free in dev. Keep cost 12 and rehash on login if it ever changes.' });
  const s = e.startSession({ agent: 'claude-code', goal: 'Login performance' });
  e.endSession(s.id, 'Done: added token_hash index. Open: login still 220 ms p95 on cold cache. Next: profile the password check.');
  e.close();
};

// ---------------------------------------------------------------- scenes
const scenes = [];
const scene = (name, command, say, run = async () => engram(...command.split(' ').slice(1))) =>
  scenes.push({ name, command, say, run });

scene('init', 'engram init', {
    en: 'Meet engram. One command, and your coding agent gets long-term memory. It hooks up Claude Code, drops in six skills, and learns from your ADRs and git history.',
    ru: 'Знакомься, это engram. Одна команда — и у твоего AI-агента появляется долговременная память. Он подключает Claude Code, ставит шесть скиллов и учится на твоих ADR и истории гита.',
    uk: "Знайомся, це engram. Одна команда — і в твого AI-агента з'являється довготривала пам'ять. Він підключає Claude Code, ставить шість скілів і вчиться на твоїх ADR та історії гіта.",
  },
  async () => { const out = engram('init'); await seedHistory(); return out; });
scene('remember', 'engram remember "Never retry payments without an idempotency key" -k pitfall -t payments -i 5',
  {
    en: 'The agent saves decisions and pitfalls while it works. Or you drop them in yourself, like this nasty payments gotcha.',
    ru: 'Агент сам сохраняет решения и грабли прямо по ходу работы. Или добавляешь их сам — вот, например, неприятная история с платежами.',
    uk: 'Агент сам зберігає рішення й граблі просто під час роботи. Або додаєш їх сам — ось, наприклад, неприємна історія з платежами.',
  },
  () => engram('remember', 'Never retry payments without an idempotency key', '-k', 'pitfall', '-t', 'payments', '-i', '5',
    '-c', 'Retries without a key double charged 214 customers in March. Always pass Idempotency-Key.'));
scene('why', 'engram why sessions', {
    en: 'Now ask why. Engram rebuilds the whole story: what we picked, what it replaced, and what we threw away, with the reasons.',
    ru: 'А теперь спроси «почему». Engram восстанавливает всю историю: что выбрали, что это заменило и от чего отказались — с причинами.',
    uk: 'А тепер спитай «чому». Engram відновлює всю історію: що обрали, що це замінило і від чого відмовилися — з причинами.',
  });
scene('check', 'engram check "add automatic retries to the payment client"', {
    en: 'Before writing a single line, the agent checks its plan against old mistakes. No more stepping on the same rake twice.',
    ru: 'Перед тем как писать код, агент проверяет план на старые ошибки. Больше никаких одних и тех же граблей.',
    uk: 'Перш ніж писати код, агент перевіряє план на старі помилки. Більше жодних тих самих граблів.',
  },
  () => engram('check', 'add automatic retries to the payment client'));
scene('context', 'engram context "speed up login" -b 600', {
    en: 'And every session starts with a tight briefing that fits your token budget. The important stuff in full, the rest in one line.',
    ru: 'А каждая сессия начинается с короткого брифинга, который влезает в бюджет токенов. Важное — целиком, остальное — одной строкой.',
    uk: 'А кожна сесія починається з короткого брифінгу, який вміщається в бюджет токенів. Важливе — повністю, решта — одним рядком.',
  },
  () => engram('context', 'speed up login', '-b', '600'));
scene('status', 'engram status', {
    en: "It's all local, it lives in git, and it works with any MCP agent. Just tell your agent: use engram.",
    ru: 'Всё локально, всё в гите, и работает с любым MCP-агентом. Просто скажи своему агенту: используй engram.',
    uk: 'Усе локально, усе в гіті, і працює з будь-яким MCP-агентом. Просто скажи своєму агенту: використовуй engram.',
  });

// ---------------------------------------------------------------- render
let frameNo = 0;
const shot = (html, file) => {
  const page = join(work, 'page.html');
  writeFileSync(page, html);
  execFileSync(chrome, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--screenshot=${file}`, '--window-size=1280,720', `file://${page}`], { stdio: 'ignore' });
};
const frame = (html, seconds) => {
  const file = join(frames, `f${String(frameNo++).padStart(4, '0')}.png`);
  shot(html, file);
  return { file, seconds };
};

// Frames are rendered once; each language gets its own narration and timing.
const rendered = [];
for (const s of scenes) {
  const output = await s.run();
  const prompt = (cmd, cursor) => `<span class="prompt">❯</span> ${ansiToHtml(cmd)}${cursor ? '<span class="cursor"></span>' : ''}`;
  const typing = [];
  const steps = Math.min(10, s.command.length);
  for (let i = 1; i <= steps; i++) {
    const typed = s.command.slice(0, Math.round((s.command.length * i) / steps));
    typing.push(frame(terminalPage(prompt(typed, true)), 0.09));
  }
  const full = terminalPage(`${prompt(s.command)}\n${ansiToHtml(output.trimEnd())}\n\n${prompt('', true)}`);
  const result = frame(full, 0);
  shot(full, join(shotsDir, `${s.name}.png`));
  rendered.push({ ...s, typing, result });
  console.log(`✔ ${s.name}`);
}

// ---------------------------------------------------------------- narration
let hasEdge = true;
try {
  execFileSync(edgeTts, ['--version'], { stdio: 'ignore' });
} catch {
  hasEdge = false;
  console.warn('! edge-tts not found — falling back to macOS `say` (robotic)');
}

const duration = (file) =>
  Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString());

function speak(lang, text, out) {
  const { voice, fallback } = LANGS[lang];
  if (hasEdge) {
    // the free endpoint occasionally answers 403 — back off and retry
    for (let attempt = 1; ; attempt++) {
      try {
        execFileSync(edgeTts, ['--voice', voice, '--rate', '+4%', '--text', text, '--write-media', out], { stdio: 'ignore' });
        break;
      } catch (err) {
        if (attempt === 6) throw err;
        execFileSync('sleep', [String(attempt * 2)]);
      }
    }
  } else {
    execFileSync('say', ['-v', fallback, '-o', out.replace(/\.mp3$/, '.aiff'), text]);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', out.replace(/\.mp3$/, '.aiff'), out]);
  }
}

// ---------------------------------------------------------------- video
const LEAD = 0.6; // seconds of silence before each line
const TAIL = 0.9; // and after

for (const lang of Object.keys(LANGS)) {
  const frameList = [];
  const audioParts = [];
  rendered.forEach((s, i) => {
    const mp3 = join(work, `${lang}-${i}.mp3`);
    speak(lang, s.say[lang], mp3);
    const speech = duration(mp3);
    const typingTime = s.typing.reduce((a, f) => a + f.seconds, 0);
    const sceneLen = Math.max(typingTime + 2.5, LEAD + speech + TAIL);
    for (const f of s.typing) frameList.push(`file '${f.file}'\nduration ${f.seconds.toFixed(3)}`);
    frameList.push(`file '${s.result.file}'\nduration ${(sceneLen - typingTime).toFixed(3)}`);
    const wav = join(work, `${lang}-${i}.wav`);
    const ms = Math.round(LEAD * 1000);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', mp3, '-af', `adelay=${ms}|${ms},apad=whole_dur=${sceneLen.toFixed(3)}`, '-ar', '44100', '-ac', '2', wav]);
    audioParts.push(wav);
  });
  const lastFrame = rendered.at(-1).result.file;
  writeFileSync(join(work, `${lang}-frames.txt`), `${frameList.join('\n')}\nfile '${lastFrame}'\n`);
  writeFileSync(join(work, `${lang}-audio.txt`), audioParts.map((p) => `file '${p}'`).join('\n') + '\n');
  const voiceWav = join(work, `${lang}-voice.wav`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', join(work, `${lang}-audio.txt`),
    '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', '44100', voiceWav]);
  const out = join(repo, 'docs/public', LANGS[lang].file);
  execFileSync('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-f', 'concat', '-safe', '0', '-i', join(work, `${lang}-frames.txt`),
    '-i', voiceWav,
    '-vf', 'fps=30,format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', '20',
    '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', out,
  ]);
  if (!existsSync(out)) process.exit(1);
  console.log(`🎬 ${out} (${duration(out).toFixed(1)}s)`);
}

execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', '1.5', '-i', join(repo, 'docs/public/demo.mp4'), '-frames:v', '1', join(repo, 'docs/public/demo-poster.png')]);
