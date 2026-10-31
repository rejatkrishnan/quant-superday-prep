# σ Quant Superday Prep

A browser-based practice arena for **quant research / quant trading superday interviews**. It covers mental math, pattern recognition, probability & statistics, brainteasers, market making, and Python/NumPy/pandas coding, with progress tracking and spaced repetition.

**▶ Live app: https://rejatkrishnan.github.io/quant-superday-prep/**

No install, no account, no backend. Everything runs in your browser and progress is saved to `localStorage`. You can export and import it to move between devices.

## How it works

The app is organised around a **daily loop**:

1. **📅 Today.** Each morning you get a plan built from your weakest syllabus topics, your spaced-repetition review queue and how many days remain until your interview. Tasks tick off automatically as you practise. Choose a Light (~30 min), Standard (~60 min) or Intense (~2 h) day, and set your interview date for a countdown. Mock interviews get scheduled more often as the date approaches.
2. **🔁 Review.** Everything due for spaced repetition (probability and math questions, brainteasers, concept cards) sits in one queue. Items you miss come back immediately. Items you get right return after 1, 3, 7, 16 and then 35 days.
3. **🗺️ Syllabus & Coverage.** The full quant research interview syllabus: 27 topics in 10 sections. Each topic shows coverage, mastery %, status (Not started, Learning, Reviewing, Mastered) and a link to practise it. An overall readiness score summarises everything.
4. **🎤 Mock Interview.** Interviewer-led rounds with a round clock, a scratchpad, hints that cost points, follow-up questions and a hire/no-hire scorecard. Questions are drawn from your weakest material. Rounds: phone screen, probability & brainteasers, statistics & ML, math, live coding, markets & finance, research & fit. There's also a full 4-round superday.
5. **📊 Progress.** A 20-week activity heatmap, minutes per day (time counts while you're actively practising), daily-plan completion, accuracy by area, mastery by section, interview score trend, time spent per module, and a recent-activity log.

## Practice modules

| Module | What it trains |
|---|---|
| ⚡ **Mental Math** | Timed sprints in the style of Zetamac and trading-firm arithmetic screens. Classic mode (+ − × ÷) and a quant mix (percentages, decimals, fractions → decimals, squares, 2-digit × 2-digit). |
| 🔢 **Pattern Recognition** | Unlimited next-term sequences from 17 procedural rule families plus curated "aha" classics. |
| 🎲 **Probability, Stats & Math** | 120 numeric questions with hints and full solutions: probability, EV, Bayes, combinatorics, stochastic processes, statistics, linear algebra, calculus and pricing. Also unlimited randomised problems. Answers accept expressions like `1/6`, `16.67%`, `1-(5/6)^4` or `sqrt(2/pi)`. |
| 🧠 **Concepts & Theory** | 100 "explain this" cards with key points and likely follow-ups: stochastic processes and Itô, inference and testing, regression, linear algebra and PCA, optimisation, machine learning, time series and econometrics, finance (Black–Scholes, Greeks, portfolio theory), Python internals and SQL, and research & behavioral questions. |
| 🧩 **Brainteasers** | 34 classic logic, game theory and optimisation puzzles. |
| 🐍 **Coding** | 40 auto-graded problems in Python (algorithms, order-book matching), NumPy (vectorisation, OLS, Monte Carlo), pandas (`merge_asof`, resampling, pivots) and ML & Stats (logistic regression, ridge, k-means, PCA, bootstrap, EWMA vol, AR(1), implied vol, out-of-sample R², walk-forward CV). Real CPython runs in the browser via [Pyodide](https://pyodide.org). |
| 📈 **Market Making** | Estimation markets (quote, get traded against, update) and a dice-sum market with sequential reveals. |
| 🏁 **Written Test** | Timed mixed written exams in the style of online assessments, with a section-by-section report. |
| 📘 **Cheat Sheet** | Numbers to memorise, the probability toolkit, distributions, stats and ML, finance formulas, pandas/NumPy idioms, and interview technique. |

Progress lives in your browser's `localStorage`. Export and import it from the Progress page to move between devices.

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

- `tests/validate.mjs` checks every question bank, confirms the syllabus maps each item to exactly one topic, tests the answer parser, grader, daily-plan generator, mastery tracking and interview round builder, and fuzzes every random generator.
- `tests/run_coding_tests.py` runs every coding problem's **reference solution** through the same harness the browser uses and checks that it passes every test. It also checks that the **starter code fails**, so the tests aren't vacuous.

CI runs both on every push.

## Adding content

All content is plain data:

- `js/data/probability.js`: `{ id, topic, diff, q, ans, hint, sol, tol? }`
- `js/data/brainteasers.js`: `{ id, title, diff, tags, q, answer, sol, ans? }` (with `ans`, the puzzle is auto-graded)
- `js/data/coding.js`: `{ id, track, diff, title, prompt, starter, solution, tests: [[name, pythonCode], ...] }`
- `js/data/concepts.js`: `{ id, topic, diff, q, a, f? }` (`a` = key points as HTML, `f` = follow-up questions)
- `js/data/fermi.js`: `{ id, q, v }`
- `js/data/syllabus.js`: the topic map. New `topic` or `track` values must be added here; the tests enforce it.

Run `npm test` after adding anything.

## Project structure

```
index.html            app shell + navigation
css/style.css         styling (dark theme, responsive)
js/main.js            hash router
js/lib/util.js        DOM helper, answer parser, grading, persistence, spaced repetition
js/lib/mastery.js     syllabus coverage, mastery, streaks and activity stats
js/lib/harness.js     Python test harness (shared by browser and CI)
js/modules/*.js       one file per module
js/data/*.js          question banks
tests/                validation + coding solution tests
```

## License

MIT
