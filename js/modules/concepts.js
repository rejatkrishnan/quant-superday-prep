import { h, shuffle, store, getParams, formatTime, fill, add } from '../lib/util.js';
import { CONCEPTS } from '../data/concepts.js';

const TOPICS = [...new Set(CONCEPTS.map((c) => c.topic))];

export function render(root) {
  const params = getParams();
  let topic = TOPICS.includes(params.topic) ? params.topic : 'All';
  let mode = params.mode === 'due' ? 'due' : 'learn';
  let queue = [];

  const controls = h('div', { class: 'card' });
  const card = h('div', { class: 'card' });
  const list = h('div', { class: 'card' });
  add(root, 
    h('h1', {}, 'Concepts & Theory'),
    h('p', { class: 'sub' }, `${CONCEPTS.length} "explain this" questions covering stochastic processes, inference, regression, linear algebra, optimisation, ML, time series, finance, Python, and research/behavioral. Answer out loud or in writing before revealing, then grade yourself honestly. Cards come back on a spaced-repetition schedule.`),
    controls, card, list,
  );

  function drawControls() {
    const due = store.dueReview('concepts').length;
    const pool = CONCEPTS.filter((c) => topic === 'All' || c.topic === topic);
    const seen = pool.filter((c) => store.seen('concepts', c.id)).length;
    fill(controls, 
      h('div', { class: 'row' }, h('span', { class: 'muted' }, 'Mode:'),
        [['learn', 'Learn (new first)'], ['due', `Review due (${due})`]].map(([k, l]) =>
          h('button', { class: 'chip' + (mode === k ? ' on' : ''), onclick: () => { mode = k; rebuild(); } }, l)),
        h('span', { class: 'spacer' }), h('span', { class: 'muted small' }, `Seen ${seen}/${pool.length}`)),
      h('div', { class: 'row', style: { marginTop: '10px' } }, h('span', { class: 'muted' }, 'Topic:'),
        ['All', ...TOPICS].map((t) => h('button', { class: 'chip' + (topic === t ? ' on' : ''), onclick: () => { topic = t; rebuild(); } }, t))),
    );
  }

  function rebuild() {
    const pool = CONCEPTS.filter((c) => topic === 'All' || c.topic === topic);
    if (mode === 'due') {
      const ids = new Set(store.dueReview('concepts'));
      queue = shuffle(pool.filter((c) => ids.has(c.id)));
    } else {
      queue = [...shuffle(pool.filter((c) => !store.seen('concepts', c.id))), ...shuffle(pool.filter((c) => store.seen('concepts', c.id)))];
    }
    drawControls();
    drawList(pool);
    next();
  }

  function drawList(pool) {
    fill(list, h('h3', { style: { marginTop: 0 } }, 'All cards in this set'),
      h('table', {}, h('tr', {}, h('th', {}, 'Question'), h('th', {}, 'Topic'), h('th', {}, 'Status')),
        pool.map((c) => {
          const r = store.reviewState('concepts', c.id);
          return h('tr', { style: { cursor: 'pointer' }, onclick: () => { showConcept(card, c, refresh, next); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
            h('td', {}, c.q), h('td', { class: 'muted small' }, c.topic),
            h('td', {}, statusBadge(r)));
        })));
  }
  const refresh = () => { drawControls(); drawList(CONCEPTS.filter((c) => topic === 'All' || c.topic === topic)); };

  function next() {
    const c = queue.shift();
    if (!c) {
      fill(card, h('p', {}, mode === 'due' ? '🎉 No cards due. Come back tomorrow — or switch to Learn mode.' : 'You have been through every card in this set.'),
        h('button', { class: 'primary', onclick: rebuild }, 'Start over'));
      return;
    }
    showConcept(card, c, refresh, next);
  }

  rebuild();
}

export function statusBadge(r) {
  if (!r) return h('span', { class: 'muted' }, 'new');
  if (r.missed) return h('span', { style: { color: 'var(--bad)' } }, 'missed');
  if (r.due <= Date.now()) return h('span', { style: { color: 'var(--warn)' } }, 'due');
  return h('span', { class: 'badge ok' }, `box ${r.box}`);
}

// Flashcard UI (also used by Review). opts.extra is merged into the recorded attempt.
export function showConcept(card, c, onResult, onNext, opts = {}) {
  let done = false;
  const t0 = Date.now();
  const clock = h('span', { class: 'muted small' }, '0:00');
  const iv = setInterval(() => { if (!card.isConnected || done) return clearInterval(iv); clock.textContent = formatTime((Date.now() - t0) / 1000); }, 1000);
  const notes = h('textarea', { rows: 4, placeholder: 'Your answer — bullet the key points (or say them out loud), then reveal.', style: { width: '100%', marginTop: '6px' } });
  const fb = h('div');

  const grade = (g) => {
    if (done) return;
    done = true;
    clearInterval(iv);
    store.recordAttempt('concepts', c.id, g, { ms: Date.now() - t0, ...(opts.extra || {}) });
    onResult?.(g);
    onNext();
  };
  const reveal = () => {
    fill(fb, h('div', { class: 'feedback info' },
      h('b', {}, 'Key points'), h('div', { class: 'rich', html: c.a }),
      c.f?.length ? h('div', { style: { marginTop: '8px' } }, h('b', {}, 'Likely follow-ups'), h('ul', {}, c.f.map((x) => h('li', { html: x })))) : null,
      h('div', { class: 'row', style: { marginTop: '10px' } }, h('span', { class: 'muted' }, 'How did you do?'),
        h('button', { onclick: () => grade('again') }, '✗ Missed / partial'),
        h('button', { onclick: () => grade('good') }, '✓ Got the key points'),
        h('button', { onclick: () => grade('easy') }, '★ Easy'))));
    revealBtn.remove();
  };
  const revealBtn = h('button', { class: 'primary', onclick: reveal }, 'Reveal key points');

  fill(card, 
    h('div', { class: 'row' }, h('span', { class: 'badge' }, c.topic), h('span', { class: 'badge d' + c.diff }, ['', 'easy', 'medium', 'hard'][c.diff]),
      h('span', { class: 'spacer' }), clock),
    h('div', { class: 'question' }, c.q), notes,
    h('div', { class: 'row', style: { marginTop: '8px' } }, revealBtn), fb);
  notes.focus();
}
