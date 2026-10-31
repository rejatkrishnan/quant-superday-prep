# σ Quant Superday Prep

A browser-based practice arena for **quant research / quant trading superday interviews**. It covers mental math, pattern recognition, probability & statistics, brainteasers, market making, and Python/NumPy/pandas coding, with progress tracking and spaced repetition.

**▶ Live app: https://rejatkrishnan.github.io/quant-superday-prep/**

No install, no account, no backend. Everything runs in your browser and progress is saved to `localStorage`. You can export and import it to move between devices.

## Modules

| Module | What it trains |
|---|---|
| ⚡ **Mental Math** | Timed sprints in the style of Zetamac and trading-firm arithmetic screens. Classic mode (+ − × ÷) and a quant mix (percentages, decimals, fractions → decimals, squares, 2-digit × 2-digit). Answers auto-submit; personal bests and a trend chart are tracked. |
| 🔢 **Pattern Recognition** | Unlimited next-term sequences from 17 procedural rule families (quadratic, affine recurrences, interleaved, geometric differences, tribonacci, primes, …) plus curated "aha" classics like look-and-say and Catalan numbers. |
| 🎲 **Probability & Stats** | 76 curated interview questions (EV, conditional/Bayes, combinatorics, stochastic processes, statistics, markets & betting), each with a hint and a full solution. Also unlimited randomised problems. Answers accept expressions: `1/6`, `16.67%`, `1-(5/6)^4`, `sqrt(2/pi)`. |
| 🧩 **Brainteasers** | 34 classic logic, game theory and optimisation puzzles (25 horses, pirate gold, 2 eggs, 12 coins, prisoners & hats, …). |
| 🐍 **Coding** | 27 auto-graded problems in **Python** (algorithms, LRU cache, order-book matching), **NumPy** (vectorised rolling means, OLS, correlation from scratch, Monte Carlo option pricing) and **pandas** (VWAP, pivots, `merge_asof`, resampling to OHLC, Sharpe). Real CPython runs in the browser via [Pyodide](https://pyodide.org) in a Web Worker, so infinite loops get killed instead of freezing the page. |
| 📈 **Market Making** | (1) Estimation markets: quote a bid/ask on a Fermi question, get traded against, then update your market. (2) Dice-sum market: dice are revealed one at a time and an informed counterparty picks off stale quotes. |
| 🏁 **Mock Superday** | Timed mixed exams (15 / 25 / 35 min) with no hints, followed by a section-by-section report and solutions. |
| 📘 **Cheat Sheet** | Numbers to memorise, the probability toolkit, distributions, stats and ML, finance formulas, pandas/NumPy idioms, and interview technique. |

Spaced repetition brings missed probability questions and brainteasers back on a 1 / 3 / 7 / 16 / 35-day schedule. The dashboard shows coverage, accuracy, streaks and your review queue.

## Run locally

It's a static site with ES modules, so serve it over HTTP (opening `index.html` directly won't work):

```bash
git clone https://github.com/rejatkrishnan/quant-superday-prep.git
cd quant-superday-prep
python3 -m http.server 8000
# open http://localhost:8000
```

The coding module downloads Pyodide, NumPy and pandas from jsDelivr the first time you run code (about 10–20 s). After that the browser caches them.

## Tests

```bash
pip install numpy pandas
npm test
```

- `tests/validate.mjs` checks the question banks, the answer parser and grader, and fuzzes every generator (sequences, probability, mental math).
- `tests/run_coding_tests.py` runs every coding problem's **reference solution** through the same harness the browser uses and checks that it passes every test. It also checks that the **starter code fails**, so the tests aren't vacuous.

CI runs both on every push.

## Adding content

All content is plain data:

- `js/data/probability.js`: `{ id, topic, diff, q, ans, hint, sol, tol? }`
- `js/data/brainteasers.js`: `{ id, title, diff, tags, q, answer, sol, ans? }` (with `ans`, the puzzle is auto-graded)
- `js/data/coding.js`: `{ id, track, diff, title, prompt, starter, solution, tests: [[name, pythonCode], ...] }`
- `js/data/fermi.js`: `{ id, q, v }`

Run `npm test` after adding anything.

## Project structure

```
index.html            app shell + navigation
css/style.css         styling (dark theme, responsive)
js/main.js            hash router
js/lib/util.js        DOM helper, answer parser, grading, persistence, spaced repetition
js/lib/harness.js     Python test harness (shared by browser and CI)
js/modules/*.js       one file per module
js/data/*.js          question banks
tests/                validation + coding solution tests
```

## License

MIT
