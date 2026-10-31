import { h, shuffle, store, gradeNumeric, formatTime, richText, fmt, fill, add } from '../lib/util.js';
import { PROB_QUESTIONS } from '../data/probability.js';
import { BRAINTEASERS } from '../data/brainteasers.js';
import { makeGenerated } from './probability.js';
import { makeSequence } from './sequences.js';
import { makeProblem } from './mentalmath.js';

const FORMATS = {
  quick: { label: 'Quick round · 15 min', minutes: 15, mental: 8, seq: 3, prob: 4, teaser: 2 },
  full: { label: 'Full assessment · 35 min', minutes: 35, mental: 12, seq: 5, prob: 8, teaser: 4 },
  prob: { label: 'Probability gauntlet · 25 min', minutes: 25, mental: 0, seq: 0, prob: 12, teaser: 3 },
};

function buildItems(f) {
  const items = [];
  for (let i = 0; i < f.mental; i++) {
    const p = makeProblem(['mul', 'div', 'pct', 'dec', 'frac', 'big', 'sq']);
    items.push({ section: 'Mental math', q: p.text, ans: p.answer, tol: 0, sol: `= <b>${p.answer}</b>` });
  }
  for (let i = 0; i < f.seq; i++) {
    const s = makeSequence('mixed');
    items.push({ section: 'Pattern recognition', q: `Next term: ${s.shown.join(', ')}, ?`, ans: s.ans, tol: 0, sol: `<b>${s.ans}</b> — ${s.rule}` });
  }
  const unseen = shuffle(PROB_QUESTIONS.filter((q) => !store.seen('probability', q.id)));
  const pool = [...unseen, ...shuffle(PROB_QUESTIONS.filter((q) => store.seen('probability', q.id)))];
  for (let i = 0; i < f.prob; i++) {
    const q = i % 3 === 2 ? makeGenerated() : pool.shift() || makeGenerated();
    items.push({ section: 'Probability & stats', id: q.id, q: q.q, ans: q.ans, tol: q.tol ?? 0.005, sol: q.sol });
  }
  const teasers = shuffle(BRAINTEASERS.filter((b) => typeof b.ans === 'number'));
  for (let i = 0; i < f.teaser && teasers.length; i++) {
    const b = teasers.pop();
    items.push({ section: 'Brainteasers', id: b.id, q: `${b.title}: ${b.q}`, ans: b.ans, tol: b.tol ?? 0, sol: `${b.answer}. ${b.sol}` });
  }
  return items;
}

export function render(root) {
  let timer = null;
  const body = h('div');
  add(root, 
    h('h1', {}, 'Written Test (Online Assessment)'),
    h('p', { class: 'sub' }, 'A timed, mixed written exam across mental math, sequences, probability and brainteasers — like the online assessments many firms send before interviews. No hints and no feedback until the end. Skipped questions count as wrong. For spoken, interviewer-style rounds use Mock Interview.'),
    body,
  );

  function lobby() {
    const mocks = store.state.mocks.slice(-10).reverse();
    fill(body, 
      h('div', { class: 'grid cols-3' }, Object.entries(FORMATS).map(([k, f]) =>
        h('div', { class: 'card tile', onclick: () => start(f) },
          h('div', { class: 'ico' }, k === 'quick' ? '⏱️' : k === 'full' ? '🏁' : '🎲'),
          h('h3', {}, f.label),
          h('div', { class: 'muted small' }, [f.mental && `${f.mental} mental math`, f.seq && `${f.seq} sequences`, f.prob && `${f.prob} probability`, f.teaser && `${f.teaser} brainteasers`].filter(Boolean).join(' · '))))),
      h('div', { class: 'card' }, h('h3', { style: { marginTop: 0 } }, 'Past mocks'),
        mocks.length ? h('table', {}, h('tr', {}, h('th', {}, 'Date'), h('th', {}, 'Format'), h('th', {}, 'Score'), h('th', {}, 'Time')),
          mocks.map((m) => h('tr', {}, h('td', {}, new Date(m.t).toLocaleString()), h('td', {}, m.label), h('td', {}, `${m.correct}/${m.total} (${Math.round((100 * m.correct) / m.total)}%)`), h('td', {}, formatTime(m.secs)))))
          : h('p', { class: 'muted' }, 'No mocks taken yet.')));
  }

  function start(f) {
    const items = buildItems(f);
    const answers = new Array(items.length).fill('');
    const t0 = Date.now();
    const end = t0 + f.minutes * 60000;
    let idx = 0;

    const clock = h('b', {});
    const progress = h('span', { class: 'muted' });
    const qWrap = h('div');
    const nav = h('div', { class: 'row', style: { marginTop: '14px', gap: '4px' } });

    function show(i) {
      idx = i;
      const it = items[i];
      const input = h('input', { type: 'text', class: 'answer', value: answers[i], placeholder: 'answer', autocomplete: 'off' });
      input.addEventListener('input', () => { answers[i] = input.value; drawNav(); });
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { if (i < items.length - 1) show(i + 1); else confirmFinish(); } });
      fill(qWrap, 
        h('div', { class: 'row' }, h('span', { class: 'badge' }, it.section), h('span', { class: 'muted small' }, `Question ${i + 1} of ${items.length}`)),
        h('div', { class: 'question' }, it.q),
        h('div', { class: 'row' }, input,
          h('button', { onclick: () => i > 0 && show(i - 1), disabled: i === 0 }, '← Prev'),
          i < items.length - 1 ? h('button', { class: 'primary', onclick: () => show(i + 1) }, 'Next →') : h('button', { class: 'primary', onclick: confirmFinish }, 'Finish')),
      );
      drawNav();
      input.focus();
    }
    function drawNav() {
      progress.textContent = `${answers.filter((a) => a.trim()).length}/${items.length} answered`;
      fill(nav, ...items.map((_, k) => h('button', {
        class: 'chip' + (k === idx ? ' on' : ''), style: answers[k].trim() ? { borderColor: 'var(--good)' } : {}, onclick: () => show(k),
      }, String(k + 1))));
    }
    function confirmFinish() {
      const blank = answers.filter((a) => !a.trim()).length;
      if (blank && !confirm(`${blank} question(s) unanswered. Finish anyway?`)) return;
      finish();
    }
    function finish() {
      clearInterval(timer); timer = null;
      const secs = (Date.now() - t0) / 1000;
      const graded = items.map((it, k) => ({ ...it, given: answers[k], ok: gradeNumeric(answers[k], it.ans, it.tol) === 'correct' }));
      graded.forEach((g) => { if (g.id) store.recordAttempt(g.section === 'Brainteasers' ? 'brainteasers' : 'probability', g.id, g.ok); });
      const correct = graded.filter((g) => g.ok).length;
      store.recordMock({ label: f.label, correct, total: items.length, secs });
      const sections = [...new Set(graded.map((g) => g.section))];
      fill(body, 
        h('div', { class: 'card' },
          h('h2', { style: { marginTop: 0 } }, `Score: ${correct}/${items.length} (${Math.round((100 * correct) / items.length)}%)`),
          h('p', { class: 'muted' }, `Time used: ${formatTime(secs)} of ${f.minutes}:00`),
          h('div', { class: 'grid cols-4' }, sections.map((s) => {
            const g = graded.filter((x) => x.section === s), ok = g.filter((x) => x.ok).length;
            return h('div', { class: 'stat' }, h('div', { class: 'l' }, s), h('div', { class: 'v' }, `${ok}/${g.length}`),
              h('div', { class: 'bar' }, h('span', { style: { width: `${(100 * ok) / g.length}%` } })));
          })),
          h('div', { class: 'row', style: { marginTop: '14px' } }, h('button', { class: 'primary', onclick: lobby }, 'Back to lobby'))),
        h('div', { class: 'card' }, h('h3', { style: { marginTop: 0 } }, 'Review'),
          ...graded.map((g, k) => h('details', { open: !g.ok, style: { margin: '8px 0' } },
            h('summary', {}, `${g.ok ? '✅' : '❌'} Q${k + 1} · ${g.section}`),
            h('div', { style: { padding: '6px 0 6px 18px' } },
              h('div', {}, g.q),
              h('div', { class: 'muted small' }, `Your answer: ${g.given || '(blank)'} · Correct: ${fmt(g.ans)}`),
              richText(g.sol, 'small'))))),
      );
    }

    fill(body, h('div', { class: 'card' },
      h('div', { class: 'row' }, h('span', {}, '⏱ ', clock), h('span', { class: 'spacer' }), progress,
        h('button', { class: 'ghost', onclick: confirmFinish }, 'Submit exam')),
      h('hr', { style: { border: 0, borderTop: '1px solid var(--border)', margin: '12px 0' } }),
      qWrap, nav));
    const tick = () => {
      const left = (end - Date.now()) / 1000;
      clock.textContent = formatTime(left);
      clock.style.color = left < 60 ? 'var(--bad)' : '';
      if (left <= 0) finish();
    };
    tick();
    timer = setInterval(tick, 500);
    show(0);
  }

  lobby();
  return () => { if (timer) clearInterval(timer); };
}
