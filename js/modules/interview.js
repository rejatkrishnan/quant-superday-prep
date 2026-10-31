import { h, shuffle, store, gradeNumeric, richText, formatTime, fmt, fill, add } from '../lib/util.js';
import { PROB_QUESTIONS } from '../data/probability.js';
import { BRAINTEASERS } from '../data/brainteasers.js';
import { CONCEPTS } from '../data/concepts.js';
import { CODING_PROBLEMS } from '../data/coding.js';
import { itemScore, topicOfItem, topicById, practiceLink } from '../lib/mastery.js';
import { codingWidget } from './coding.js';

// Round definitions: steps are [kind, filter, count].
export const ROUNDS = {
  phone: { label: 'Phone screen', mins: 30, ico: '📞', desc: 'Short mixed screen: probability, a brainteaser, a stats/ML concept and "why quant".',
    steps: [['prob', { diff: [1, 2] }, 2], ['teaser', { diff: [1, 2] }, 1], ['concept', { topics: ['Inference & Testing', 'Regression', 'Machine Learning'] }, 1], ['concept', { topics: ['Research & Behavioral'] }, 1]] },
  prob: { label: 'Probability & brainteasers', mins: 45, ico: '🎲', desc: 'The classic superday round: harder probability/EV questions with follow-ups.',
    steps: [['prob', { topics: ['Probability', 'Expected Value', 'Conditional & Bayes', 'Combinatorics', 'Stochastic Processes'], diff: [2, 3] }, 4], ['teaser', { diff: [2, 3] }, 1]] },
  stats: { label: 'Statistics & ML', mins: 45, ico: '📊', desc: 'Inference, regression, ML and time-series theory plus numeric stats.',
    steps: [['prob', { topics: ['Statistics'] }, 2], ['concept', { topics: ['Inference & Testing', 'Regression', 'Machine Learning', 'Time Series'] }, 4]] },
  math: { label: 'Math round', mins: 35, ico: '∑', desc: 'Linear algebra, calculus, optimisation and stochastic calculus.',
    steps: [['prob', { topics: ['Linear Algebra', 'Calculus & Optimization'] }, 3], ['concept', { topics: ['Linear Algebra', 'Calculus & Optimization', 'Stochastic Processes'] }, 2]] },
  coding: { label: 'Coding round', mins: 45, ico: '🐍', desc: 'Two live coding problems — no reference solutions.',
    steps: [['coding', { tracks: ['Python', 'NumPy', 'pandas', 'ML & Stats'] }, 2]] },
  finance: { label: 'Markets & finance', mins: 30, ico: '📈', desc: 'Pricing, betting and finance theory.',
    steps: [['prob', { topics: ['Markets & Betting'] }, 2], ['concept', { topics: ['Finance'] }, 3]] },
  research: { label: 'Research & fit', mins: 30, ico: '🔬', desc: 'Research design, backtest skepticism, project deep-dive and behavioral questions.',
    steps: [['concept', { topics: ['Research & Behavioral', 'Time Series'] }, 4]] },
};
export const SUPERDAY = ['prob', 'stats', 'coding', 'research'];

const FOLLOWUPS = {
  Probability: 'How would you sanity-check that number with a quick simulation?',
  'Expected Value': 'Roughly what is the variance? Would you pay the EV to play once?',
  'Conditional & Bayes': 'How does the answer change if the prior doubles?',
  Combinatorics: 'Can you generalise your answer to n?',
  'Stochastic Processes': 'What changes if the walk is biased?',
  Statistics: 'Which assumptions did you rely on, and what breaks if they fail?',
  'Markets & Betting': 'Would you take this at the stated price, and how much would you size it?',
  'Linear Algebra': 'Can you generalise this to n dimensions?',
  'Calculus & Optimization': 'How would you verify this numerically?',
};

// Pick items, preferring weak/unseen ones (with randomness).
function pick(kind, f, n, used) {
  let pool;
  if (kind === 'prob') pool = PROB_QUESTIONS.filter((q) => (!f.topics || f.topics.includes(q.topic)) && (!f.diff || f.diff.includes(q.diff))).map((q) => ({ kind, m: 'probability', item: q }));
  else if (kind === 'teaser') pool = BRAINTEASERS.filter((b) => !f.diff || f.diff.includes(b.diff)).map((b) => ({ kind, m: 'brainteasers', item: b }));
  else if (kind === 'concept') pool = CONCEPTS.filter((c) => !f.topics || f.topics.includes(c.topic)).map((c) => ({ kind, m: 'concepts', item: c }));
  else pool = CODING_PROBLEMS.filter((p) => !f.tracks || f.tracks.includes(p.track)).map((p) => ({ kind, m: 'coding', item: p }));
  pool = pool.filter((x) => !used.has(x.m + x.item.id));
  const ranked = shuffle(pool).sort((a, b) => itemScore(a.m, a.item.id) - itemScore(b.m, b.item.id) + (Math.random() - 0.5) * 0.3);
  const chosen = ranked.slice(0, n);
  chosen.forEach((x) => used.add(x.m + x.item.id));
  return chosen;
}

export function buildRound(key) {
  const used = new Set();
  return ROUNDS[key].steps.flatMap(([kind, f, n]) => pick(kind, f, n, used));
}

const verdict = (s) => (s >= 80 ? ['Strong hire', 'var(--good)'] : s >= 65 ? ['Hire', 'var(--good)'] : s >= 50 ? ['Lean no hire', 'var(--warn)'] : ['No hire', 'var(--bad)']);

export function render(root) {
  let timer = null;
  const body = h('div');
  add(root, h('h1', {}, 'Mock Interview'), h('p', { class: 'sub' },
    'Interviewer-led rounds that mimic a real superday: one question at a time, a round clock, follow-up questions, and a scorecard at the end. Speak your reasoning out loud (record yourself if you can) and use the notes box like a whiteboard. Questions are chosen from your weakest material.'), body);

  function lobby() {
    const hist = store.state.interviews.slice(-12).reverse();
    fill(body, 
      h('div', { class: 'card tile', style: { borderColor: 'var(--accent)' }, onclick: () => runSequence(SUPERDAY) },
        h('div', { class: 'ico' }, '🏛️'), h('h3', {}, 'Full superday (4 rounds, ~2.5 h)'),
        h('div', { class: 'muted small' }, SUPERDAY.map((k) => ROUNDS[k].label).join(' → ') + '. Take breaks between rounds like the real thing.')),
      h('div', { class: 'grid cols-3' }, Object.entries(ROUNDS).map(([k, r]) =>
        h('div', { class: 'card tile', onclick: () => runSequence([k]) }, h('div', { class: 'ico' }, r.ico), h('h3', {}, `${r.label} · ${r.mins} min`), h('div', { class: 'muted small' }, r.desc)))),
      h('div', { class: 'card' }, h('h3', { style: { marginTop: 0 } }, 'Interview history'),
        hist.length ? h('table', {}, h('tr', {}, h('th', {}, 'Date'), h('th', {}, 'Round'), h('th', {}, 'Score'), h('th', {}, 'Verdict'), h('th', {}, 'Time')),
          hist.map((i) => { const [v, c] = verdict(i.score); return h('tr', {}, h('td', {}, new Date(i.t).toLocaleString()), h('td', {}, i.label), h('td', {}, `${Math.round(i.score)}`), h('td', { style: { color: c } }, v), h('td', {}, formatTime(i.secs))); }))
          : h('p', { class: 'muted' }, 'No interviews yet. Start with a phone screen.')),
      h('div', { class: 'card muted small' }, h('b', {}, 'Scoring. '),
        'Numeric questions: 70 points for the right answer (minus 25 if you took a hint) + up to 30 for how clearly you explained it. ',
        'Concept questions: self-graded against the key points (100 / 50 / 0). Coding: share of tests passed. ',
        '≥80 strong hire · 65–80 hire · 50–65 lean no hire · <50 no hire.'),
    );
  }

  function runSequence(keys) {
    const results = [];
    const multi = keys.length > 1;
    const go = (i) => runRound(keys[i], multi ? (res) => {
      results.push(res);
      if (i + 1 < keys.length) breakScreen(keys[i + 1], () => go(i + 1), res);
      else superdaySummary(results);
    } : null, multi ? `Round ${i + 1} of ${keys.length}` : '');
    go(0);
  }

  function breakScreen(nextKey, cont, res) {
    const [v, c] = verdict(res.score);
    fill(body, h('div', { class: 'card' },
      h('h2', { style: { marginTop: 0 } }, `${res.label}: ${Math.round(res.score)} — `, h('span', { style: { color: c } }, v)),
      h('p', { class: 'muted' }, `Next up: ${ROUNDS[nextKey].label} (${ROUNDS[nextKey].mins} min). Take a short break, drink some water.`),
      h('button', { class: 'primary', onclick: cont }, 'Start next round →')));
  }

  function superdaySummary(results) {
    const score = results.reduce((a, r) => a + r.score, 0) / results.length;
    const weakest = Math.min(...results.map((r) => r.score));
    // Like a real hiring committee: one failed round sinks the day regardless of the average.
    const [v, c] = weakest < 50 ? ['No hire', 'var(--bad)'] : verdict(Math.min(score, weakest + 15));
    fill(body, h('div', { class: 'card' },
      h('h2', { style: { marginTop: 0 } }, 'Superday result: ', h('span', { style: { color: c } }, `${v} (${Math.round(score)})`)),
      h('table', {}, results.map((r) => { const [rv, rc] = verdict(r.score); return h('tr', {}, h('td', {}, r.label), h('td', {}, `${Math.round(r.score)}`), h('td', { style: { color: rc } }, rv)); })),
      h('p', { class: 'muted small' }, weakest < 50 ? `Your weakest round scored ${Math.round(weakest)}. One failed round usually means no offer, even with a strong average — fix that round first.` : 'Real superdays are usually decided by the weakest round — the verdict is capped at 15 points above it.'),
      h('button', { class: 'primary', onclick: lobby }, 'Back to lobby')));
  }

  function runRound(key, onDone, prefix) {
    const def = ROUNDS[key];
    const items = buildRound(key);
    const scores = [];
    const t0 = Date.now();
    const clock = h('b', {});
    const head = h('div', { class: 'row' });
    const stage = h('div');
    fill(body, h('div', { class: 'card' }, head, h('hr', { style: { border: 0, borderTop: '1px solid var(--border)', margin: '12px 0' } }), stage));
    const tick = () => {
      const left = def.mins * 60 - (Date.now() - t0) / 1000;
      clock.textContent = left >= 0 ? formatTime(left) : `+${formatTime(-left)} over`;
      clock.style.color = left < 120 ? 'var(--bad)' : '';
    };
    if (timer) clearInterval(timer);
    timer = setInterval(tick, 500); tick();

    const ask = (i) => {
      fill(head, h('span', {}, `${def.ico} ${prefix ? prefix + ' · ' : ''}${def.label}`), h('span', { class: 'muted' }, `Question ${i + 1}/${items.length}`),
        h('span', { class: 'spacer' }), h('span', {}, '⏱ ', clock),
        h('button', { class: 'ghost', onclick: () => { if (confirm('End this round now? Unanswered questions score 0.')) finish(); } }, 'End round'));
      const it = items[i];
      const done = (score) => { scores.push({ m: it.m, id: it.item.id, title: it.item.title || it.item.q, score, topic: topicOfItem(it.m, it.item.id) }); i + 1 < items.length ? ask(i + 1) : finish(); };
      if (it.kind === 'prob' || it.kind === 'teaser') askNumeric(stage, it, done);
      else if (it.kind === 'concept') askConcept(stage, it, done);
      else askCoding(stage, it, done);
    };

    const finish = () => {
      clearInterval(timer); timer = null;
      while (scores.length < items.length) { const it = items[scores.length]; scores.push({ m: it.m, id: it.item.id, title: it.item.title || it.item.q, score: 0, topic: topicOfItem(it.m, it.item.id) }); }
      const score = scores.reduce((a, s) => a + s.score, 0) / scores.length;
      const secs = (Date.now() - t0) / 1000;
      const res = { round: key, label: def.label, score, secs, items: scores.map(({ m, id, score: sc, topic }) => ({ m, id, score: sc, topic })) };
      store.recordInterview(res);
      scorecard(res, scores, () => (onDone ? onDone(res) : lobby()));
    };
    ask(0);
  }

  function scorecard(res, scores, cont) {
    const [v, c] = verdict(res.score);
    const weak = [...new Set(scores.filter((s) => s.score < 60).map((s) => s.topic).filter(Boolean))].map(topicById).filter(Boolean);
    fill(body, h('div', { class: 'card' },
      h('h2', { style: { marginTop: 0 } }, `${res.label} — score ${Math.round(res.score)}: `, h('span', { style: { color: c } }, v)),
      h('p', { class: 'muted' }, `Time used: ${formatTime(res.secs)} of ${ROUNDS[res.round].mins}:00`),
      h('table', {}, h('tr', {}, h('th', {}, 'Question'), h('th', {}, 'Topic'), h('th', {}, 'Score')),
        scores.map((s) => h('tr', {}, h('td', {}, String(s.title).slice(0, 90) + (String(s.title).length > 90 ? '…' : '')),
          h('td', { class: 'muted small' }, topicById(s.topic)?.name || ''),
          h('td', { style: { color: s.score >= 65 ? 'var(--good)' : s.score >= 40 ? 'var(--warn)' : 'var(--bad)' } }, `${Math.round(s.score)}`)))),
      weak.length ? h('div', { class: 'feedback close' }, h('b', {}, 'Work on next: '), ...weak.flatMap((t, k) => [k ? ' · ' : '', h('a', { href: practiceLink(t) }, t.name)]),
        h('div', { class: 'muted small' }, 'Missed items are already in your review queue and these topics will be prioritised in your daily plan.')) : null,
      h('div', { class: 'row', style: { marginTop: '12px' } }, h('button', { class: 'primary', onclick: cont }, 'Continue'))));
  }

  lobby();
  return () => { if (timer) clearInterval(timer); };
}

// ---------- question renderers ----------
function interviewerBubble(text) {
  return h('div', { class: 'feedback info', style: { fontSize: '16px' } }, h('div', { class: 'muted small' }, '🧑‍💼 Interviewer'), text);
}
function notesBox() {
  return h('textarea', { rows: 4, placeholder: 'Scratchpad — write your reasoning as you talk it through…', style: { width: '100%', marginTop: '10px' } });
}

function askNumeric(stage, it, done) {
  const q = it.item;
  const isTeaser = it.kind === 'teaser';
  const text = isTeaser ? `${q.title}: ${q.q}` : q.q;
  const auto = typeof q.ans === 'number';
  let hinted = false, correct = null;
  const t0 = Date.now();
  const fb = h('div');
  const input = h('input', { type: 'text', class: 'answer', placeholder: auto ? 'your answer' : '', autocomplete: 'off' });

  const afterAnswer = (verdictCls, headline) => {
    const follow = isTeaser ? 'Can you generalise your solution, or explain why it is optimal?' : FOLLOWUPS[q.topic];
    fill(fb, ...[
      h('div', { class: 'feedback ' + verdictCls }, h('b', {}, headline), richText(isTeaser ? `${q.answer}. ${q.sol}` : q.sol)),
      follow ? interviewerBubble(`Follow-up: ${follow}`) : null,
      h('div', { class: 'card', style: { marginTop: '10px' } },
        h('b', {}, 'Rate your explanation (be honest — clarity is half the interview):'),
        h('div', { class: 'row', style: { marginTop: '8px' } },
          [['Clear & structured', 30], ['OK, some gaps', 15], ['Messy / guessed', 0]].map(([l, pts]) =>
            h('button', { onclick: () => done((correct ? (hinted ? 45 : 70) : 0) + pts) }, l)))),
    ].filter(Boolean));
    controls.remove();
  };

  const submit = () => {
    const g = gradeNumeric(input.value, q.ans, q.tol ?? (isTeaser ? 0 : 0.005));
    if (g === 'invalid') return;
    if (g === 'close') return fill(fb, h('div', { class: 'feedback close' }, '“Close — can you be more precise?”'));
    correct = g === 'correct';
    store.recordAttempt(it.m, q.id, correct, { ms: Date.now() - t0, hint: hinted, iv: true });
    afterAnswer(correct ? 'correct' : 'wrong', correct ? '✓ Correct' : `✗ The answer is ${fmt(q.ans)}`);
  };
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
  const selfGrade = (ok) => { correct = ok; store.recordAttempt(it.m, q.id, ok, { ms: Date.now() - t0, iv: true }); afterAnswer(ok ? 'correct' : 'wrong', ok ? 'You said you got it' : 'Missed'); };

  const controls = h('div', { class: 'row', style: { marginTop: '10px' } },
    auto ? [input, h('button', { class: 'primary', onclick: submit }, 'Answer')]
      : [h('button', { class: 'primary', onclick: () => { fill(fb, h('div', { class: 'feedback info' }, h('b', {}, 'Answer: '), q.answer, h('div', { class: 'row', style: { marginTop: '8px' } }, h('button', { onclick: () => selfGrade(true) }, '✓ I had it'), h('button', { onclick: () => selfGrade(false) }, '✗ I didn’t')))); } }, 'Done — check answer')],
    !isTeaser && q.hint ? h('button', { onclick: (e) => { hinted = true; e.target.disabled = true; fill(fb, interviewerBubble(`Hint: ${q.hint}`)); } }, 'Ask for a hint (−25)') : null,
    h('button', { class: 'ghost', onclick: () => { correct = false; store.recordAttempt(it.m, q.id, false, { ms: Date.now() - t0, iv: true }); afterAnswer('wrong', 'Skipped'); } }, 'I don’t know'));

  fill(stage, interviewerBubble(text), notesBox(), controls, fb);
  if (auto) input.focus();
}

function askConcept(stage, it, done) {
  const c = it.item;
  const t0 = Date.now();
  const fb = h('div');
  const reveal = h('button', { class: 'primary', onclick: () => {
    reveal.remove();
    fill(fb, ...[
      c.f?.length ? h('div', {}, ...c.f.map((x) => interviewerBubble(h('span', { html: `Follow-up: ${x}` })))) : null,
      h('div', { class: 'feedback info' }, h('b', {}, 'Key points a strong answer covers'), h('div', { class: 'rich', html: c.a })),
      h('div', { class: 'row', style: { marginTop: '10px' } }, h('span', { class: 'muted' }, 'Grade yourself:'),
        h('button', { onclick: () => grade('good', 100) }, '✓ Hit the key points'),
        h('button', { onclick: () => grade('again', 50) }, '◐ Partial'),
        h('button', { onclick: () => grade('again', 0) }, '✗ Missed')),
    ].filter(Boolean));
  } }, 'I’ve answered — show follow-ups & key points');
  const grade = (g, pts) => { store.recordAttempt('concepts', c.id, g, { ms: Date.now() - t0, iv: true }); done(pts); };
  fill(stage, interviewerBubble(c.q), notesBox(), h('div', { class: 'row', style: { marginTop: '10px' } }, reveal), fb);
}

function askCoding(stage, it, done) {
  let best = 0;
  const widget = codingWidget(it.item, { showSolution: false, extra: { iv: true }, onResult: (all, passed, total) => { best = Math.max(best, total ? (100 * passed) / total : 0); status.textContent = `Best so far: ${Math.round(best)}% of tests`; } });
  const status = h('span', { class: 'muted' }, 'Run your tests before submitting.');
  fill(stage, interviewerBubble('Please solve this problem. Talk me through your approach and complexity before you code.'), widget,
    h('div', { class: 'row', style: { marginTop: '10px' } }, h('button', { class: 'primary', onclick: () => done(best) }, 'Submit solution →'), status));
}
