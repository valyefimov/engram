// Minimal ANSI SGR → HTML converter, enough for chalk output.
const COLORS = {
  30: '#4b5563', 31: '#f87171', 32: '#34d399', 33: '#fbbf24', 34: '#60a5fa', 35: '#c084fc', 36: '#22d3ee', 37: '#e5e7eb',
  90: '#6b7280', 91: '#fca5a5', 92: '#6ee7b7', 93: '#fde68a', 94: '#93c5fd', 95: '#d8b4fe', 96: '#67e8f9', 97: '#ffffff',
};
const BG = { 43: '#fbbf24', 103: '#fde68a' };

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function ansiToHtml(text) {
  let out = '';
  let state = {};
  let open = false;
  const parts = text.split(/\u001b\[([\d;]*)m/);
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      out += esc(parts[i]);
      continue;
    }
    const codes = parts[i] === '' ? [0] : parts[i].split(';').map(Number);
    for (const code of codes) {
      if (code === 0) state = {};
      else if (code === 1) state.bold = true;
      else if (code === 2) state.dim = true;
      else if (code === 3) state.italic = true;
      else if (code === 4) state.underline = true;
      else if (code === 22) { delete state.bold; delete state.dim; }
      else if (code === 23) delete state.italic;
      else if (code === 24) delete state.underline;
      else if (code === 39) delete state.color;
      else if (code === 49) delete state.bg;
      else if (COLORS[code]) state.color = COLORS[code];
      else if (BG[code]) state.bg = BG[code];
    }
    if (open) out += '</span>';
    const css = [];
    if (state.color) css.push(`color:${state.color}`);
    if (state.bg) css.push(`background:${state.bg};color:#111`);
    if (state.bold) css.push('font-weight:700');
    if (state.dim) css.push('opacity:.55');
    if (state.italic) css.push('font-style:italic');
    if (state.underline) css.push('text-decoration:underline');
    out += `<span style="${css.join(';')}">`;
    open = true;
  }
  if (open) out += '</span>';
  return out;
}

export function terminalPage(bodyHtml, { title = 'engram — zsh', width = 1280, height = 720 } = {}) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  html,body{margin:0;width:${width}px;height:${height}px;overflow:hidden}
  body{background:radial-gradient(1200px 600px at 10% 0%,#3b1d72 0%,#0b0716 55%),#0b0716;display:flex;align-items:center;justify-content:center;font-family:"JetBrains Mono","SF Mono",Menlo,monospace}
  .win{width:${width - 120}px;height:${height - 100}px;background:#0f0a1fee;border:1px solid #2e2450;border-radius:14px;box-shadow:0 40px 120px -20px #7c3aed88;display:flex;flex-direction:column;overflow:hidden}
  .bar{height:38px;display:flex;align-items:center;padding:0 16px;gap:8px;border-bottom:1px solid #221a3d;color:#8b84a8;font-size:13px}
  .dot{width:12px;height:12px;border-radius:50%}
  .t{flex:1;text-align:center;margin-right:52px}
  pre{margin:0;padding:20px 26px;color:#e5e7eb;font-size:16px;line-height:1.55;white-space:pre-wrap;word-break:break-word;flex:1;overflow:hidden;font-family:inherit}
  .prompt{color:#c084fc;font-weight:700}
  .cursor{display:inline-block;width:9px;height:19px;background:#c084fc;vertical-align:-3px}
  </style></head><body><div class="win"><div class="bar"><span class="dot" style="background:#ff5f57"></span><span class="dot" style="background:#febc2e"></span><span class="dot" style="background:#28c840"></span><span class="t">${title}</span></div><pre>${bodyHtml}</pre></div></body></html>`;
}
