// Mastery & coverage calculations over the syllabus.
import { store, dayKey } from './util.js';
import { ALL_TOPICS } from '../data/syllabus.js';
import { PROB_QUESTIONS } from '../data/probability.js';
import { CONCEPTS } from '../data/concepts.js';
import { CODING_PROBLEMS } from '../data/coding.js';
import { BRAINTEASERS } from '../data/brainteasers.js';

const ITEM_SOURCES = new Set(['probability', 'concepts', 'coding', 'brainteasers']);

// Items (module + id) covered by a source.
export function sourceItems(src) {
  switch (src.m) {
    case 'probability': return PROB_QUESTIONS.filter((q) => q.topic === src.topic).map((q) => ({ m: 'probability', id: q.id }));
    case 'concepts': return CONCEPTS.filter((c) => c.topic === src.topic).map((c) => ({ m: 'concepts', id: c.id }));
    case 'coding': return CODING_PROBLEMS.filter((p) => p.track === src.track).map((p) => ({ m: 'coding', id: p.id }));
    case 'brainteasers': return BRAINTEASERS.map((b) => ({ m: 'brainteasers', id: b.id }));
    default: return [];
  }
}

// "module:id" -> topic id
const ITEM_TOPIC = new Map();
for (const t of ALL_TOPICS) for (const s of t.sources) for (const it of sourceItems(s)) ITEM_TOPIC.set(`${it.m}:${it.id}`, t.id);
export const topicOfItem = (m, id) => ITEM_TOPIC.get(`${m}:${id}`);
export const topicById = (id) => ALL_TOPICS.find((t) => t.id === id);

// 0..1 mastery of a single item based on its spaced-repetition box (or solved state for coding).
export function itemScore(m, id) {
  if (m === 'coding') {
    if (store.state.solved[id]) return 1;
    return store.state.attempts.some((a) => a.m === 'coding' && a.id === id) ? 0.2 : 0;
  }
  const r = store.reviewState(m, id);
  if (!r) return 0;
  if (r.missed) return 0.2;
  return [0.2, 0.5, 0.65, 0.8, 1, 1][r.box] ?? 0;
}

function countSource(src) {
  const s = store.state;
  switch (src.m) {
    case 'mental': return { n: s.mental.length, acc: 1 };
    case 'sequences': {
      const a = s.attempts.filter((x) => x.m === 'sequences').slice(-100);
      return { n: s.attempts.filter((x) => x.m === 'sequences').length, acc: a.length ? a.filter((x) => x.ok).length / a.length : 0 };
    }
    case 'market': return { n: s.markets.length, acc: 1 };
    case 'interviews': return { n: s.interviews.length, acc: s.interviews.length ? avg(s.interviews.slice(-5).map((i) => i.score / 100)) : 0 };
    case 'mocks': return { n: s.mocks.length, acc: s.mocks.length ? avg(s.mocks.slice(-5).map((m) => m.correct / m.total)) : 0 };
    default: return { n: 0, acc: 0 };
  }
}
const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;

// { mastery 0..1, seen, total, status, kind }
export function topicStats(topic) {
  let wsum = 0, msum = 0, seen = 0, total = 0;
  for (const src of topic.sources) {
    if (ITEM_SOURCES.has(src.m)) {
      const items = sourceItems(src);
      for (const it of items) {
        const sc = itemScore(it.m, it.id);
        msum += sc; wsum += 1; total += 1;
        if (sc > 0) seen += 1;
      }
    } else {
      const { n, acc } = countSource(src);
      const progress = Math.min(1, n / src.target);
      // Volume and quality both matter for activity-based topics.
      msum += 10 * progress * (0.5 + 0.5 * acc); wsum += 10;
      seen += Math.min(n, src.target); total += src.target;
    }
  }
  const mastery = wsum ? msum / wsum : 0;
  const status = mastery < 0.05 ? 'Not started' : mastery < 0.5 ? 'Learning' : mastery < 0.8 ? 'Reviewing' : 'Mastered';
  return { mastery, seen, total, status, kind: topic.sources.some((s) => ITEM_SOURCES.has(s.m)) ? 'items' : 'activity' };
}

export function readiness() {
  const stats = ALL_TOPICS.map(topicStats);
  return avg(stats.map((s) => s.mastery));
}

export function practiceLink(topic) {
  const s = topic.sources[0];
  switch (s.m) {
    case 'probability': return `#/probability?topic=${encodeURIComponent(s.topic)}`;
    case 'concepts': return `#/concepts?topic=${encodeURIComponent(s.topic)}`;
    case 'coding': return `#/coding?track=${encodeURIComponent(s.track)}`;
    case 'interviews': return '#/interview';
    case 'mocks': return '#/superday';
    default: return `#/${s.m}`;
  }
}

// ----- activity helpers -----
export function attemptsOn(day) { return store.state.attempts.filter((a) => dayKey(a.t) === day); }

// Count of all recorded activity per day (attempts + sprints + markets + tests + interview rounds).
export function activityByDay() {
  const s = store.state, out = {};
  const add = (t, k = 1) => { const d = dayKey(t); out[d] = (out[d] || 0) + k; };
  s.attempts.forEach((a) => add(a.t));
  s.mental.forEach((m) => add(m.t, 5));
  s.markets.forEach((m) => add(m.t, 2));
  s.mocks.forEach((m) => add(m.t, 10));
  s.interviews.forEach((m) => add(m.t, 10));
  return out;
}

export function minutesOn(day) {
  const t = store.state.time[day] || {};
  return Object.values(t).reduce((a, b) => a + b, 0) / 60;
}

export function streakDays() {
  const act = activityByDay();
  let n = 0;
  const d = new Date();
  if (!act[dayKey(d)]) d.setDate(d.getDate() - 1); // streak survives until the end of today
  while (act[dayKey(d)]) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
