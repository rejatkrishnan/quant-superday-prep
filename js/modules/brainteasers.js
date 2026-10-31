import { h, shuffle, store, gradeNumeric, richText, formatTime, getParams } from '../lib/util.js';
import { BRAINTEASERS } from '../data/brainteasers.js';

export function render(root) {
  let diff = getParams().mode === 'review' ? 'review' : 'All';
  let queue = [];
  const controls = h('div', { class: 'card' });
  const card = h('div', { class: 'card' });
  const list = h('div', { class: 'card' });
  root.append(
    h('h1', {}, 'Brainteasers & Logic Puzzles'),
    h('p', { class: 'sub' }, 'Classic interview teasers. Think out loud as if an interviewer is listening: state assumptions, try small cases, look for invariants and symmetry. Numeric ones auto-grade; others you self-grade after revealing.'),
    controls, card, list,
  );

  function drawControls() {
    const due = store.dueReview('brainteasers').length;
    controls.replaceChildren(h('div', { class: 'row' },
      h('span', { class: 'muted' }, 'Difficulty:'),
      [['All', 'All'], ['1', 'Easy'], ['2', 'Medium'], ['3', 'Hard'], ['review', `Review due (${due})`]].map(([k, l]) =>
        h('button', { class: 'chip' + (diff === k ? ' on' : ''), onclick: () => { diff = k; rebuild(); } }, l))));
  }

  function rebuild() {
    let pool;
    if (diff === 'review') { const ids = new Set(store.dueReview('brainteasers')); pool = BRAINTEASERS.filter((b) => ids.has(b.id)); }
    else pool = BRAINTEASERS.filter((b) => diff === 'All' || b.diff === Number(diff));
    queue = [...shuffle(pool.filter((b) => !store.seen('brainteasers', b.id))), ...shuffle(pool.filter((b) => store.seen('brainteasers', b.id)))];
    drawControls();
    drawList(pool);
    next();
  }

  function drawList(pool) {
    list.replaceChildren(h('h3', { style: { marginTop: 0 } }, 'All puzzles in this set'),
      h('table', {}, h('tr', {}, h('th', {}, 'Puzzle'), h('th', {}, 'Level'), h('th', {}, 'Status')),
        pool.map((b) => {
          const r = store.state.review['brainteasers:' + b.id];
          return h('tr', { style: { cursor: 'pointer' }, onclick: () => { queue = queue.filter((x) => x !== b); showTeaser(card, b, () => { drawControls(); drawList(pool); }, next); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
            h('td', {}, b.title), h('td', {}, h('span', { class: 'badge d' + b.diff }, ['', 'easy', 'medium', 'hard'][b.diff])),
            h('td', {}, !r ? h('span', { class: 'muted' }, '—') : r.missed ? h('span', { style: { color: 'var(--bad)' } }, 'missed') : h('span', { class: 'badge ok' }, 'solved')));
        })));
  }

  function next() {
    const b = queue.shift();
    if (!b) { card.replaceChildren(h('p', {}, 'All done for this filter! 🎉'), h('button', { class: 'primary', onclick: rebuild }, 'Shuffle again')); return; }
    showTeaser(card, b, () => { drawControls(); drawList(BRAINTEASERS.filter((x) => diff === 'All' || x.diff === Number(diff))); }, next);
  }

  rebuild();
}

export function showTeaser(card, b, onResult, onNext, opts = {}) {
  let done = false;
  const t0 = Date.now();
  const fb = h('div');
  const clock = h('span', { class: 'muted small' }, '0:00');
  const iv = setInterval(() => { if (!card.isConnected || done) return clearInterval(iv); clock.textContent = formatTime((Date.now() - t0) / 1000); }, 1000);

  const record = (ok) => {
    if (done) return;
    done = true;
    clearInterval(iv);
    store.recordAttempt('brainteasers', b.id, ok, { ms: Date.now() - t0, ...(opts.extra || {}) });
    onResult?.(ok);
  };
  const reveal = (verdict) => {
    fb.replaceChildren(h('div', { class: 'feedback ' + (verdict || 'info') },
      verdict === 'correct' ? h('b', {}, '✓ Correct! ') : verdict === 'wrong' ? h('b', {}, '✗ Not quite. ') : null,
      h('div', {}, h('b', {}, 'Answer: '), b.answer),
      h('div', { style: { marginTop: '6px' } }, richText(b.sol)),
      !done ? h('div', { class: 'row', style: { marginTop: '10px' } }, h('span', { class: 'muted' }, 'Did you get it?'),
        h('button', { onclick: () => { record(true); onNext(); } }, '✓ Got it'),
        h('button', { onclick: () => { record(false); onNext(); } }, '✗ Missed it'))
        : h('div', { style: { marginTop: '10px' } }, h('button', { class: 'primary', onclick: onNext }, 'Next puzzle →'))));
  };

  const parts = [
    h('div', { class: 'row' }, h('b', {}, b.title), h('span', { class: 'badge d' + b.diff }, ['', 'easy', 'medium', 'hard'][b.diff]),
      ...b.tags.map((t) => h('span', { class: 'badge' }, t)), h('span', { class: 'spacer' }), clock),
    h('div', { class: 'question' }, b.q),
  ];
  if (typeof b.ans === 'number') {
    const input = h('input', { type: 'text', class: 'answer', placeholder: 'numeric answer', autocomplete: 'off' });
    const submit = () => {
      if (done) return onNext();
      const g = gradeNumeric(input.value, b.ans, b.tol ?? 0);
      if (g === 'invalid') return;
      record(g === 'correct');
      reveal(g === 'correct' ? 'correct' : 'wrong');
    };
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
    parts.push(h('div', { class: 'row' }, input, h('button', { class: 'primary', onclick: submit }, 'Submit'), h('button', { class: 'ghost', onclick: () => reveal() }, 'Reveal')));
    card.replaceChildren(...parts, fb);
    input.focus();
  } else {
    parts.push(h('div', { class: 'row' }, h('button', { class: 'primary', onclick: () => reveal() }, 'Reveal answer')),
      h('p', { class: 'muted small' }, 'Work it out (paper or out loud), then reveal and grade yourself honestly.'));
    card.replaceChildren(...parts, fb);
  }
}
