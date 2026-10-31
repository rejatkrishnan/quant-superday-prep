import { clear, store } from './lib/util.js';

const routes = {
  '': () => import('./modules/today.js'),
  syllabus: () => import('./modules/syllabus.js'),
  review: () => import('./modules/review.js'),
  progress: () => import('./modules/dashboard.js'),
  mental: () => import('./modules/mentalmath.js'),
  sequences: () => import('./modules/sequences.js'),
  probability: () => import('./modules/probability.js'),
  concepts: () => import('./modules/concepts.js'),
  brainteasers: () => import('./modules/brainteasers.js'),
  coding: () => import('./modules/coding.js'),
  market: () => import('./modules/market.js'),
  interview: () => import('./modules/interview.js'),
  superday: () => import('./modules/superday.js'),
  cheatsheet: () => import('./modules/cheatsheet.js'),
};

const app = document.getElementById('app');
let cleanup = null;
let current = '';

async function route() {
  const name = location.hash.replace(/^#\/?/, '').split('?')[0];
  current = routes[name] ? name : '';
  const loader = routes[current];
  if (typeof cleanup === 'function') cleanup();
  cleanup = null;
  document.querySelectorAll('.sidebar a[data-route]').forEach((a) => a.classList.toggle('active', a.dataset.route === current));
  document.getElementById('sidebar').classList.remove('open');
  clear(app);
  try {
    const mod = await loader();
    cleanup = mod.render(app) || null;
  } catch (err) {
    console.error(err);
    app.textContent = `Failed to load module: ${err.message}`;
  }
  updateBadges();
  window.scrollTo(0, 0);
}

// Due-review count badge in the sidebar.
async function updateBadges() {
  const { dueItems } = await import('./modules/review.js');
  const n = dueItems().length;
  const el = document.getElementById('reviewBadge');
  if (el) { el.textContent = n ? String(n) : ''; el.style.display = n ? '' : 'none'; }
}

// Practice-time tracking: counts while the tab is visible and the user interacted in the last 90 s.
const TICK = 15;
let lastInput = Date.now();
['keydown', 'pointerdown', 'scroll', 'input'].forEach((ev) => window.addEventListener(ev, () => { lastInput = Date.now(); }, { passive: true, capture: true }));
setInterval(() => {
  if (document.visibilityState === 'visible' && Date.now() - lastInput < 90000) store.addTime(current || 'today', TICK);
}, TICK * 1000);

document.getElementById('menuToggle').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
window.addEventListener('hashchange', route);
route();
