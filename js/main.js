import { clear } from './lib/util.js';

const routes = {
  '': () => import('./modules/dashboard.js'),
  mental: () => import('./modules/mentalmath.js'),
  sequences: () => import('./modules/sequences.js'),
  probability: () => import('./modules/probability.js'),
  brainteasers: () => import('./modules/brainteasers.js'),
  coding: () => import('./modules/coding.js'),
  market: () => import('./modules/market.js'),
  superday: () => import('./modules/superday.js'),
  cheatsheet: () => import('./modules/cheatsheet.js'),
};

const app = document.getElementById('app');
let cleanup = null;

async function route() {
  const name = location.hash.replace(/^#\/?/, '').split('?')[0];
  const loader = routes[name] || routes[''];
  if (typeof cleanup === 'function') cleanup();
  cleanup = null;
  document.querySelectorAll('.sidebar a[data-route]').forEach((a) => a.classList.toggle('active', a.dataset.route === name));
  document.getElementById('sidebar').classList.remove('open');
  clear(app);
  try {
    const mod = await loader();
    cleanup = mod.render(app) || null;
  } catch (err) {
    console.error(err);
    app.textContent = `Failed to load module: ${err.message}`;
  }
  window.scrollTo(0, 0);
}

document.getElementById('menuToggle').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
window.addEventListener('hashchange', route);
route();
