import { h, store, dayKey } from '../lib/util.js';
import { ALL_TOPICS } from '../data/syllabus.js';
import { topicStats, topicOfItem, practiceLink, readiness, streakDays, minutesOn, activityByDay, sourceItems } from '../lib/mastery.js';
import { dueItems } from './review.js';

const MULT = { light: 0.6, standard: 1, intense: 1.6 };
const PLAN_VERSION = 2;
// Topics practised by dedicated daily tasks rather than "focus" slots.
const NON_FOCUS = new Set(['mental', 'sequences', 'market', 'interviews', 'written', 'py', 'numpy', 'pandas', 'ml-code']);
const CODING_TOPICS = ['py', 'numpy', 'pandas', 'ml-code'];

const daysSince = (arr) => (arr.length ? (Date.now() - arr[arr.length - 1].t) / 864e5 : Infinity);

export function daysToInterview() {
  const d = store.state.settings.interviewDate;
  if (!d) return null;
  const target = new Date(d + 'T00:00:00');
  const today = new Date(dayKey() + 'T00:00:00');
  return Math.round((target - today) / 864e5);
}

function buildPlan() {
  const s = store.state;
  const intensity = s.settings.intensity || 'standard';
  const m = MULT[intensity];
  const left = daysToInterview();
  const r = (x, min = 1) => Math.max(min, Math.round(x * m));
  const tasks = [];

  const due = dueItems().length;
  if (due) tasks.push({ kind: 'review', title: 'Clear your spaced-repetition review queue', target: Math.min(due, r(20, 5)), link: '#/review' });
  tasks.push({ kind: 'mental', title: 'Mental math sprints (2 min each)', target: r(2), link: '#/mental' });
  tasks.push({ kind: 'sequences', title: 'Pattern-recognition sequences', target: r(10, 5), link: '#/sequences' });

  // Focus on the weakest syllabus topics that still have unmastered material.
  const ranked = ALL_TOPICS.filter((t) => !NON_FOCUS.has(t.id))
    .map((t) => ({ t, st: topicStats(t) }))
    .filter((x) => x.st.mastery < 0.95)
    .sort((a, b) => a.st.mastery - b.st.mastery);
  const nFocus = intensity === 'light' ? 1 : intensity === 'intense' ? 3 : 2;
  for (const { t } of ranked.slice(0, nFocus)) {
    const remaining = t.sources.flatMap(sourceItems).filter((it) => !store.reviewState(it.m, it.id) || store.reviewState(it.m, it.id).box < 4).length;
    tasks.push({ kind: 'focus', topic: t.id, title: `Focus: ${t.name}`, sub: t.section, target: Math.max(1, Math.min(remaining, r(5, 3))), link: practiceLink(t) });
  }

  const codeTopic = CODING_TOPICS.map((id) => ALL_TOPICS.find((t) => t.id === id)).sort((a, b) => topicStats(a).mastery - topicStats(b).mastery)[0];
  tasks.push({ kind: 'coding', title: `Coding problem (${codeTopic.name})`, target: intensity === 'intense' ? 2 : 1, link: practiceLink(codeTopic) });
  tasks.push({ kind: 'teaser', title: 'Brainteaser', target: intensity === 'light' ? 1 : 2, link: '#/brainteasers' });
  if (intensity !== 'light') tasks.push({ kind: 'market', title: 'Market-making reps', target: r(2), link: '#/market' });

  const sinceInterview = daysSince(s.interviews);
  if (sinceInterview >= 6 || (left !== null && left <= 14 && sinceInterview >= 2)) {
    tasks.push({ kind: 'interview', title: 'Mock interview round', sub: 'Talk out loud as if an interviewer is listening', target: 1, link: '#/interview' });
  } else if (daysSince(s.mocks) >= 7) {
    tasks.push({ kind: 'written', title: 'Timed written test', target: 1, link: '#/superday' });
  }
  return { v: PLAN_VERSION, intensity, tasks, created: Date.now() };
}

export function getPlan() {
  const day = dayKey();
  let plan = store.state.daily[day];
  if (!plan || plan.v !== PLAN_VERSION || plan.intensity !== (store.state.settings.intensity || 'standard')) {
    plan = buildPlan();
    store.setDaily(day, plan);
  }
  return plan;
}

// Live progress for a task, computed from today's recorded activity.
export function taskProgress(task, day = dayKey()) {
  const s = store.state;
  const today = (arr) => arr.filter((x) => dayKey(x.t) === day);
  const att = today(s.attempts);
  switch (task.kind) {
    case 'review': return att.filter((a) => a.rev).length;
    case 'mental': return today(s.mental).length;
    case 'sequences': return att.filter((a) => a.m === 'sequences').length;
    case 'focus': return att.filter((a) => !a.rev && topicOfItem(a.m, a.id) === task.topic).length;
    case 'coding': return new Set(att.filter((a) => a.m === 'coding').map((a) => a.id)).size;
    case 'teaser': return att.filter((a) => a.m === 'brainteasers' && !a.rev).length;
    case 'market': return today(s.markets).length;
    case 'interview': return today(s.interviews).length;
    case 'written': return today(s.mocks).length;
    default: return 0;
  }
}

export function planCompletion(plan, day) {
  if (!plan?.tasks?.length) return 0;
  return plan.tasks.reduce((a, t) => a + Math.min(1, taskProgress(t, day) / t.target), 0) / plan.tasks.length;
}

export function render(root) {
  const plan = getPlan();
  const s = store.state;
  const left = daysToInterview();
  const done = planCompletion(plan);
  const due = dueItems().length;

  const settings = h('div', { class: 'card' },
    h('div', { class: 'row' },
      h('span', { class: 'muted' }, 'Daily intensity:'),
      Object.entries({ light: 'Light (~30 min)', standard: 'Standard (~60 min)', intense: 'Intense (~2 h)' }).map(([k, l]) =>
        h('button', { class: 'chip' + ((s.settings.intensity || 'standard') === k ? ' on' : ''), onclick: () => { store.setSetting('intensity', k); rerender(); } }, l)),
      h('span', { class: 'spacer' }),
      h('label', { class: 'muted' }, 'Interview date: ',
        h('input', { type: 'date', value: s.settings.interviewDate || '', onchange: (e) => { store.setSetting('interviewDate', e.target.value); rerender(); } }))));

  const nextTask = plan.tasks.find((t) => taskProgress(t) < t.target);

  root.append(...[
    h('h1', {}, `Today · ${new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}`),
    h('p', { class: 'sub' }, 'Your plan is generated each morning from your weakest syllabus topics, your review queue and how close your interview is. Tasks tick off automatically as you practise.'),
    left !== null ? h('div', { class: 'card', style: { borderColor: left <= 7 ? 'var(--warn)' : 'var(--border)' } },
      left > 0 ? h('div', {}, h('b', { style: { fontSize: '20px' } }, `${left} day${left === 1 ? '' : 's'} until your interview. `),
        h('span', { class: 'muted' }, left <= 7 ? 'Final stretch: prioritise review, mock interviews and sleep — not new material.' : left <= 21 ? 'Mock interviews are now scheduled every few days.' : 'Build coverage now; the plan shifts to mocks as the date approaches.'))
        : left === 0 ? h('b', {}, '🍀 Interview day! Light warm-up only: one mental math sprint and a few review cards.')
          : h('span', { class: 'muted' }, 'Your interview date has passed — set a new one above.')) : null,
    settings,
    h('div', { class: 'grid cols-4' },
      stat('Today’s plan', `${Math.round(100 * done)}%`, h('div', { class: 'bar' }, h('span', { style: { width: `${100 * done}%` } }))),
      stat('Streak', `${streakDays()} 🔥`),
      stat('Practice time today', `${Math.round(minutesOn(dayKey()))} min`),
      stat('Interview readiness', `${Math.round(100 * readiness())}%`, h('a', { href: '#/syllabus', class: 'small' }, 'see syllabus →'))),
    h('div', { class: 'card', style: { marginTop: '16px' } },
      h('div', { class: 'row' }, h('h2', { style: { margin: 0 } }, 'Daily plan'), h('span', { class: 'spacer' }),
        nextTask ? h('a', { class: 'btn primary', href: nextTask.link, style: { background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' } }, `▶ Continue: ${nextTask.title}`) : h('span', { class: 'badge ok' }, '🎉 All done for today!')),
      h('table', { style: { marginTop: '10px' } }, plan.tasks.map((t) => {
        const p = taskProgress(t), complete = p >= t.target;
        return h('tr', {},
          h('td', { style: { width: '28px', fontSize: '18px' } }, complete ? '✅' : '⬜'),
          h('td', {}, h('div', { style: complete ? { color: 'var(--muted)', textDecoration: 'line-through' } : {} }, t.title), t.sub ? h('div', { class: 'muted small' }, t.sub) : null),
          h('td', { style: { width: '30%' } }, h('div', { class: 'bar' }, h('span', { style: { width: `${Math.min(100, (100 * p) / t.target)}%` } })), h('div', { class: 'muted small' }, `${Math.min(p, t.target)} / ${t.target}`)),
          h('td', { style: { width: '90px' } }, h('a', { class: 'btn', href: t.link }, complete ? 'More' : 'Start')));
      }))),
    h('div', { class: 'grid cols-2', style: { marginTop: '16px' } },
      weekCard(), weakCard()),
    due ? h('p', { class: 'muted small' }, `${due} item(s) are due for review in total.`) : null,
  ].filter(Boolean));

  function rerender() { root.replaceChildren(); render(root); }
}

function stat(label, value, extra) {
  return h('div', { class: 'stat' }, h('div', { class: 'l' }, label), h('div', { class: 'v' }, value), extra || null);
}

function weekCard() {
  const act = activityByDay();
  const days = [];
  for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push(d); }
  return h('div', { class: 'card' }, h('h3', { style: { marginTop: 0 } }, 'Last 7 days'),
    h('table', {}, days.map((d) => {
      const k = dayKey(d.getTime());
      const plan = store.state.daily[k];
      const pct = plan ? Math.round(100 * planCompletion(plan, k)) : null;
      return h('tr', {}, h('td', {}, d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })),
        h('td', { class: 'small' }, `${act[k] || 0} reps`), h('td', { class: 'small' }, `${Math.round(minutesOn(k))} min`),
        h('td', { class: 'small' }, pct === null ? h('span', { class: 'muted' }, '—') : pct >= 100 ? '✅ plan done' : `${pct}% of plan`));
    })));
}

function weakCard() {
  const ranked = ALL_TOPICS.map((t) => ({ t, st: topicStats(t) })).sort((a, b) => a.st.mastery - b.st.mastery).slice(0, 6);
  return h('div', { class: 'card' }, h('h3', { style: { marginTop: 0 } }, 'Weakest topics'),
    h('table', {}, ranked.map(({ t, st }) => h('tr', {},
      h('td', {}, t.name, h('div', { class: 'muted small' }, t.section)),
      h('td', { style: { width: '30%' } }, h('div', { class: 'bar' }, h('span', { style: { width: `${100 * st.mastery}%` } }))),
      h('td', {}, h('a', { href: practiceLink(t) }, 'practice'))))),
    h('a', { href: '#/syllabus', class: 'small' }, 'Full syllabus →'));
}
