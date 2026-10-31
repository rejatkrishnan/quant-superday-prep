import { h, store, getParams } from '../lib/util.js';
import { CODING_PROBLEMS } from '../data/coding.js';
import { HARNESS } from '../lib/harness.js';

const PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
const RUN_TIMEOUT_MS = 30000;

// ---------- Pyodide worker management ----------
const WORKER_SRC = `
importScripts(${JSON.stringify(PYODIDE_URL)});
const ready = (async () => {
  const py = await loadPyodide({ indexURL: ${JSON.stringify(PYODIDE_URL.replace(/pyodide\.js$/, ''))} });
  await py.loadPackage(['numpy', 'pandas']);
  return py;
})();
let harnessLoaded = false;
self.onmessage = async (e) => {
  const { id, type, harness, code, tests } = e.data;
  try {
    const py = await ready;
    if (!harnessLoaded) { py.runPython(harness); harnessLoaded = true; }
    if (type === 'init') return self.postMessage({ id, ready: true });
    py.globals.set('_qp_code', code);
    py.globals.set('_qp_tests', tests);
    self.postMessage({ id, result: py.runPython('_qp_run(_qp_code, _qp_tests)') });
  } catch (err) {
    self.postMessage({ id, error: String(err && err.message || err) });
  }
};`;

let worker = null, workerReady = null, msgId = 0;
const pending = new Map();

function startWorker() {
  const url = URL.createObjectURL(new Blob([WORKER_SRC], { type: 'text/javascript' }));
  worker = new Worker(url);
  worker.onmessage = (e) => {
    const p = pending.get(e.data.id);
    if (p) { pending.delete(e.data.id); p.resolve(e.data); }
  };
  worker.onerror = (e) => {
    for (const p of pending.values()) p.resolve({ error: 'Could not start the Python runtime: ' + (e.message || 'unknown error') + '\nThe coding module downloads Pyodide from cdn.jsdelivr.net on first use, so it needs internet access.' });
    pending.clear();
    killWorker();
  };
  workerReady = send({ type: 'init', harness: HARNESS }).then((r) => {
    if (r.error) { killWorker(); throw new Error(r.error); }
    return true;
  });
}
function killWorker() { worker?.terminate(); worker = null; workerReady = null; }
function send(msg) {
  const id = ++msgId;
  return new Promise((resolve) => { pending.set(id, { resolve }); worker.postMessage({ id, ...msg }); });
}

async function runCode(code, tests, status) {
  if (!worker) { status('⏳ Loading Python + NumPy + pandas (first run takes ~10–20 s, then it is cached)…'); startWorker(); }
  await workerReady;
  status('▶ Running tests…');
  const id = msgId + 1;
  const timeout = new Promise((resolve) => setTimeout(() => resolve({ timeout: true }), RUN_TIMEOUT_MS));
  const res = await Promise.race([send({ type: 'run', harness: HARNESS, code, tests: JSON.stringify(tests) }), timeout]);
  if (res.timeout) {
    pending.delete(id);
    killWorker();
    return { error: `Timed out after ${RUN_TIMEOUT_MS / 1000}s — infinite loop or very slow code? The Python runtime was restarted.` };
  }
  if (res.error) return { error: res.error };
  return JSON.parse(res.result);
}

// ---------- UI ----------
export function render(root) {
  const params = getParams();
  let current = null;
  const listEl = h('div', { class: 'card problem-list' });
  const pane = h('div');
  const solvedCount = () => CODING_PROBLEMS.filter((p) => store.state.solved[p.id]).length;
  const header = h('p', { class: 'sub' });

  root.append(
    h('h1', {}, 'Coding: Python · NumPy · pandas · ML'),
    header,
    h('div', { class: 'code-layout' }, listEl, pane),
  );

  function drawHeader() {
    header.replaceChildren(`Quant-flavoured coding drills with auto-graded tests, executed in your browser by Pyodide (real CPython + NumPy + pandas). Solved ${solvedCount()}/${CODING_PROBLEMS.length}. `,
      h('span', { class: 'kbd' }, 'Ctrl'), '+', h('span', { class: 'kbd' }, 'Enter'), ' runs tests; your code autosaves.');
  }

  function drawList() {
    const tracks = [...new Set(CODING_PROBLEMS.map((p) => p.track))];
    listEl.replaceChildren(...tracks.flatMap((t) => [
      h('div', { class: 'track' }, t),
      ...CODING_PROBLEMS.filter((p) => p.track === t).map((p) =>
        h('div', { class: 'item' + (current?.id === p.id ? ' active' : ''), onclick: () => open(p) },
          h('span', {}, store.state.solved[p.id] ? '✅ ' : '', p.title),
          h('span', { class: 'badge d' + p.diff }, ['', 'E', 'M', 'H'][p.diff]))),
    ]));
  }

  function open(p) {
    current = p;
    drawList();
    pane.replaceChildren(codingWidget(p, { onResult: (all) => { if (all) { drawList(); drawHeader(); } } }));
    pane.querySelector('textarea')?.focus();
  }

  drawHeader();
  const byId = CODING_PROBLEMS.find((p) => p.id === params.id);
  const inTrack = CODING_PROBLEMS.filter((p) => !params.track || p.track === params.track);
  open(byId || inTrack.find((p) => !store.state.solved[p.id]) || inTrack[0] || CODING_PROBLEMS[0]);
}

// Self-contained problem card: prompt, editor, run button, results.
// opts.onResult(allPassed, passed, total) after each run; opts.showSolution (default true); opts.extra for recorded attempts.
export function codingWidget(p, opts = {}) {
  const { showSolution = true } = opts;
  const editor = h('textarea', { class: 'code', spellcheck: 'false', autocapitalize: 'off', autocomplete: 'off' });
  editor.value = store.loadCode(p.id) ?? p.starter;
  const status = h('div', { class: 'muted small', style: { marginTop: '8px' } });
  const output = h('div');
  let saveT;
  editor.addEventListener('input', () => { clearTimeout(saveT); saveT = setTimeout(() => store.saveCode(p.id, editor.value), 400); });
  editor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const { selectionStart: s, selectionEnd: en, value } = editor;
      if (e.shiftKey) {
        const lineStart = value.lastIndexOf('\n', s - 1) + 1;
        if (value.slice(lineStart, lineStart + 4) === '    ') {
          editor.value = value.slice(0, lineStart) + value.slice(lineStart + 4);
          editor.selectionStart = editor.selectionEnd = Math.max(lineStart, s - 4);
        }
      } else {
        editor.value = value.slice(0, s) + '    ' + value.slice(en);
        editor.selectionStart = editor.selectionEnd = s + 4;
      }
      editor.dispatchEvent(new Event('input'));
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault(); run();
    } else if (e.key === 'Enter') {
      // keep indentation; add a level after a colon
      e.preventDefault();
      const { selectionStart: s, value } = editor;
      const line = value.slice(value.lastIndexOf('\n', s - 1) + 1, s);
      let indent = line.match(/^\s*/)[0];
      if (/:\s*$/.test(line)) indent += '    ';
      editor.setRangeText('\n' + indent, s, editor.selectionEnd, 'end');
      editor.dispatchEvent(new Event('input'));
    }
  });

  const runBtn = h('button', { class: 'primary', onclick: run }, '▶ Run tests');
  async function run() {
    store.saveCode(p.id, editor.value);
    runBtn.disabled = true;
    output.replaceChildren();
    let res;
    try {
      res = await runCode(editor.value, p.tests, (s) => { status.textContent = s; });
    } catch (err) {
      res = { error: String(err.message || err) };
    }
    runBtn.disabled = false;
    status.textContent = '';
    const parts = [];
    if (res.error) parts.push(h('div', { class: 'feedback wrong' }, h('b', {}, 'Error: '), h('pre', { class: 'out' }, res.error)));
    if (res.results?.length) {
      const passed = res.results.filter((r) => r.ok).length;
      const all = passed === res.results.length;
      parts.push(h('div', { class: 'feedback ' + (all ? 'correct' : 'wrong') },
        h('b', {}, all ? `✓ All ${passed} tests passed!` : `${passed}/${res.results.length} tests passed`),
        ...res.results.map((r) => h('div', { class: 'test-row' }, h('span', { class: r.ok ? 'ok' : 'no' }, r.ok ? '✓' : '✗'),
          h('span', {}, r.name), r.ok ? h('span', { class: 'muted' }, `${r.ms} ms`) : h('span', { class: 'muted' }, r.msg)))));
      store.recordAttempt('coding', p.id, all, opts.extra || {});
      if (all) store.markSolved(p.id);
      opts.onResult?.(all, passed, res.results.length);
    } else {
      opts.onResult?.(false, 0, p.tests.length);
    }
    if (res.stdout) parts.push(h('div', {}, h('div', { class: 'muted small', style: { marginTop: '8px' } }, 'stdout'), h('pre', { class: 'out' }, res.stdout)));
    output.replaceChildren(...parts);
  }

  const solBox = h('div');
  return h('div', { class: 'card' },
    h('div', { class: 'row' }, h('h2', { style: { margin: 0 } }, p.title), h('span', { class: 'badge' }, p.track),
      h('span', { class: 'badge d' + p.diff }, ['', 'easy', 'medium', 'hard'][p.diff])),
    h('p', { class: 'rich', html: p.prompt }),
    editor,
    h('div', { class: 'row', style: { marginTop: '10px' } }, runBtn,
      h('button', { onclick: () => { if (confirm('Reset to starter code? Your code for this problem will be lost.')) { editor.value = p.starter; store.saveCode(p.id, p.starter); } } }, 'Reset'),
      showSolution ? h('button', { class: 'ghost', onclick: () => solBox.replaceChildren(h('details', { open: true }, h('summary', {}, 'Reference solution'), h('pre', { class: 'out' }, p.solution))) }, 'Show solution') : null,
      h('span', { class: 'spacer' }), h('span', { class: 'muted small' }, `${p.tests.length} tests`)),
    status, output, solBox);
}
