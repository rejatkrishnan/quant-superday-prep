import { h, randInt, shuffle, store, fmt, fill, add, addFirst } from '../lib/util.js';
import { FERMI } from '../data/fermi.js';

export function render(root) {
  let game = 'fermi';
  const tabs = h('div', { class: 'row' });
  const body = h('div');
  add(root, 
    h('h1', {}, 'Market Making'),
    h('p', { class: 'sub' }, 'Trading-style interviews ask you to "make a market": quote a bid and an ask. The interviewer trades against you when you are wrong, then you update. Practice quoting tight, honest markets and adjusting to flow.'),
    h('div', { class: 'card' }, tabs), body,
  );
  function drawTabs() {
    fill(tabs, 
      h('button', { class: 'chip' + (game === 'fermi' ? ' on' : ''), onclick: () => { game = 'fermi'; drawTabs(); fermiGame(body); } }, '🌍 Estimation markets'),
      h('button', { class: 'chip' + (game === 'dice' ? ' on' : ''), onclick: () => { game = 'dice'; drawTabs(); diceGame(body); } }, '🎲 Dice-sum market'),
    );
  }
  drawTabs();
  fermiGame(body);
}

// ---------------- Estimation market ----------------
const WIDTHS = { tight: 1.25, normal: 2, wide: 4 };

function fermiGame(body) {
  let deck = shuffle(FERMI);
  let widthKey = 'normal';
  const settings = h('div', { class: 'card' });
  const card = h('div', { class: 'card' });
  const hist = h('div', { class: 'card' });
  fill(body, settings, card, hist);

  function drawSettings() {
    fill(settings, 
      h('div', { class: 'row' }, h('span', { class: 'muted' }, 'Max width (ask ÷ bid):'),
        Object.entries(WIDTHS).map(([k, v]) => h('button', { class: 'chip' + (widthKey === k ? ' on' : ''), onclick: () => { widthKey = k; drawSettings(); } }, `${k} (≤ ${v}×)`))),
      h('p', { class: 'muted small', style: { marginBottom: 0 } },
        'Round 1: quote a market. The interviewer buys at your ask if the truth is above your mid, otherwise sells at your bid. Round 2: re-quote using that information. ',
        'P&L per trade = edge vs. the true value (as % of it). Markets must respect the width limit — tight and right wins.'));
  }

  function drawHistory() {
    const rows = store.state.markets.filter((m) => m.game === 'fermi').slice(-8).reverse();
    const all = store.state.markets.filter((m) => m.game === 'fermi');
    const avg = all.length ? all.reduce((s, m) => s + m.pnl, 0) / all.length : 0;
    fill(hist, h('h3', { style: { marginTop: 0 } }, `History (${all.length} markets · avg P&L ${avg.toFixed(1)}%)`),
      rows.length ? h('table', {}, h('tr', {}, h('th', {}, 'Question'), h('th', {}, 'Truth'), h('th', {}, 'R1'), h('th', {}, 'R2'), h('th', {}, 'P&L')),
        rows.map((m) => h('tr', {}, h('td', {}, m.q), h('td', {}, fmt(m.truth)), h('td', {}, m.r1), h('td', {}, m.r2),
          h('td', { style: { color: m.pnl >= 0 ? 'var(--good)' : 'var(--bad)' } }, `${m.pnl.toFixed(1)}%`))))
        : h('p', { class: 'muted' }, 'No markets yet.'));
  }

  function play() {
    if (!deck.length) deck = shuffle(FERMI);
    const item = deck.pop();
    const maxRatio = WIDTHS[widthKey];
    let round = 1;
    const quotes = [];
    const bid = h('input', { type: 'text', class: 'answer', placeholder: 'bid', style: { width: '160px' } });
    const ask = h('input', { type: 'text', class: 'answer', placeholder: 'ask', style: { width: '160px' } });
    const log = h('div');
    const btn = h('button', { class: 'primary', onclick: submit }, 'Quote');
    [bid, ask].forEach((el) => el.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); }));
    const roundLabel = h('b', {}, 'Round 1');

    function submit() {
      const b = parseFloat(bid.value.replace(/,/g, '')), a = parseFloat(ask.value.replace(/,/g, ''));
      if (!(b > 0 && a > 0)) return add(log, h('div', { class: 'feedback info' }, 'Enter positive numbers for bid and ask.'));
      if (a <= b) return add(log, h('div', { class: 'feedback info' }, 'Ask must be above bid.'));
      if (a / b > maxRatio + 1e-9) return add(log, h('div', { class: 'feedback close' }, `Too wide: ask/bid = ${(a / b).toFixed(2)} > ${maxRatio}. Tighten up!`));
      const mid = (a + b) / 2;
      const buy = item.v > mid;
      const pnl = buy ? ((a - item.v) / item.v) * 100 : ((item.v - b) / item.v) * 100;
      quotes.push({ b, a, buy, pnl });
      if (round === 1) {
        add(log, h('div', { class: 'feedback info' }, `${fmt(b)} @ ${fmt(a)} — interviewer: "${buy ? `I buy at ${fmt(a)}` : `I sell at ${fmt(b)}`}." Now update your market.`));
        round = 2;
        roundLabel.textContent = 'Round 2 (after the trade)';
        bid.value = ''; ask.value = '';
        bid.focus();
      } else {
        const total = quotes[0].pnl + quotes[1].pnl;
        const contained = quotes.map((q) => q.b <= item.v && item.v <= q.a);
        add(log, h('div', { class: 'feedback ' + (total >= 0 ? 'correct' : 'wrong') },
          h('div', {}, `${fmt(b)} @ ${fmt(a)} — interviewer: "${buy ? `I buy at ${fmt(a)}` : `I sell at ${fmt(b)}`}."`),
          h('div', { style: { fontSize: '18px', margin: '6px 0' } }, 'True value: ', h('b', {}, fmt(item.v))),
          rangeViz(quotes, item.v),
          h('div', {}, `Round 1 P&L: ${quotes[0].pnl.toFixed(1)}% ${contained[0] ? '(contained truth)' : '(missed)'} · Round 2 P&L: ${quotes[1].pnl.toFixed(1)}% ${contained[1] ? '(contained truth)' : '(missed)'}`),
          h('div', {}, h('b', {}, `Total: ${total.toFixed(1)}%`)),
          h('div', { class: 'muted small', style: { marginTop: '6px' } }, quotes[0].buy === quotes[1].buy && !contained[0]
            ? 'Tip: after being lifted/hit you can shift your whole market further — a trade against you is information.'
            : 'Tip: use the trade direction from round 1 to shift and tighten your round-2 market.')));
        store.recordMarket({ game: 'fermi', id: item.id, q: item.q, truth: item.v, pnl: total,
          r1: `${fmt(quotes[0].b)}–${fmt(quotes[0].a)}`, r2: `${fmt(b)}–${fmt(a)}` });
        btn.textContent = 'Next question →';
        btn.onclick = play;
        drawHistory();
      }
    }

    fill(card, h('div', { class: 'question' }, '📣 Make me a market on: ', h('b', {}, item.q)),
      h('div', { class: 'row' }, roundLabel),
      h('div', { class: 'row', style: { marginTop: '8px' } }, bid, h('span', {}, '@'), ask, btn), log);
    bid.focus();
  }

  drawSettings();
  drawHistory();
  play();
}

function rangeViz(quotes, truth) {
  const lo = Math.min(truth, ...quotes.map((q) => q.b)) * 0.9, hi = Math.max(truth, ...quotes.map((q) => q.a)) * 1.1;
  const x = (v) => `${(100 * (Math.log(v) - Math.log(lo))) / (Math.log(hi) - Math.log(lo))}%`;
  const wrap = h('div');
  quotes.forEach((q, i) => {
    const viz = h('div', { class: 'range-viz', title: `Round ${i + 1}` },
      h('div', { class: 'band', style: { left: x(q.b), width: `calc(${x(q.a)} - ${x(q.b)})` } }),
      h('div', { class: 'truth', style: { left: x(truth) } }));
    add(wrap, h('div', { class: 'muted small' }, `Round ${i + 1} (green = truth, log scale)`), viz);
  });
  return wrap;
}

// ---------------- Dice-sum market ----------------
function diceGame(body) {
  let nDice = 3, maxWidth = 2;
  const settings = h('div', { class: 'card' });
  const card = h('div', { class: 'card' });
  const hist = h('div', { class: 'card' });
  fill(body, settings, card, hist);

  function drawSettings() {
    fill(settings, 
      h('div', { class: 'row' }, h('span', { class: 'muted' }, 'Dice:'),
        [2, 3, 4, 5].map((n) => h('button', { class: 'chip' + (nDice === n ? ' on' : ''), onclick: () => { nDice = n; drawSettings(); play(); } }, String(n))),
        h('span', { class: 'muted', style: { marginLeft: '12px' } }, 'Max width:'),
        [1, 2, 3].map((w) => h('button', { class: 'chip' + (maxWidth === w ? ' on' : ''), onclick: () => { maxWidth = w; drawSettings(); play(); } }, String(w)))),
      h('p', { class: 'muted small', style: { marginBottom: 0 } },
        'Hidden dice are rolled. Make a market on their SUM. After each quote one die is revealed and you quote again. ',
        'A perfectly informed counterparty buys from you if fair value > your ask and sells to you if fair value < your bid (1 lot each). ',
        'At the end everything settles at the actual sum. Expected P&L measures your skill; realised P&L includes luck.'));
  }

  function drawHistory() {
    const all = store.state.markets.filter((m) => m.game === 'dice');
    const avg = all.length ? all.reduce((s, m) => s + m.exp, 0) / all.length : 0;
    fill(hist, h('h3', { style: { marginTop: 0 } }, 'Dice-market history'),
      all.length ? h('p', {}, `${all.length} games · average expected P&L per game: `, h('b', {}, avg.toFixed(2)),
        ' (0 is perfect — you can\'t make money against a perfectly informed trader, only avoid losing it).')
        : h('p', { class: 'muted' }, 'No games yet.'));
  }

  function play() {
    const dice = Array.from({ length: nDice }, () => randInt(1, 6));
    let revealed = 0, expPnl = 0;
    const trades = []; // {side: +1 you bought / -1 you sold, price}
    const diceRow = h('div', { class: 'dice' });
    const log = h('div');
    const bid = h('input', { type: 'text', class: 'answer', placeholder: 'bid', style: { width: '120px' } });
    const ask = h('input', { type: 'text', class: 'answer', placeholder: 'ask', style: { width: '120px' } });
    const btn = h('button', { class: 'primary', onclick: submit }, 'Quote');
    [bid, ask].forEach((el) => el.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); }));
    const posEl = h('span', { class: 'muted' });

    const drawDice = () => {
      fill(diceRow, ...dice.map((d, i) => h('div', { class: 'die ' + (i < revealed ? 'shown' : 'hidden') }, i < revealed ? String(d) : '?')));
      const pos = trades.reduce((s, t) => s + t.side, 0);
      posEl.textContent = `Position: ${pos > 0 ? '+' : ''}${pos} · expected P&L so far: ${expPnl.toFixed(2)}`;
    };

    function submit() {
      const b = parseFloat(bid.value), a = parseFloat(ask.value);
      if (!isFinite(b) || !isFinite(a) || a < b) return addFirst(log, h('div', { class: 'feedback info' }, 'Enter a bid ≤ ask.'));
      if (a - b > maxWidth + 1e-9) return addFirst(log, h('div', { class: 'feedback close' }, `Too wide (${a - b} > ${maxWidth}).`));
      const fv = dice.slice(0, revealed).reduce((s, d) => s + d, 0) + 3.5 * (nDice - revealed);
      let msg, cls = 'info';
      if (fv > a + 1e-9) { trades.push({ side: -1, price: a }); expPnl += a - fv; msg = `Counterparty BUYS 1 at ${a} (fair value was ${fv}). Expected loss ${(fv - a).toFixed(2)}.`; cls = 'wrong'; }
      else if (fv < b - 1e-9) { trades.push({ side: +1, price: b }); expPnl += fv - b; msg = `Counterparty SELLS 1 at ${b} (fair value was ${fv}). Expected loss ${(b - fv).toFixed(2)}.`; cls = 'wrong'; }
      else { msg = `No trade — fair value ${fv} is inside your ${b} @ ${a}. 👍`; cls = 'correct'; }
      addFirst(log, h('div', { class: 'feedback ' + cls }, msg));
      if (revealed < nDice) {
        revealed++;
        drawDice();
        bid.value = ''; ask.value = '';
        if (revealed === nDice) finish();
        else bid.focus();
      }
    }

    function finish() {
      const sum = dice.reduce((s, d) => s + d, 0);
      const realised = trades.reduce((s, t) => s + t.side * (sum - t.price), 0);
      store.recordMarket({ game: 'dice', n: nDice, exp: expPnl, realised });
      addFirst(log, h('div', { class: 'feedback ' + (expPnl >= -1e-9 ? 'correct' : 'close') },
        h('b', {}, `All dice revealed: sum = ${sum}. `),
        h('div', {}, `Expected P&L: ${expPnl.toFixed(2)} · Realised P&L at settlement: ${realised.toFixed(2)}`),
        h('div', { class: 'muted small' }, 'Fair value of the sum = revealed total + 3.5 × hidden dice. Your mid should track it after every reveal.')));
      btn.textContent = 'New game →';
      btn.onclick = play;
      drawDice();
      drawHistory();
    }

    fill(card, h('div', { class: 'question' }, `📣 Make me a market on the sum of ${nDice} dice.`), diceRow, posEl,
      h('div', { class: 'row', style: { marginTop: '12px' } }, bid, h('span', {}, '@'), ask, btn), log);
    drawDice();
    bid.focus();
  }

  drawSettings();
  drawHistory();
  play();
}
