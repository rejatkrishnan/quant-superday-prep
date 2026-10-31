import { h, store, sparkline, dayKey, formatTime } from '../lib/util.js';
import { SYLLABUS } from '../data/syllabus.js';
import { PROB_QUESTIONS } from '../data/probability.js';
import { BRAINTEASERS } from '../data/brainteasers.js';
import { CODING_PROBLEMS } from '../data/coding.js';
import { CONCEPTS } from '../data/concepts.js';
import { topicStats, readiness, activityByDay, minutesOn, streakDays, topicOfItem, topicById } from '../lib/mastery.js';
import { planCompletion } from './today.js';

const MODULE_NAMES = {
  today: 'Today', syllabus: 'Syllabus', review: 'Review', progress: 'Progress', mental: 'Mental math', sequences: 'Sequences',
  probability: 'Probability & math', concepts: 'Concepts', brainteasers: 'Brainteasers', coding: 'Coding', market: 'Market making',
  interview: 'Mock interview', superday: 'Written test', cheatsheet: 'Cheat sheet',
};

export function render(root) {
  const s = store.state;
  const act = activityByDay();
  const totalMin = Object.keys(s.time).reduce((a, d) => a + minutesOn(d), 0);
  const acc = (m) => { const a = s.attempts.filter((x) => x.m === m); return { n: a.length, ok: a.filter((x) => x.ok).length }; };
  const classic = s.mental.filter((m) => m.key === 'add,div,mul,sub@120');

  root.append(...[
    h('h1', {}, 'Progress'),
    h('p', { class: 'sub' }, 'Everything you have done, tracked locally: activity, time, accuracy, mastery, interviews and tests.'),
    h('div', { class: 'grid cols-4' },
      stat('Readiness', `${Math.round(100 * readiness())}%`),
      stat('Streak', `${streakDays()} 🔥`),
      stat('Total practice time', `${Math.floor(totalMin / 60)}h ${Math.round(totalMin % 60)}m`),
      stat('Questions answered', s.attempts.length),
      stat('Days practised', Object.keys(act).length),
      stat('Mock interviews', s.interviews.length),
      stat('Written tests', s.mocks.length),
      stat('Mental math best (2 min)', classic.length ? Math.max(...classic.map((m) => m.score)) : '—')),

    h('h2', {}, 'Activity (last 20 weeks)'),
    h('div', { class: 'card' }, heatmap(act), h('div', { class: 'muted small', style: { marginTop: '6px' } }, 'Each square is a day; darker = more reps. Hover for details.')),

    h('div', { class: 'grid cols-2' },
      h('div', { class: 'card' }, h('h3', { style: { marginTop: 0 } }, 'Minutes per day (last 30 days)'), sparkline(lastNDays(30).map((d) => minutesOn(d)), { height: 70 }),
        h('div', { class: 'muted small' }, `Average ${Math.round(lastNDays(7).reduce((a, d) => a + minutesOn(d), 0) / 7)} min/day this week`)),
      h('div', { class: 'card' }, h('h3', { style: { marginTop: 0 } }, 'Daily plan completion (last 30 days)'), sparkline(lastNDays(30).map((d) => 100 * planCompletion(s.daily[d], d)), { height: 70, color: 'var(--good)' }),
        h('div', { class: 'muted small' }, `${lastNDays(30).filter((d) => s.daily[d] && planCompletion(s.daily[d], d) >= 1).length} full plans completed in 30 days`))),

    h('h2', {}, 'Accuracy by area'),
    h('div', { class: 'card' }, h('table', {},
      h('tr', {}, h('th', {}, 'Area'), h('th', {}, 'Coverage'), h('th', {}, 'Accuracy (all time)'), h('th', {}, 'Last 20'), h('th', { style: { width: '25%' } }, '')),
      row('Probability, stats & math', `${seenCount('probability', PROB_QUESTIONS)}/${PROB_QUESTIONS.length}`, acc('probability'), recent('probability')),
      row('Concepts & theory', `${seenCount('concepts', CONCEPTS)}/${CONCEPTS.length}`, acc('concepts'), recent('concepts')),
      row('Brainteasers', `${seenCount('brainteasers', BRAINTEASERS)}/${BRAINTEASERS.length}`, acc('brainteasers'), recent('brainteasers')),
      row('Pattern recognition', `${acc('sequences').n} attempted`, acc('sequences'), recent('sequences')),
      row('Coding', `${CODING_PROBLEMS.filter((p) => s.solved[p.id]).length}/${CODING_PROBLEMS.length} solved`, acc('coding'), recent('coding')))),

    h('h2', {}, 'Mastery by syllabus section'),
    h('div', { class: 'card' }, h('table', {}, SYLLABUS.map((sec) => {
      const m = sec.topics.reduce((a, t) => a + topicStats(t).mastery, 0) / sec.topics.length;
      return h('tr', {}, h('td', {}, h('a', { href: '#/syllabus' }, sec.section)), h('td', { style: { width: '50%' } }, h('div', { class: 'bar' }, h('span', { style: { width: `${100 * m}%` } }))), h('td', {}, `${Math.round(100 * m)}%`));
    }))),

    s.interviews.length ? h('div', { class: 'card' }, h('h3', { style: { marginTop: 0 } }, 'Mock interview scores'), sparkline(s.interviews.slice(-30).map((i) => i.score), { height: 70 }),
      h('table', {}, s.interviews.slice(-6).reverse().map((i) => h('tr', {}, h('td', {}, new Date(i.t).toLocaleDateString()), h('td', {}, i.label), h('td', {}, `${Math.round(i.score)}`))))) : null,
    classic.length > 1 ? h('div', { class: 'card' }, h('h3', { style: { marginTop: 0 } }, 'Mental math trend (classic, 2 min)'), sparkline(classic.slice(-40).map((m) => m.score))) : null,

    h('h2', {}, 'Time by module'),
    h('div', { class: 'card' }, timeByModule()),

    h('h2', {}, 'Recent activity'),
    h('div', { class: 'card' }, activityLog()),

    h('h2', {}, 'Data'),
    h('div', { class: 'card row' },
      h('button', { onclick: () => {
        const blob = new Blob([store.exportJSON()], { type: 'application/json' });
        h('a', { href: URL.createObjectURL(blob), download: `quant-prep-progress-${dayKey()}.json` }).click();
      } }, '⬇ Export progress'),
      h('label', { class: 'btn' }, '⬆ Import progress', h('input', { type: 'file', accept: '.json', style: { display: 'none' }, onchange: async (e) => {
        try { store.importJSON(await e.target.files[0].text()); location.reload(); } catch { alert('Invalid progress file.'); }
      } })),
      h('button', { class: 'ghost', onclick: () => { if (confirm('Erase all progress? This cannot be undone.')) { store.reset(); location.reload(); } } }, '🗑 Reset progress'),
      h('span', { class: 'muted small' }, 'Progress lives in this browser. Export regularly, and import to move between devices.')),
  ].filter(Boolean));

  function seenCount(m, arr) { return arr.filter((x) => store.seen(m, x.id)).length; }
  function recent(m) { const a = s.attempts.filter((x) => x.m === m).slice(-20); return a.length ? `${Math.round((100 * a.filter((x) => x.ok).length) / a.length)}%` : '—'; }
}

function lastNDays(n) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); out.push(dayKey(d.getTime())); }
  return out;
}

function heatmap(act) {
  const weeks = 20, cell = 13, gap = 3;
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${weeks * (cell + gap) + 30} ${7 * (cell + gap) + 4}`);
  svg.setAttribute('width', '100%');
  svg.style.maxWidth = '520px';
  const end = new Date();
  const start = new Date(); start.setDate(end.getDate() - (weeks - 1) * 7 - end.getDay()); // a Sunday, so rows are weekdays
  const max = Math.max(10, ...Object.values(act));
  ['Mon', 'Wed', 'Fri'].forEach((l, k) => {
    const t = document.createElementNS(ns, 'text');
    t.setAttribute('x', 0); t.setAttribute('y', (1 + 2 * k) * (cell + gap) + cell - 2);
    t.setAttribute('font-size', '9'); t.setAttribute('fill', 'var(--muted)'); t.textContent = l;
    svg.append(t);
  });
  for (let d = new Date(start), i = 0; d <= end; d.setDate(d.getDate() + 1), i++) {
    const k = dayKey(d.getTime()), v = act[k] || 0;
    const r = document.createElementNS(ns, 'rect');
    r.setAttribute('x', 30 + Math.floor(i / 7) * (cell + gap)); r.setAttribute('y', (i % 7) * (cell + gap));
    r.setAttribute('width', cell); r.setAttribute('height', cell); r.setAttribute('rx', 2);
    r.setAttribute('fill', v ? `rgba(79,156,249,${0.25 + 0.75 * Math.min(1, v / max)})` : 'var(--panel-2)');
    const title = document.createElementNS(ns, 'title');
    title.textContent = `${k}: ${v} reps, ${Math.round(minutesOn(k))} min`;
    r.append(title); svg.append(r);
  }
  return svg;
}

function timeByModule() {
  const tot = {};
  for (const day of Object.values(store.state.time)) for (const [m, sec] of Object.entries(day)) tot[m] = (tot[m] || 0) + sec;
  const rows = Object.entries(tot).sort((a, b) => b[1] - a[1]);
  if (!rows.length) return h('p', { class: 'muted' }, 'No time tracked yet. Time counts while the tab is visible and you are active.');
  const max = rows[0][1];
  return h('table', {}, rows.map(([m, sec]) => h('tr', {}, h('td', {}, MODULE_NAMES[m] || m),
    h('td', { style: { width: '50%' } }, h('div', { class: 'bar' }, h('span', { style: { width: `${(100 * sec) / max}%` } }))),
    h('td', {}, sec >= 3600 ? `${(sec / 3600).toFixed(1)} h` : `${Math.round(sec / 60)} min`))));
}

function activityLog() {
  const s = store.state;
  const ev = [
    ...s.attempts.slice(-60).map((a) => ({ t: a.t, text: `${a.ok ? '✅' : '❌'} ${MODULE_NAMES[a.m] || a.m}${a.rev ? ' (review)' : ''}${a.iv ? ' (interview)' : ''} — ${topicById(topicOfItem(a.m, a.id))?.name || String(a.id).replace('gen:', 'random: ')}` })),
    ...s.mental.slice(-20).map((m) => ({ t: m.t, text: `⚡ Mental math sprint: ${m.score} in ${formatTime(m.duration)}` })),
    ...s.markets.slice(-20).map((m) => ({ t: m.t, text: `📈 Market (${m.game}): ${m.game === 'fermi' ? `${m.pnl.toFixed(1)}% P&L` : `exp. P&L ${m.exp.toFixed(2)}`}` })),
    ...s.mocks.slice(-10).map((m) => ({ t: m.t, text: `🏁 Written test ${m.label}: ${m.correct}/${m.total}` })),
    ...s.interviews.slice(-10).map((i) => ({ t: i.t, text: `🎤 Mock interview ${i.label}: ${Math.round(i.score)}` })),
  ].sort((a, b) => b.t - a.t).slice(0, 40);
  if (!ev.length) return h('p', { class: 'muted' }, 'Nothing yet — start with Today’s plan.');
  return h('table', {}, ev.map((e) => h('tr', {}, h('td', { class: 'muted small', style: { whiteSpace: 'nowrap' } }, new Date(e.t).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })), h('td', {}, e.text))));
}

function stat(label, value) {
  return h('div', { class: 'stat' }, h('div', { class: 'l' }, label), h('div', { class: 'v' }, String(value)));
}
function row(name, coverage, { n, ok }, last) {
  const pct = n ? Math.round((100 * ok) / n) : null;
  return h('tr', {}, h('td', {}, name), h('td', {}, coverage), h('td', {}, pct === null ? '—' : `${pct}% (${ok}/${n})`), h('td', {}, last),
    h('td', {}, h('div', { class: 'bar' }, h('span', { style: { width: `${pct || 0}%` } }))));
}
