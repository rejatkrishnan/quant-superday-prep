import { h, randInt, choice, store, formatTime, sparkline, fill, add } from '../lib/util.js';

const OPS = {
  add: 'Addition', sub: 'Subtraction', mul: 'Multiplication', div: 'Division',
  pct: 'Percentages', dec: 'Decimals', frac: 'Fractions → decimal', sq: 'Squares & powers', big: '2-digit × 2-digit',
};
const PRESETS = {
  classic: { label: 'Classic (Zetamac)', ops: ['add', 'sub', 'mul', 'div'] },
  quant: { label: 'Quant mix', ops: ['pct', 'dec', 'frac', 'sq', 'big', 'div'] },
  all: { label: 'Everything', ops: Object.keys(OPS) },
};

const round = (x) => Math.round(x * 1e6) / 1e6;

export function makeProblem(ops) {
  const op = choice(ops);
  switch (op) {
    case 'add': { const a = randInt(2, 100), b = randInt(2, 100); return { text: `${a} + ${b}`, answer: a + b }; }
    case 'sub': { const a = randInt(2, 100), b = randInt(2, 100); return { text: `${a + b} − ${a}`, answer: b }; }
    case 'mul': { const a = randInt(2, 12), b = randInt(2, 100); return { text: `${a} × ${b}`, answer: a * b }; }
    case 'div': { const a = randInt(2, 12), b = randInt(2, 100); return { text: `${a * b} ÷ ${a}`, answer: b }; }
    case 'pct': {
      const p = choice([5, 10, 12.5, 15, 20, 25, 30, 40, 60, 75, 80, 2.5]);
      const n = choice([40, 80, 120, 160, 240, 320, 360, 400, 480, 640, 800, 1200]);
      return { text: `${p}% of ${n}`, answer: round((p / 100) * n) };
    }
    case 'dec': {
      const kind = randInt(0, 2);
      if (kind === 0) { const a = randInt(1, 9) / 10, b = randInt(1, 9) / 10; return { text: `${a} × ${b}`, answer: round(a * b) }; }
      if (kind === 1) { const a = randInt(11, 99) / 10, b = randInt(2, 9); return { text: `${a} × ${b}`, answer: round(a * b) }; }
      const a = randInt(100, 999) / 100, b = randInt(10, 99) / 10;
      return { text: `${a} − ${b}`, answer: round(a - b) };
    }
    case 'frac': {
      const d = choice([4, 5, 8, 16, 20, 25, 40]);
      let n = randInt(1, d - 1);
      return { text: `${n}/${d} = ? (decimal)`, answer: round(n / d) };
    }
    case 'sq': {
      if (Math.random() < 0.75) { const n = randInt(11, 35); return { text: `${n}²`, answer: n * n }; }
      const b = choice([2, 3, 5]), e = b === 2 ? randInt(8, 16) : b === 3 ? randInt(4, 8) : randInt(3, 6);
      return { text: `${b}^${e}`, answer: Math.pow(b, e) };
    }
    case 'big': { const a = randInt(11, 99), b = randInt(11, 99); return { text: `${a} × ${b}`, answer: a * b }; }
  }
}

function parseTyped(s) {
  s = s.trim().replace(/,/g, '');
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return NaN;
  return parseFloat(s);
}

export function render(root) {
  let ops = new Set(PRESETS.classic.ops);
  let duration = 120;
  let timer = null;

  const settings = h('div', { class: 'card' });
  const arena = h('div');
  add(root, 
    h('h1', {}, 'Mental Math Sprint'),
    h('p', { class: 'sub' }, 'Speed arithmetic like the Zetamac / Optiver-style tests used in trading & research screens. Answers auto-submit when correct — just keep typing.'),
    settings, arena,
  );

  function drawSettings() {
    fill(settings, 
      h('h3', { style: { marginTop: 0 } }, 'Preset'),
      h('div', { class: 'row' }, Object.entries(PRESETS).map(([k, p]) =>
        h('button', { class: 'chip' + (sameSet(ops, p.ops) ? ' on' : ''), onclick: () => { ops = new Set(p.ops); drawSettings(); } }, p.label))),
      h('h3', {}, 'Operations'),
      h('div', { class: 'row' }, Object.entries(OPS).map(([k, label]) =>
        h('button', { class: 'chip' + (ops.has(k) ? ' on' : ''), onclick: () => { ops.has(k) ? ops.size > 1 && ops.delete(k) : ops.add(k); drawSettings(); } }, label))),
      h('h3', {}, 'Duration'),
      h('div', { class: 'row' }, [60, 120, 300, 480].map((s) =>
        h('button', { class: 'chip' + (duration === s ? ' on' : ''), onclick: () => { duration = s; drawSettings(); } }, formatTime(s)))),
      h('div', { class: 'row', style: { marginTop: '16px' } },
        h('button', { class: 'primary', onclick: start }, '▶ Start sprint'),
        h('span', { class: 'muted small' }, 'Tip: the classic benchmark is 2 minutes; 40+ is decent, 60+ is strong.')),
    );
    drawHistory();
  }

  function drawHistory() {
    const key = modeKey();
    const runs = store.state.mental.filter((r) => r.key === key);
    const best = runs.reduce((m, r) => Math.max(m, r.score), 0);
    fill(arena, h('div', { class: 'card' },
      h('h3', { style: { marginTop: 0 } }, 'History for this configuration'),
      runs.length
        ? h('div', {},
          h('div', { class: 'row' },
            h('div', { class: 'stat' }, h('div', { class: 'l' }, 'Best'), h('div', { class: 'v' }, best)),
            h('div', { class: 'stat' }, h('div', { class: 'l' }, 'Last'), h('div', { class: 'v' }, runs[runs.length - 1].score)),
            h('div', { class: 'stat' }, h('div', { class: 'l' }, 'Runs'), h('div', { class: 'v' }, runs.length))),
          h('div', { style: { marginTop: '12px' } }, sparkline(runs.slice(-40).map((r) => r.score))))
        : h('p', { class: 'muted' }, 'No runs yet. Start one above!')));
  }

  function modeKey() { return [...ops].sort().join(',') + '@' + duration; }

  function start() {
    settings.style.display = 'none';
    let score = 0, skipped = 0;
    const misses = [];
    const end = Date.now() + duration * 1000;
    let prob = makeProblem([...ops]);
    let shownAt = Date.now();

    const clock = h('span', {}, formatTime(duration));
    const scoreEl = h('span', {}, 'Score: 0');
    const probEl = h('div', { class: 'mm-problem' }, prob.text);
    const input = h('input', { type: 'text', class: 'big', inputmode: 'decimal', autocomplete: 'off', 'aria-label': 'answer' });
    const msg = h('div', { class: 'muted small mm-center', style: { marginTop: '10px' } }, 'Press Enter to skip (counts as a miss).');

    input.addEventListener('input', () => {
      const v = parseTyped(input.value);
      if (!isNaN(v) && Math.abs(v - prob.answer) < 1e-9) {
        score++;
        scoreEl.textContent = `Score: ${score}`;
        next();
      }
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { skipped++; misses.push({ ...prob, ms: Date.now() - shownAt }); next(); }
    });
    function next() {
      prob = makeProblem([...ops]);
      shownAt = Date.now();
      probEl.textContent = prob.text;
      input.value = '';
    }

    fill(arena, h('div', { class: 'card' },
      h('div', { class: 'mm-top' }, clock, scoreEl), probEl, h('div', { class: 'mm-center' }, input), msg,
      h('div', { class: 'mm-center', style: { marginTop: '14px' } }, h('button', { class: 'ghost', onclick: () => finish(true) }, 'Quit'))));
    input.focus();

    timer = setInterval(() => {
      const left = (end - Date.now()) / 1000;
      clock.textContent = formatTime(left);
      if (left <= 0) finish(false);
    }, 200);

    function finish(aborted) {
      clearInterval(timer); timer = null;
      settings.style.display = '';
      if (!aborted) store.recordMental({ key: modeKey(), score, skipped, duration });
      const runs = store.state.mental.filter((r) => r.key === modeKey());
      const best = Math.max(0, ...runs.map((r) => r.score));
      fill(arena, h('div', { class: 'card' },
        h('h2', { style: { marginTop: 0 } }, aborted ? 'Sprint aborted' : `Score: ${score}`),
        !aborted && score >= best && runs.length > 1 ? h('div', { class: 'feedback correct' }, '🎉 New personal best!') : null,
        h('p', { class: 'muted' }, `${(score / (duration / 60)).toFixed(1)} correct per minute · ${skipped} skipped`),
        misses.length ? h('div', {}, h('h3', {}, 'Skipped problems'),
          h('table', {}, h('tr', {}, h('th', {}, 'Problem'), h('th', {}, 'Answer')),
            misses.map((m) => h('tr', {}, h('td', {}, m.text), h('td', {}, String(m.answer)))))) : null,
        h('div', { class: 'row', style: { marginTop: '14px' } }, h('button', { class: 'primary', onclick: start }, 'Go again'), h('button', { onclick: drawHistory }, 'History'))));
    }
  }

  drawSettings();
  return () => { if (timer) clearInterval(timer); };
}

function sameSet(set, arr) { return set.size === arr.length && arr.every((x) => set.has(x)); }
