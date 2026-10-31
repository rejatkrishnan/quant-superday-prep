import { h, randInt, choice, shuffle, comb, fracStr, fmt, store, gradeNumeric, richText, getParams } from '../lib/util.js';
import { PROB_QUESTIONS } from '../data/probability.js';

// ---------- Randomised generators (infinite practice) ----------
const GENS = [
  function diceSum() {
    const k = randInt(2, 12), ways = 6 - Math.abs(7 - k);
    return { topic: 'Probability', diff: 1, q: `Two fair dice are rolled. What is the probability the sum is ${k}?`, ans: ways / 36,
      hint: 'Count ordered pairs.', sol: `${ways} ordered pairs give ${k}: ${ways}/36 = <b>${fracStr(ways, 36)}</b>.` };
  },
  function binomial() {
    const n = randInt(4, 10), k = randInt(0, n), c = comb(n, k);
    return { topic: 'Probability', diff: 1, q: `A fair coin is flipped ${n} times. What is the probability of exactly ${k} heads?`, ans: c / 2 ** n,
      hint: `C(${n},${k}) / 2^${n}.`, sol: `C(${n},${k}) = ${c}; ${c}/${2 ** n} = <b>${fracStr(c, 2 ** n)} ≈ ${fmt(c / 2 ** n)}</b>.` };
  },
  function bayes() {
    const prev = choice([0.001, 0.01, 0.02, 0.05, 0.1]), sens = choice([0.9, 0.95, 0.99]), fpr = choice([0.01, 0.02, 0.05, 0.1]);
    const p = (prev * sens) / (prev * sens + (1 - prev) * fpr);
    return { topic: 'Conditional & Bayes', diff: 2,
      q: `A condition has prevalence ${prev * 100}%. A test detects it ${sens * 100}% of the time and gives false positives ${fpr * 100}% of the time. Given a positive test, what is the probability of having the condition?`,
      ans: p, hint: 'P(C|+) = P(+|C)P(C) / P(+).',
      sol: `(${sens}·${prev}) / (${sens}·${prev} + ${fpr}·${fmt(1 - prev)}) ≈ <b>${fmt(p)}</b>.` };
  },
  function drawTwo() {
    const r = randInt(2, 7), b = randInt(2, 7), n = r + b;
    const which = choice(['both red', 'one of each']);
    const ans = which === 'both red' ? (r * (r - 1)) / (n * (n - 1)) : (2 * r * b) / (n * (n - 1));
    return { topic: 'Probability', diff: 1, q: `An urn has ${r} red and ${b} blue balls. Two are drawn without replacement. What is P(${which})?`, ans,
      hint: 'Use combinations: favourable / C(n,2).',
      sol: which === 'both red' ? `C(${r},2)/C(${n},2) = ${comb(r, 2)}/${comb(n, 2)} = <b>${fracStr(comb(r, 2), comb(n, 2))}</b>.`
        : `${r}·${b}/C(${n},2) = ${r * b}/${comb(n, 2)} = <b>${fracStr(r * b, comb(n, 2))}</b>.` };
  },
  function maxDice() {
    const n = randInt(2, 4);
    let e = 0; for (let k = 1; k <= 6; k++) e += 1 - ((k - 1) / 6) ** n;
    return { topic: 'Expected Value', diff: 2, q: `What is the expected value of the maximum of ${n} fair dice?`, ans: e,
      hint: 'E[M] = Σ_{k≥1} P(M ≥ k).', sol: `Σ_{k=1..6} (1 − ((k−1)/6)^${n}) ≈ <b>${fmt(e)}</b>.` };
  },
  function runOfHeads() {
    const k = randInt(2, 5);
    return { topic: 'Expected Value', diff: 2, q: `What is the expected number of fair coin flips until ${k} heads in a row?`, ans: 2 ** (k + 1) - 2,
      hint: 'E_k = 2·E_{k−1} + 2.', sol: `2^${k + 1} − 2 = <b>${2 ** (k + 1) - 2}</b>.` };
  },
  function ruin() {
    const N = randInt(5, 20), i = randInt(1, N - 1);
    return { topic: 'Stochastic Processes', diff: 1, q: `You have $${i} and bet $1 on fair coin flips until you have $0 or $${N}. What is the probability you reach $${N}?`,
      ans: i / N, hint: 'Fair game ⇒ wealth is a martingale.', sol: `${i}/${N} = <b>${fmt(i / N)}</b>.` };
  },
  function poisson() {
    const lam = choice([1, 2, 3, 4, 5]), k = randInt(0, 4), f = [1, 1, 2, 6, 24][k];
    const p = (Math.exp(-lam) * lam ** k) / f;
    return { topic: 'Statistics', diff: 1, q: `Events occur as a Poisson process with rate ${lam} per minute. What is the probability of exactly ${k} events in one minute?`,
      ans: p, hint: 'e^(−λ) λ^k / k!.', sol: `e^−${lam} · ${lam}^${k} / ${k}! ≈ <b>${fmt(p)}</b>.` };
  },
  function geometricWait() {
    const s = randInt(2, 6), p = (6 - s + 1) / 6;
    return { topic: 'Expected Value', diff: 1, q: `How many rolls of a fair die do you expect to need to roll a ${s} or higher?`, ans: 1 / p,
      hint: 'Geometric: 1/p.', sol: `p = ${fracStr(7 - s, 6)} ⇒ E = <b>${fracStr(6, 7 - s)}</b>.` };
  },
  function linearity() {
    const n = randInt(5, 30), d = randInt(2, 6);
    return { topic: 'Expected Value', diff: 2,
      q: `${n} people each independently pick a number from 1 to ${d} uniformly at random. What is the expected number of numbers (out of ${d}) that nobody picks?`,
      ans: d * ((d - 1) / d) ** n, hint: 'Indicator per number.', sol: `${d} · (1 − 1/${d})^${n} ≈ <b>${fmt(d * ((d - 1) / d) ** n)}</b>.` };
  },
];

export function makeGenerated() {
  const g = choice(GENS);
  return { id: 'gen:' + g.name, ...g() };
}

const TOPICS = [...new Set(PROB_QUESTIONS.map((q) => q.topic))];

export function render(root) {
  const params = getParams();
  let mode = ['bank', 'review', 'gen'].includes(params.mode) ? params.mode : 'bank';
  let topic = TOPICS.includes(params.topic) ? params.topic : 'All', diff = 'All';
  let queue = [];
  let session = { ok: 0, n: 0 };

  const controls = h('div', { class: 'card' });
  const card = h('div', { class: 'card' });
  root.append(
    h('h1', {}, 'Probability, Statistics & Math'),
    h('p', { class: 'sub' }, `${PROB_QUESTIONS.length} curated interview questions (probability, EV, Bayes, combinatorics, stochastic processes, statistics, linear algebra, calculus, pricing) + unlimited randomised problems. Answers accept fractions and expressions: 1/6, 0.1667, 16.67%, 1-(5/6)^4, sqrt(2/pi).`),
    controls, card,
  );

  function drawControls() {
    const due = store.dueReview('probability').length;
    const seen = PROB_QUESTIONS.filter((q) => store.seen('probability', q.id)).length;
    controls.replaceChildren(
      h('div', { class: 'row' },
        h('span', { class: 'muted' }, 'Mode:'),
        [['bank', 'Question bank'], ['review', `Review due (${due})`], ['gen', 'Infinite random']].map(([k, l]) =>
          h('button', { class: 'chip' + (mode === k ? ' on' : ''), onclick: () => { mode = k; rebuild(); } }, l))),
      mode === 'bank' ? h('div', { class: 'row', style: { marginTop: '10px' } },
        h('span', { class: 'muted' }, 'Topic:'),
        h('select', { onchange: (e) => { topic = e.target.value; rebuild(); } },
          ['All', ...TOPICS].map((t) => h('option', { value: t, selected: t === topic }, t))),
        h('span', { class: 'muted' }, 'Difficulty:'),
        h('select', { onchange: (e) => { diff = e.target.value; rebuild(); } },
          [['All', 'All'], ['1', 'Easy'], ['2', 'Medium'], ['3', 'Hard']].map(([v, l]) => h('option', { value: v, selected: v === diff }, l))),
        h('span', { class: 'spacer' }),
        h('span', { class: 'muted small' }, `Attempted ${seen}/${PROB_QUESTIONS.length} · session ${session.ok}/${session.n}`)) : null,
    );
  }

  function rebuild() {
    if (mode === 'bank') {
      const pool = PROB_QUESTIONS.filter((q) => (topic === 'All' || q.topic === topic) && (diff === 'All' || q.diff === Number(diff)));
      // unseen first, then the rest
      queue = [...shuffle(pool.filter((q) => !store.seen('probability', q.id))), ...shuffle(pool.filter((q) => store.seen('probability', q.id)))];
    } else if (mode === 'review') {
      const ids = new Set(store.dueReview('probability'));
      queue = shuffle(PROB_QUESTIONS.filter((q) => ids.has(q.id)));
    } else queue = [];
    drawControls();
    next();
  }

  function next() {
    let q;
    if (mode === 'gen') q = makeGenerated();
    else q = queue.shift();
    if (!q) {
      card.replaceChildren(h('p', {}, mode === 'review' ? '🎉 Nothing due for review. Questions come back here on a spaced-repetition schedule.' : 'You\'ve gone through every question for this filter.'),
        h('button', { class: 'primary', onclick: rebuild }, 'Start over'));
      return;
    }
    showQuestion(card, q, (ok) => { session.n++; if (ok) session.ok++; drawControls(); }, next);
  }

  rebuild();
}

// Reusable question UI (also used by the mock superday).
export function showQuestion(card, q, onResult, onNext, { module = 'probability', allowHint = true, extra = {} } = {}) {
  let done = false, usedHint = false;
  const t0 = Date.now();
  const input = h('input', { type: 'text', class: 'answer', placeholder: 'your answer', autocomplete: 'off' });
  const fb = h('div');
  const hintEl = h('div');

  const finish = (ok, verdict) => {
    done = true;
    store.recordAttempt(module, q.id, ok, { ms: Date.now() - t0, hint: usedHint, ...extra });
    onResult?.(ok);
    fb.replaceChildren(h('div', { class: 'feedback ' + verdict },
      h('b', {}, verdict === 'correct' ? `✓ Correct (${((Date.now() - t0) / 1000).toFixed(0)}s)` : verdict === 'info' ? 'Solution' : `✗ Not quite — answer ≈ ${fmt(q.ans)}`),
      richText(q.sol), h('div', { class: 'muted small', style: { marginTop: '6px' } }, 'Press Enter for the next question.')));
  };
  const submit = () => {
    if (done) return onNext();
    const g = gradeNumeric(input.value, q.ans, q.tol ?? 0.005);
    if (g === 'invalid') return fb.replaceChildren(h('div', { class: 'feedback info' }, 'Could not parse that. Try a number, fraction, or expression like 1-(5/6)^4.'));
    if (g === 'close') return fb.replaceChildren(h('div', { class: 'feedback close' }, 'Close! Give a bit more precision (or an exact fraction).'));
    finish(g === 'correct', g);
  };
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });

  card.replaceChildren(
    h('div', { class: 'row' }, h('span', { class: 'badge' }, q.topic), h('span', { class: 'badge d' + q.diff }, ['', 'easy', 'medium', 'hard'][q.diff]),
      String(q.id).startsWith('gen:') ? h('span', { class: 'badge' }, 'randomised') : null),
    h('div', { class: 'question' }, q.q),
    h('div', { class: 'row' }, input, h('button', { class: 'primary', onclick: submit }, 'Submit'),
      allowHint ? h('button', { onclick: () => { usedHint = true; hintEl.replaceChildren(h('div', { class: 'feedback info' }, '💡 ', q.hint)); } }, 'Hint') : null,
      h('button', { class: 'ghost', onclick: () => (done ? onNext() : finish(false, 'info')) }, 'Show solution / Skip')),
    hintEl, fb,
  );
  input.focus();
}
