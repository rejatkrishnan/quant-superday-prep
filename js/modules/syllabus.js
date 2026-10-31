import { h } from '../lib/util.js';
import { SYLLABUS } from '../data/syllabus.js';
import { topicStats, readiness, practiceLink } from '../lib/mastery.js';

const STATUS_COLOR = { 'Not started': 'var(--muted)', Learning: 'var(--bad)', Reviewing: 'var(--warn)', Mastered: 'var(--good)' };

export function render(root) {
  const r = readiness();
  const all = SYLLABUS.flatMap((s) => s.topics.map(topicStats));
  const counts = { 'Not started': 0, Learning: 0, Reviewing: 0, Mastered: 0 };
  all.forEach((t) => counts[t.status]++);

  root.append(
    h('h1', {}, 'Syllabus & Coverage'),
    h('p', { class: 'sub' }, 'Everything a quant research interview can test, mapped to practice material in this app. Mastery comes from spaced-repetition performance: items you answer correctly over increasing gaps count more than items you saw once.'),
    h('div', { class: 'grid cols-4' },
      h('div', { class: 'stat' }, h('div', { class: 'l' }, 'Overall readiness'), h('div', { class: 'v' }, `${Math.round(100 * r)}%`),
        h('div', { class: 'bar' }, h('span', { style: { width: `${100 * r}%` } }))),
      ...Object.entries(counts).map(([k, n]) => h('div', { class: 'stat' }, h('div', { class: 'l' }, k), h('div', { class: 'v', style: { color: STATUS_COLOR[k] } }, `${n}`), h('div', { class: 'muted small' }, 'topics')))),
    ...SYLLABUS.map((sec) => {
      const stats = sec.topics.map(topicStats);
      const secM = stats.reduce((a, s) => a + s.mastery, 0) / stats.length;
      return h('div', { class: 'card', style: { marginTop: '16px' } },
        h('div', { class: 'row' }, h('h2', { style: { margin: 0 } }, sec.section), h('span', { class: 'spacer' }),
          h('span', { class: 'muted' }, `${Math.round(100 * secM)}%`)),
        h('table', { style: { marginTop: '8px' } },
          h('tr', {}, h('th', {}, 'Topic'), h('th', {}, 'Coverage'), h('th', { style: { width: '28%' } }, 'Mastery'), h('th', {}, 'Status'), h('th', {}, '')),
          sec.topics.map((t, i) => {
            const s = stats[i];
            return h('tr', {},
              h('td', {}, h('div', {}, t.name), h('div', { class: 'muted small' }, t.why)),
              h('td', { class: 'small' }, s.kind === 'items' ? `${s.seen}/${s.total} items` : `${s.seen}/${s.total} sessions`),
              h('td', {}, h('div', { class: 'bar' }, h('span', { style: { width: `${100 * s.mastery}%` } })), h('div', { class: 'muted small' }, `${Math.round(100 * s.mastery)}%`)),
              h('td', { style: { color: STATUS_COLOR[s.status], whiteSpace: 'nowrap' } }, s.status),
              h('td', {}, h('a', { class: 'btn', href: practiceLink(t) }, 'Practice')));
          })));
    }),
    h('div', { class: 'card muted small', style: { marginTop: '16px' } },
      h('b', {}, 'How mastery is computed. '),
      'Each question/card sits in a spaced-repetition box. Never seen = 0, missed = 20%, then 50% → 65% → 80% → 100% as you keep answering it correctly at longer intervals. Coding problems count when all tests pass. Activity topics (mental math, sequences, markets, mocks) combine volume and recent accuracy. A topic is "Mastered" at 80%.'),
  );
}
