// The full quant-research interview syllabus. Every practice item in the app maps to exactly one topic here.
// Source kinds:
//   { m: 'probability', topic }   numeric questions in js/data/probability.js
//   { m: 'concepts', topic }      theory flashcards in js/data/concepts.js
//   { m: 'coding', track }        coding problems in js/data/coding.js
//   { m: 'brainteasers' }         all brainteasers
//   { m: 'mental' | 'sequences' | 'market' | 'interviews' | 'mocks', target }   activity counts

export const SYLLABUS = [
  { section: 'Speed & Pattern Recognition', topics: [
    { id: 'mental', name: 'Mental arithmetic', why: 'Timed arithmetic screens (Zetamac / 80-in-8 style) are a common first filter.', sources: [{ m: 'mental', target: 20 }] },
    { id: 'sequences', name: 'Number sequences', why: 'Pattern-recognition tests in online assessments.', sources: [{ m: 'sequences', target: 150 }] },
  ] },
  { section: 'Probability', topics: [
    { id: 'prob-basic', name: 'Probability fundamentals', why: 'Dice, cards, geometric probability, symmetry arguments.', sources: [{ m: 'probability', topic: 'Probability' }] },
    { id: 'combinatorics', name: 'Combinatorics', why: 'Counting arguments underpin most probability questions.', sources: [{ m: 'probability', topic: 'Combinatorics' }] },
    { id: 'bayes', name: 'Conditional probability & Bayes', why: 'Base-rate questions and conditioning traps are interview favourites.', sources: [{ m: 'probability', topic: 'Conditional & Bayes' }] },
    { id: 'ev', name: 'Expected value & games', why: 'Linearity, first-step analysis, optimal stopping and dice games.', sources: [{ m: 'probability', topic: 'Expected Value' }] },
    { id: 'stochastic', name: 'Stochastic processes', why: 'Random walks, martingales, Markov chains, Brownian motion and Itô.', sources: [{ m: 'probability', topic: 'Stochastic Processes' }, { m: 'concepts', topic: 'Stochastic Processes' }] },
  ] },
  { section: 'Statistics', topics: [
    { id: 'stats', name: 'Distributions & estimation', why: 'Moments, CLT, sampling, estimators, time-series basics.', sources: [{ m: 'probability', topic: 'Statistics' }] },
    { id: 'inference', name: 'Inference & hypothesis testing', why: 'p-values, power, multiple testing, MLE, bootstrap, Bayesian inference.', sources: [{ m: 'concepts', topic: 'Inference & Testing' }] },
    { id: 'regression', name: 'Regression', why: 'OLS derivation & assumptions, bias, regularisation, logistic regression.', sources: [{ m: 'concepts', topic: 'Regression' }] },
  ] },
  { section: 'Mathematics', topics: [
    { id: 'linalg', name: 'Linear algebra', why: 'Eigenvalues, PSD matrices, PCA/SVD, covariance and portfolio maths.', sources: [{ m: 'probability', topic: 'Linear Algebra' }, { m: 'concepts', topic: 'Linear Algebra' }] },
    { id: 'calculus', name: 'Calculus & optimisation', why: 'Integrals, Taylor series, Lagrange multipliers, gradient & Newton methods.', sources: [{ m: 'probability', topic: 'Calculus & Optimization' }, { m: 'concepts', topic: 'Calculus & Optimization' }] },
  ] },
  { section: 'Machine Learning & Time Series', topics: [
    { id: 'ml', name: 'Machine learning', why: 'Bias–variance, validation, trees/ensembles, metrics, leakage.', sources: [{ m: 'concepts', topic: 'Machine Learning' }] },
    { id: 'timeseries', name: 'Time series & econometrics', why: 'Stationarity, AR/ARMA, cointegration, GARCH, backtest biases.', sources: [{ m: 'concepts', topic: 'Time Series' }] },
    { id: 'ml-code', name: 'ML & stats implementation', why: 'Implement logistic regression, k-means, PCA, bootstrap, walk-forward CV.', sources: [{ m: 'coding', track: 'ML & Stats' }] },
  ] },
  { section: 'Finance & Markets', topics: [
    { id: 'finance', name: 'Finance theory', why: 'Black–Scholes, Greeks, CAPM, Sharpe, portfolio optimisation, microstructure.', sources: [{ m: 'concepts', topic: 'Finance' }] },
    { id: 'pricing', name: 'Pricing & betting problems', why: 'Risk-neutral pricing, put–call parity, Kelly, EV of bets.', sources: [{ m: 'probability', topic: 'Markets & Betting' }] },
    { id: 'market', name: 'Market making', why: 'Quoting and updating markets — standard at trading-focused firms.', sources: [{ m: 'market', target: 25 }] },
  ] },
  { section: 'Coding', topics: [
    { id: 'py', name: 'Python & algorithms', why: 'Data structures, complexity, clean code under time pressure.', sources: [{ m: 'coding', track: 'Python' }] },
    { id: 'numpy', name: 'NumPy', why: 'Vectorisation and broadcasting for numerical work.', sources: [{ m: 'coding', track: 'NumPy' }] },
    { id: 'pandas', name: 'pandas', why: 'groupby, pivots, as-of joins, resampling — the daily tools of a researcher.', sources: [{ m: 'coding', track: 'pandas' }] },
    { id: 'py-concepts', name: 'Python & data concepts', why: 'Language internals and pandas gotchas asked in technical interviews.', sources: [{ m: 'concepts', topic: 'Python & Data' }] },
  ] },
  { section: 'Brainteasers & Logic', topics: [
    { id: 'teasers', name: 'Brainteasers & logic puzzles', why: 'Tests structured thinking under pressure.', sources: [{ m: 'brainteasers' }] },
  ] },
  { section: 'Research & Behavioral', topics: [
    { id: 'research', name: 'Research & behavioral', why: 'Project deep-dives, research design, "why quant", teamwork.', sources: [{ m: 'concepts', topic: 'Research & Behavioral' }] },
  ] },
  { section: 'Interview Readiness', topics: [
    { id: 'interviews', name: 'Mock interview rounds', why: 'Practising under realistic conditions with follow-ups.', sources: [{ m: 'interviews', target: 8 }] },
    { id: 'written', name: 'Written tests / online assessments', why: 'Timed mixed tests like those used for first-round screens.', sources: [{ m: 'mocks', target: 4 }] },
  ] },
];

export const ALL_TOPICS = SYLLABUS.flatMap((s) => s.topics.map((t) => ({ ...t, section: s.section })));
