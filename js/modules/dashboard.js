import { h, store, sparkline } from '../lib/util.js';
import { PROB_QUESTIONS } from '../data/probability.js';
import { BRAINTEASERS } from '../data/brainteasers.js';
import { CODING_PROBLEMS } from '../data/coding.js';

const MODULES = [
  { key: 'mental', ico: '⚡', title: 'Mental Math', desc: 'Zetamac-style sprints plus a quant mix of percentages, decimals, fractions and squares.' },
  { key: 'sequences', ico: '🔢', title: 'Pattern Recognition', desc: 'Infinite number sequences from 17 rule families plus curated classics.' },
  { key: 'probability', ico: '🎲', title: 'Probability & Stats', desc: 'Curated interview questions with solutions, plus unlimited randomised problems.' },
  { key: 'brainteasers', ico: '🧩', title: 'Brainteasers', desc: 'Logic puzzles, game theory and optimisation classics.' },
  { key: 'coding', ico: '🐍', title: 'Coding', desc: 'Python, NumPy and pandas drills with auto-graded tests in the browser.' },
  { key: 'market', ico: '📈', title: 'Market Making', desc: 'Quote markets on estimates and dice sums against an informed trader.' },
  { key: 'superday', ico: '🏁', title: 'Mock Superday', desc: 'Timed mixed exam with a section-by-section report.' },
  { key: 'cheatsheet', ico: '📘', title: 'Cheat Sheet', desc: 'Distributions, tricks, formulas and pandas idioms to memorise.' },
];

function streakDays(attempts) {
  const days = new Set(attempts.map((a) => new Date(a.t).toDateString()));
  let n = 0;
  const d = new Date();
  if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1); // streak still alive if you practised yesterday
  while (days.has(d.toDateString())) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

export function render(root) {
  const s = store.state;
  const all = [...s.attempts, ...s.mental.map((m) => ({ t: m.t })), ...s.markets.map((m) => ({ t: m.t }))];
  const acc = (m) => {
    const a = s.attempts.filter((x) => x.m === m);
    return { n: a.length, ok: a.filter((x) => x.ok).length };
  };
  const probSeen = PROB_QUESTIONS.filter((q) => store.seen('probability', q.id)).length;
  const teaserSeen = BRAINTEASERS.filter((b) => store.seen('brainteasers', b.id)).length;
  const solved = CODING_PROBLEMS.filter((p) => s.solved[p.id]).length;
  const classic = s.mental.filter((m) => m.key === 'add,div,mul,sub@120');
  const due = store.dueReview('probability').length + store.dueReview('brainteasers').length;

  root.append(...[
    h('h1', {}, 'Dashboard'),
    h('p', { class: 'sub' }, 'Your quant research superday training hub. Everything runs in your browser; progress is stored locally.'),
    h('div', { class: 'grid cols-4' },
      stat('Day streak', `${streakDays(all)} 🔥`),
      stat('Questions answered', s.attempts.length),
      stat('Mental math best (2 min)', classic.length ? Math.max(...classic.map((m) => m.score)) : '—'),
      stat('Coding solved', `${solved}/${CODING_PROBLEMS.length}`)),
    due ? h('div', { class: 'card', style: { marginTop: '14px', borderColor: 'var(--warn)' } },
      `🔁 You have ${due} missed question(s) due for review. `,
      h('a', { href: '#/probability' }, 'Probability review'), ' · ', h('a', { href: '#/brainteasers' }, 'Brainteaser review')) : null,
    h('h2', {}, 'Coverage & accuracy'),
    h('div', { class: 'card' }, h('table', {},
      h('tr', {}, h('th', {}, 'Area'), h('th', {}, 'Coverage'), h('th', {}, 'Accuracy'), h('th', { style: { width: '35%' } }, '')),
      row('Probability & stats', `${probSeen}/${PROB_QUESTIONS.length} curated`, acc('probability')),
      row('Brainteasers', `${teaserSeen}/${BRAINTEASERS.length}`, acc('brainteasers')),
      row('Pattern recognition', `${acc('sequences').n} attempted`, acc('sequences')),
      row('Coding', `${solved}/${CODING_PROBLEMS.length} solved`, acc('coding')),
      h('tr', {}, h('td', {}, 'Mock superdays'), h('td', {}, `${s.mocks.length} taken`),
        h('td', {}, s.mocks.length ? `${Math.round(100 * s.mocks.reduce((a, m) => a + m.correct / m.total, 0) / s.mocks.length)}%` : '—'), h('td', {})))),
    classic.length > 1 ? h('div', { class: 'card' }, h('h3', { style: { marginTop: 0 } }, 'Mental math trend (classic, 2 min)'), sparkline(classic.slice(-40).map((m) => m.score))) : null,
    h('h2', {}, 'Train'),
    h('div', { class: 'grid cols-3' }, MODULES.map((m) =>
      h('a', { class: 'card tile', href: `#/${m.key}` }, h('div', { class: 'ico' }, m.ico), h('h3', {}, m.title), h('div', { class: 'muted small' }, m.desc)))),
    h('h2', {}, 'Suggested daily routine (~45 min)'),
    h('div', { class: 'card' }, h('ol', {},
      h('li', {}, '2 × 2-minute mental math sprints (classic, then quant mix).'),
      h('li', {}, '10 pattern-recognition sequences at medium/hard.'),
      h('li', {}, 'Clear your review queue, then 5 new probability questions — explain each answer out loud.'),
      h('li', {}, '1 brainteaser and 1 coding problem.'),
      h('li', {}, '3 markets in the market-making game.'),
      h('li', {}, 'Once a week: a full mock superday.'))),
    h('h2', {}, 'Data'),
    h('div', { class: 'card row' },
      h('button', { onclick: () => {
        const blob = new Blob([store.exportJSON()], { type: 'application/json' });
        const a = h('a', { href: URL.createObjectURL(blob), download: `quant-prep-progress-${new Date().toISOString().slice(0, 10)}.json` });
        a.click();
      } }, '⬇ Export progress'),
      h('label', { class: 'btn' }, '⬆ Import progress', h('input', { type: 'file', accept: '.json', style: { display: 'none' }, onchange: async (e) => {
        try { store.importJSON(await e.target.files[0].text()); location.reload(); } catch { alert('Invalid progress file.'); }
      } })),
      h('button', { class: 'ghost', onclick: () => { if (confirm('Erase all progress? This cannot be undone.')) { store.reset(); location.reload(); } } }, '🗑 Reset progress'),
      h('span', { class: 'muted small' }, 'Use export/import to move progress between devices.')),
  ].filter(Boolean));
}

function stat(label, value) {
  return h('div', { class: 'stat' }, h('div', { class: 'l' }, label), h('div', { class: 'v' }, String(value)));
}
function row(name, coverage, { n, ok }) {
  const pct = n ? Math.round((100 * ok) / n) : null;
  return h('tr', {}, h('td', {}, name), h('td', {}, coverage), h('td', {}, pct === null ? '—' : `${pct}% (${ok}/${n})`),
    h('td', {}, h('div', { class: 'bar' }, h('span', { style: { width: `${pct || 0}%` } }))));
}
