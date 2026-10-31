// Shared helpers: DOM, RNG, answer parsing, persistence.

// ---------- DOM ----------
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

// Safe versions of replaceChildren/append/prepend: flatten nested arrays and drop null/undefined/false,
// which the native methods would otherwise render as "[object …]" or "null".
const kidsOf = (kids) => kids.flat(Infinity).filter((k) => k !== null && k !== undefined && k !== false);
export function fill(el, ...kids) { el.replaceChildren(...kidsOf(kids)); return el; }
export function add(el, ...kids) { el.append(...kidsOf(kids)); return el; }
export function addFirst(el, ...kids) { el.prepend(...kidsOf(kids)); return el; }

export function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }

// ---------- Random ----------
export const randInt = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
export const choice = (arr) => arr[Math.floor(Math.random() * arr.length)];
export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- Math ----------
export function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; }
export function comb(n, k) {
  if (k < 0 || k > n) return 0;
  k = Math.min(k, n - k);
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return Math.round(r);
}
export function factorial(n) { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; }
export function fracStr(num, den) {
  const g = gcd(num, den);
  num /= g; den /= g;
  return den === 1 ? `${num}` : `${num}/${den}`;
}
export function fmt(x, digits = 4) {
  if (!isFinite(x)) return String(x);
  if (Number.isInteger(x)) return x.toLocaleString('en-US');
  return Number(x.toPrecision(digits + 2)).toString();
}

// ---------- Safe expression parser ----------
// Accepts answers like "1/6", "0.1667", "16.67%", "2^10", "sqrt(2/pi)", "1 - (5/6)^4", "e^-3", "3,990".
export function parseAnswer(input) {
  if (input === null || input === undefined) return NaN;
  let s = String(input).trim().toLowerCase().replace(/,/g, '').replace(/×/g, '*').replace(/÷/g, '/').replace(/\s+/g, '');
  if (!s) return NaN;
  let i = 0;
  const peek = () => s[i];
  const eat = (c) => (s[i] === c ? (i++, true) : false);
  function number() {
    const m = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/.exec(s.slice(i));
    if (!m) throw new Error('number');
    // Don't let "e" from "2e" swallow Euler's constant without digits.
    i += m[0].length;
    return parseFloat(m[0]);
  }
  const funcs = { sqrt: Math.sqrt, ln: Math.log, log: Math.log, exp: Math.exp, abs: Math.abs, log10: Math.log10, log2: Math.log2 };
  function atom() {
    if (eat('(')) { const v = expr(); if (!eat(')')) throw new Error(')'); return v; }
    const fm = /^(sqrt|log10|log2|ln|log|exp|abs)\(/.exec(s.slice(i));
    if (fm) { i += fm[1].length; const f = funcs[fm[1]]; eat('('); const v = expr(); if (!eat(')')) throw new Error(')'); return f(v); }
    if (s.startsWith('pi', i)) { i += 2; return Math.PI; }
    if (s.startsWith('π', i)) { i += 1; return Math.PI; }
    if (peek() === 'e' && !/\d/.test(s[i + 1] || '')) { i += 1; return Math.E; }
    return number();
  }
  function postfix() {
    let v = atom();
    for (;;) {
      if (eat('%')) v /= 100;
      else if (eat('!')) { if (v < 0 || v > 170 || !Number.isInteger(v)) throw new Error('!'); v = factorial(v); }
      else break;
    }
    return v;
  }
  function unary() {
    if (eat('-')) return -unary();
    if (eat('+')) return unary();
    return power();
  }
  function power() {
    const b = postfix();
    if (eat('^') || (s.startsWith('**', i) && (i += 2))) return Math.pow(b, unary());
    return b;
  }
  function term() {
    let v = unary();
    for (;;) {
      if (s.startsWith('**', i)) break;
      if (eat('*')) v *= unary();
      else if (eat('/')) v /= unary();
      else if (i < s.length && (peek() === '(' || /[a-zπ]/.test(peek())) && !/^e[+-]?\d/.test(s.slice(i))) v *= unary(); // implicit mult: 2pi, 3(4)
      else break;
    }
    return v;
  }
  function expr() {
    let v = term();
    for (;;) {
      if (eat('+')) v += term();
      else if (eat('-')) v -= term();
      else break;
    }
    return v;
  }
  try {
    const v = expr();
    if (i !== s.length) return NaN;
    return v;
  } catch { return NaN; }
}

// Returns 'correct' | 'close' | 'wrong' | 'invalid'
export function gradeNumeric(input, answer, tol = 0.005) {
  const v = parseAnswer(input);
  if (!isFinite(v)) return 'invalid';
  const err = Math.abs(v - answer);
  const scale = Math.max(Math.abs(answer), 1e-12);
  if (err <= 1e-9 || err / scale <= tol) return 'correct';
  if (err / scale <= 0.05) return 'close';
  return 'wrong';
}

// ---------- Persistence ----------
const KEY = 'quantprep.v1';
function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
function normalize(st) {
  st.attempts ||= [];
  st.mental ||= [];
  st.solved ||= {};
  st.review ||= {};
  st.markets ||= [];
  st.mocks ||= [];
  st.interviews ||= [];
  st.time ||= {};
  st.daily ||= {};
  st.settings ||= { intensity: 'standard', interviewDate: '' };
  return st;
}
let state = normalize(load());

function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage full or disabled */ } }

// Local calendar day, e.g. "2026-10-31".
export function dayKey(ts = Date.now()) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Spaced-repetition intervals (days) per Leitner box.
const BOX_DAYS = [0, 1, 3, 7, 16, 35];

export const store = {
  get state() { return state; },
  // grade: true/false, or 'again' | 'good' | 'easy' for self-graded cards.
  recordAttempt(module, id, grade, extra = {}) {
    const correct = grade === true || grade === 'good' || grade === 'easy';
    state.attempts.push({ m: module, id, ok: correct, t: Date.now(), ...extra });
    if (state.attempts.length > 20000) state.attempts = state.attempts.slice(-20000);
    // Spaced repetition for curated items: missed -> due again now, correct -> pushed further out each time.
    if (id && !String(id).startsWith('gen:')) {
      const key = `${module}:${id}`;
      const prev = state.review[key];
      const r = prev || { box: 0, due: 0 };
      if (!correct) r.box = 0;
      else if (!prev) r.box = grade === 'easy' ? 3 : 2; // right first time: skip the short intervals
      else r.box = Math.min(r.box + (grade === 'easy' ? 2 : 1), 5);
      r.due = Date.now() + BOX_DAYS[r.box] * 864e5;
      r.missed = !correct;
      r.n = (r.n || 0) + 1;
      r.last = Date.now();
      state.review[key] = r;
    }
    save();
  },
  recordMental(entry) { state.mental.push({ ...entry, t: Date.now() }); save(); },
  recordMarket(entry) { state.markets.push({ ...entry, t: Date.now() }); save(); },
  recordMock(entry) { state.mocks.push({ ...entry, t: Date.now() }); save(); },
  recordInterview(entry) { state.interviews.push({ ...entry, t: Date.now() }); save(); },
  markSolved(id) { state.solved[id] = Date.now(); save(); },
  // Ids of items whose review is due. module omitted -> "module:id" keys across all modules.
  dueReview(module) {
    const now = Date.now();
    const due = Object.entries(state.review).filter(([, r]) => r.due <= now).map(([k]) => k);
    if (!module) return due;
    return due.filter((k) => k.startsWith(module + ':')).map((k) => k.slice(module.length + 1));
  },
  seen(module, id) { return !!state.review[`${module}:${id}`]; },
  reviewState(module, id) { return state.review[`${module}:${id}`]; },
  addTime(module, sec) {
    const d = dayKey();
    state.time[d] ||= {};
    state.time[d][module] = (state.time[d][module] || 0) + sec;
    save();
  },
  setSetting(k, v) { state.settings[k] = v; save(); },
  setDaily(day, plan) { state.daily[day] = plan; save(); },
  exportJSON() { return JSON.stringify(state, null, 2); },
  importJSON(text) { state = normalize(JSON.parse(text)); save(); },
  reset() { state = normalize({}); save(); },
  saveCode(id, code) { state.code ||= {}; state.code[id] = code; save(); },
  loadCode(id) { return state.code?.[id]; },
};

// Query params from the hash route, e.g. "#/probability?topic=Calculus".
export function getParams() {
  const q = location.hash.split('?')[1] || '';
  return Object.fromEntries(new URLSearchParams(q));
}

// ---------- Timer ----------
export function formatTime(sec) {
  sec = Math.max(0, Math.round(sec));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

// ---------- Tiny SVG sparkline ----------
export function sparkline(values, { width = 320, height = 60, color = 'var(--accent)' } = {}) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', height);
  svg.setAttribute('class', 'spark');
  if (values.length < 2) return svg;
  const lo = Math.min(...values), hi = Math.max(...values);
  const span = hi - lo || 1;
  const pts = values.map((v, k) => [
    4 + (k * (width - 8)) / (values.length - 1),
    height - 4 - ((v - lo) * (height - 8)) / span,
  ]);
  const path = document.createElementNS(ns, 'polyline');
  path.setAttribute('points', pts.map((p) => p.join(',')).join(' '));
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', color);
  path.setAttribute('stroke-width', '2');
  path.setAttribute('stroke-linejoin', 'round');
  svg.append(path);
  const last = pts[pts.length - 1];
  const dot = document.createElementNS(ns, 'circle');
  dot.setAttribute('cx', last[0]); dot.setAttribute('cy', last[1]); dot.setAttribute('r', 3.5);
  dot.setAttribute('fill', color);
  svg.append(dot);
  return svg;
}

// Render a solution/explanation block (trusted, authored HTML from our data files).
export function richText(html, cls = '') { return h('div', { class: `rich ${cls}`, html }); }
