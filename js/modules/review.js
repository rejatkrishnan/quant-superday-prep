import { h, store } from '../lib/util.js';
import { PROB_QUESTIONS } from '../data/probability.js';
import { BRAINTEASERS } from '../data/brainteasers.js';
import { CONCEPTS } from '../data/concepts.js';
import { showQuestion } from './probability.js';
import { showTeaser } from './brainteasers.js';
import { showConcept } from './concepts.js';
import { topicOfItem, topicById } from '../lib/mastery.js';

const LOOKUP = {
  probability: new Map(PROB_QUESTIONS.map((q) => [q.id, q])),
  brainteasers: new Map(BRAINTEASERS.map((b) => [b.id, b])),
  concepts: new Map(CONCEPTS.map((c) => [c.id, c])),
};

// All due items across modules, most overdue (and previously missed) first.
export function dueItems() {
  return store.dueReview()
    .map((key) => {
      const i = key.indexOf(':');
      const m = key.slice(0, i), id = key.slice(i + 1);
      const item = LOOKUP[m]?.get(id);
      return item ? { m, id, item, r: store.state.review[key] } : null;
    })
    .filter(Boolean)
    .sort((a, b) => (Number(!!b.r.missed) - Number(!!a.r.missed)) || (a.r.due - b.r.due));
}

export function render(root) {
  const head = h('div', { class: 'card' });
  const card = h('div', { class: 'card' });
  let queue = dueItems();
  const total = queue.length;
  let done = 0, ok = 0;

  root.append(
    h('h1', {}, 'Review'),
    h('p', { class: 'sub' }, 'Everything due for spaced repetition — probability & math questions, brainteasers and concept cards — in one queue. Missed items come back immediately; correct ones return after 1 → 3 → 7 → 16 → 35 days.'),
    head, card,
  );

  function drawHead() {
    const counts = {};
    queue.forEach((q) => { counts[q.m] = (counts[q.m] || 0) + 1; });
    head.replaceChildren(h('div', { class: 'row' },
      h('b', {}, `${done}/${total} reviewed`), h('span', { class: 'muted' }, `· ${ok} correct`),
      h('span', { class: 'spacer' }),
      ...Object.entries(counts).map(([m, n]) => h('span', { class: 'badge' }, `${m}: ${n} left`))),
    h('div', { class: 'bar', style: { marginTop: '10px' } }, h('span', { style: { width: `${total ? (100 * done) / total : 100}%` } })));
  }

  function next() {
    drawHead();
    const it = queue.shift();
    if (!it) {
      const upcoming = Object.values(store.state.review).filter((r) => r.due > Date.now() && r.due < Date.now() + 864e5).length;
      card.replaceChildren(h('h2', { style: { marginTop: 0 } }, total ? '✅ Review complete!' : '🎉 Nothing due right now'),
        h('p', { class: 'muted' }, `${upcoming} item(s) become due in the next 24 hours. New material is in the Today plan.`),
        h('a', { class: 'btn', href: '#/' }, '← Back to Today'));
      return;
    }
    const topic = topicById(topicOfItem(it.m, it.id));
    const onResult = (g) => { done++; if (g === true || g === 'good' || g === 'easy') ok++; };
    const extra = { rev: true };
    if (it.m === 'probability') showQuestion(card, it.item, onResult, next, { module: 'probability', extra });
    else if (it.m === 'brainteasers') showTeaser(card, it.item, onResult, next, { extra });
    else showConcept(card, it.item, onResult, next, { extra });
    if (topic) card.prepend(h('div', { class: 'muted small', style: { marginBottom: '6px' } }, `🔁 Review · ${topic.section} › ${topic.name}${it.r.missed ? ' · previously missed' : ''}`));
  }

  next();
}
