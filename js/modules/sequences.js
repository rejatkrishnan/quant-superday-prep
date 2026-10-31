import { h, randInt, choice, store, gradeNumeric, fill, add } from '../lib/util.js';

const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
const N = 7; // terms generated; the last one is hidden

// Each generator returns { terms, rule } with `terms.length === N`.
const GENERATORS = [
  { name: 'Arithmetic', diff: 1, gen() {
    const a = randInt(-20, 40), d = choice([-9, -7, -6, -4, -3, 3, 4, 6, 7, 8, 9, 11, 12, 13]);
    return { terms: seq((n) => a + n * d), rule: `Arithmetic: add ${d} each time.` };
  } },
  { name: 'Geometric', diff: 1, gen() {
    const a = randInt(1, 5), r = choice([2, 3, -2, 4]);
    return { terms: seq((n) => a * r ** n), rule: `Geometric: multiply by ${r} each time.` };
  } },
  { name: 'Quadratic', diff: 2, gen() {
    const a = randInt(1, 3), b = randInt(-4, 4), c = randInt(-5, 10);
    return { terms: seq((n) => a * (n + 1) ** 2 + b * (n + 1) + c),
      rule: `Quadratic: ${a}n² ${b >= 0 ? '+' : '−'} ${Math.abs(b)}n ${c >= 0 ? '+' : '−'} ${Math.abs(c)} (second differences are constant = ${2 * a}).` };
  } },
  { name: 'Squares/cubes offset', diff: 1, gen() {
    const p = choice([2, 2, 3]), k = randInt(-3, 5), s = randInt(1, 4);
    return { terms: seq((n) => (n + s) ** p + k), rule: `n${p === 2 ? '²' : '³'} ${k >= 0 ? '+' : '−'} ${Math.abs(k)} starting at n = ${s}.` };
  } },
  { name: 'Fibonacci-like', diff: 2, gen() {
    const t = [randInt(1, 6), randInt(1, 9)];
    while (t.length < N) t.push(t[t.length - 1] + t[t.length - 2]);
    return { terms: t, rule: 'Fibonacci-like: each term is the sum of the previous two.' };
  } },
  { name: 'Tribonacci', diff: 3, gen() {
    const t = [randInt(0, 2), randInt(1, 3), randInt(1, 4)];
    while (t.length < N) t.push(t[t.length - 1] + t[t.length - 2] + t[t.length - 3]);
    return { terms: t, rule: 'Each term is the sum of the previous three.' };
  } },
  { name: 'Affine recurrence', diff: 2, gen() {
    const m = choice([2, 3]), c = choice([-3, -2, -1, 1, 2, 3]), t = [randInt(1, 5)];
    while (t.length < N) t.push(m * t[t.length - 1] + c);
    return { terms: t, rule: `x(n+1) = ${m}·x(n) ${c >= 0 ? '+' : '−'} ${Math.abs(c)}.` };
  } },
  { name: 'Interleaved', diff: 2, gen() {
    const a = randInt(1, 20), d1 = choice([2, 3, 5, 7]), b = randInt(20, 60), d2 = choice([-1, -2, -3, -4, 4]);
    return { terms: seq((n) => (n % 2 === 0 ? a + (n / 2) * d1 : b + ((n - 1) / 2) * d2)),
      rule: `Two interleaved sequences: odd positions ${a}, +${d1}…; even positions ${b}, ${d2 >= 0 ? '+' : ''}${d2}….` };
  } },
  { name: 'Alternating operations', diff: 2, gen() {
    const inc = randInt(1, 6), mul = choice([2, 3]), t = [randInt(1, 6)];
    while (t.length < N) t.push(t.length % 2 === 1 ? t[t.length - 1] + inc : t[t.length - 1] * mul);
    return { terms: t, rule: `Alternate: +${inc}, then ×${mul}.` };
  } },
  { name: 'Growing differences', diff: 2, gen() {
    const a = randInt(1, 20), d0 = randInt(1, 4), dd = randInt(1, 3), t = [a];
    for (let k = 0; t.length < N; k++) t.push(t[t.length - 1] + d0 + k * dd);
    return { terms: t, rule: `Differences increase by ${dd}: +${d0}, +${d0 + dd}, +${d0 + 2 * dd}, …` };
  } },
  { name: 'Geometric differences', diff: 3, gen() {
    const a = randInt(0, 10), r = choice([2, 3]), t = [a];
    for (let k = 0; t.length < N; k++) t.push(t[t.length - 1] + r ** k);
    return { terms: t, rule: `Differences are powers of ${r}: +1, +${r}, +${r * r}, …` };
  } },
  { name: 'Primes', diff: 2, gen() {
    const s = randInt(0, 8), m = choice([1, 1, 2, 3]), k = choice([0, 0, 1, -1]);
    return { terms: seq((n) => m * PRIMES[s + n] + k),
      rule: `${m > 1 ? m + '× ' : ''}consecutive primes${k ? (k > 0 ? ' + 1' : ' − 1') : ''} (starting at ${PRIMES[s]}).` };
  } },
  { name: 'Triangular', diff: 2, gen() {
    const m = choice([1, 2, 3]), s = randInt(1, 4);
    return { terms: seq((n) => (m * (n + s) * (n + s + 1)) / 2), rule: `${m > 1 ? m + '× ' : ''}triangular numbers n(n+1)/2, from n = ${s}.` };
  } },
  { name: 'Factorial-style', diff: 3, gen() {
    const s = randInt(1, 3), t = [randInt(1, 3)];
    while (t.length < N) t.push(t[t.length - 1] * (t.length + s - 1));
    return { terms: t, rule: `Multiply by ${s}, then ${s + 1}, then ${s + 2}, …` };
  } },
  { name: 'n × (n + k)', diff: 2, gen() {
    const k = randInt(1, 4), s = randInt(1, 3);
    return { terms: seq((n) => (n + s) * (n + s + k)), rule: `n(n + ${k}) starting at n = ${s}.` };
  } },
  { name: 'Powers ± n', diff: 3, gen() {
    const b = choice([2, 3]), sign = choice([1, -1]);
    return { terms: seq((n) => b ** (n + 1) + sign * (n + 1)), rule: `${b}ⁿ ${sign > 0 ? '+' : '−'} n.` };
  } },
  { name: 'Alternating sign', diff: 2, gen() {
    const a = randInt(1, 5), d = randInt(2, 5);
    return { terms: seq((n) => (n % 2 === 0 ? 1 : -1) * (a + n * d)), rule: `Magnitudes ${a}, ${a + d}, ${a + 2 * d}, … with alternating signs.` };
  } },
];

function seq(f) { return Array.from({ length: N }, (_, n) => f(n)); }

// Curated "aha" sequences that interviewers like.
const CLASSICS = [
  { terms: [1, 11, 21, 1211, 111221], ans: 312211, rule: 'Look-and-say: read the previous term aloud ("one 1" → 11, "two 1s" → 21, …).' },
  { terms: [1, 4, 27, 256], ans: 3125, rule: 'nⁿ.' },
  { terms: [2, 3, 5, 9, 17], ans: 33, rule: '2ⁿ + 1 (each term is 2× previous − 1).' },
  { terms: [1, 2, 6, 24, 120], ans: 720, rule: 'Factorials.' },
  { terms: [1, 3, 7, 15, 31], ans: 63, rule: '2ⁿ − 1.' },
  { terms: [0, 1, 3, 6, 10, 15], ans: 21, rule: 'Triangular numbers.' },
  { terms: [1, 8, 27, 64, 125], ans: 216, rule: 'Cubes.' },
  { terms: [2, 6, 12, 20, 30], ans: 42, rule: 'n(n+1).' },
  { terms: [1, 2, 4, 7, 11, 16], ans: 22, rule: 'Differences 1, 2, 3, 4, 5, 6.' },
  { terms: [3, 3, 5, 4, 4, 3, 5, 5], ans: 4, rule: 'Letters in the English words one, two, three, … nine ("nine" has 4).' },
  { terms: [1, 1, 2, 6, 24, 120], ans: 720, rule: '(n−1)! — or each term × its position.' },
  { terms: [2, 12, 1112, 3112], ans: 132112, rule: 'Look-and-say starting from 2.' },
  { terms: [6, 28, 496], ans: 8128, rule: 'Perfect numbers.' },
  { terms: [1, 2, 5, 14, 42], ans: 132, rule: 'Catalan numbers.' },
  { terms: [1, 5, 14, 30, 55], ans: 91, rule: 'Sums of squares 1² + … + n².' },
  { terms: [4, 6, 8, 9, 10, 12, 14], ans: 15, rule: 'Composite numbers.' },
  { terms: [1, 3, 4, 7, 11, 18], ans: 29, rule: 'Lucas numbers (Fibonacci rule from 1, 3).' },
  { terms: [31, 28, 31, 30, 31, 30], ans: 31, rule: 'Days in each month (July has 31).' },
  { terms: [1, 2, 3, 5, 7, 11, 13], ans: 17, rule: '1 followed by primes.' },
  { terms: [0, 1, 4, 9, 16, 25, 36], ans: 49, rule: 'Squares from 0.' },
  { terms: [10, 11, 12, 13, 14, 15, 16, 17, 20, 22, 24], ans: 31, rule: 'Sixteen written in bases 16, 15, 14, … (16 in base 5 = 31).' },
];

export function makeSequence(level = 'mixed') {
  if (level === 'classic' || (level === 'mixed' && Math.random() < 0.15)) {
    const c = choice(CLASSICS);
    return { shown: c.terms, ans: c.ans, rule: c.rule, name: 'Classic', diff: 2 };
  }
  const pool = GENERATORS.filter((g) => level === 'mixed' || level === 'classic' || g.diff === Number(level));
  for (;;) {
    const g = choice(pool);
    const { terms, rule } = g.gen();
    if (terms.some((t) => Math.abs(t) > 1e7)) continue;
    return { shown: terms.slice(0, N - 1), ans: terms[N - 1], rule, name: g.name, diff: g.diff };
  }
}

export function render(root) {
  let level = 'mixed';
  let streak = 0, solved = 0, tried = 0;
  let cur, startedAt, answered;

  const levelRow = h('div', { class: 'row' });
  const statsEl = h('div', { class: 'muted small' });
  const card = h('div', { class: 'card' });
  add(root, 
    h('h1', {}, 'Pattern Recognition'),
    h('p', { class: 'sub' }, 'Find the next term. Procedurally generated — 17 rule families from arithmetic to tribonacci, plus curated "aha" classics. Speed matters: aim for under 20 seconds.'),
    h('div', { class: 'card' }, levelRow, h('div', { style: { marginTop: '8px' } }, statsEl)),
    card,
  );

  function drawLevels() {
    const opts = [['mixed', 'Mixed'], ['1', 'Easy'], ['2', 'Medium'], ['3', 'Hard'], ['classic', 'Classics only']];
    fill(levelRow, h('span', { class: 'muted' }, 'Difficulty:'),
      opts.map(([k, l]) => h('button', { class: 'chip' + (level === k ? ' on' : ''), onclick: () => { level = k; drawLevels(); next(); } }, l)));
  }
  function drawStats() {
    statsEl.textContent = `Session: ${solved}/${tried} correct · streak ${streak}`;
  }

  function next() {
    cur = makeSequence(level);
    startedAt = Date.now();
    answered = false;
    const input = h('input', { type: 'text', class: 'answer', placeholder: 'next term', autocomplete: 'off' });
    const fb = h('div');
    const submit = () => {
      if (answered) return next();
      const g = gradeNumeric(input.value, cur.ans, 0);
      if (g === 'invalid') { fill(fb, h('div', { class: 'feedback info' }, 'Enter a number.')); return; }
      answered = true;
      tried++;
      const ok = g === 'correct';
      const secs = ((Date.now() - startedAt) / 1000).toFixed(1);
      if (ok) { solved++; streak++; } else streak = 0;
      store.recordAttempt('sequences', 'gen:' + cur.name, ok, { ms: Date.now() - startedAt });
      fill(fb, h('div', { class: 'feedback ' + (ok ? 'correct' : 'wrong') },
        h('b', {}, ok ? `✓ Correct in ${secs}s` : `✗ Answer: ${cur.ans}`), h('div', {}, cur.rule),
        h('div', { class: 'muted small' }, 'Press Enter for the next sequence.')));
      drawStats();
    };
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
    fill(card, 
      h('div', { class: 'row' }, h('span', { class: 'badge d' + cur.diff }, ['', 'easy', 'medium', 'hard'][cur.diff])),
      h('div', { class: 'seq' }, cur.shown.join(', '), ', ', h('span', { class: 'q' }, '?')),
      h('div', { class: 'row' }, input,
        h('button', { class: 'primary', onclick: submit }, 'Submit'),
        h('button', { onclick: () => { if (!answered) { answered = true; tried++; streak = 0; store.recordAttempt('sequences', 'gen:' + cur.name, false); drawStats(); fill(fb, h('div', { class: 'feedback info' }, h('b', {}, `Answer: ${cur.ans}`), h('div', {}, cur.rule))); } else next(); } }, 'Reveal / Next')),
      fb,
      h('details', { style: { marginTop: '14px' } }, h('summary', {}, 'Strategy checklist'),
        h('ul', { class: 'small' },
          h('li', {}, 'Take first differences; if not constant take second differences (quadratic ⇒ constant 2nd diff).'),
          h('li', {}, 'Check ratios (geometric) and whether differences themselves are geometric.'),
          h('li', {}, 'Look at odd and even positions separately (interleaved).'),
          h('li', {}, 'Compare to squares, cubes, primes, factorials, triangular, Fibonacci, 2ⁿ ± 1.'),
          h('li', {}, 'Test x(n+1) = a·x(n) + b with the first three terms.'))),
    );
    input.focus();
  }

  drawLevels();
  drawStats();
  next();
}
