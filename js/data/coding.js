// Coding problems executed in-browser with Pyodide.
// tests: array of [name, python code]. Each test runs in a namespace containing the user's definitions
// plus `np` and `pd`. A test passes if it raises no exception.
// Python snippets use String.raw so backslashes survive.

const py = String.raw;

export const CODING_PROBLEMS = [
  // ======================= PYTHON =======================
  { id: 'py-two-sum', track: 'Python', diff: 1, title: 'Two Sum',
    prompt: 'Return the indices <code>[i, j]</code> (i &lt; j) of the two numbers in <code>nums</code> that add up to <code>target</code>. Exactly one solution exists. Aim for O(n).',
    starter: py`def two_sum(nums, target):
    # your code here
    pass
`,
    solution: py`def two_sum(nums, target):
    seen = {}
    for j, x in enumerate(nums):
        if target - x in seen:
            return [seen[target - x], j]
        seen[x] = j
`,
    tests: [
      ['basic', py`assert two_sum([2, 7, 11, 15], 9) == [0, 1], two_sum([2, 7, 11, 15], 9)`],
      ['middle', py`assert two_sum([3, 2, 4], 6) == [1, 2], two_sum([3, 2, 4], 6)`],
      ['duplicates', py`assert two_sum([3, 3], 6) == [0, 1]`],
      ['negatives', py`assert two_sum([-5, 10, 4, 1], -1) == [0, 2]`],
      ['large O(n)', py`
n = 200000
assert two_sum(list(range(n)), 2 * n - 3) == [n - 2, n - 1]`],
    ] },

  { id: 'py-stock-profit', track: 'Python', diff: 1, title: 'Best Time to Buy and Sell',
    prompt: 'Given daily <code>prices</code>, return the maximum profit from one buy followed by one sell (0 if no profit is possible).',
    starter: py`def max_profit(prices):
    pass
`,
    solution: py`def max_profit(prices):
    best, lo = 0, float('inf')
    for p in prices:
        lo = min(lo, p)
        best = max(best, p - lo)
    return best
`,
    tests: [
      ['example', py`assert max_profit([7, 1, 5, 3, 6, 4]) == 5`],
      ['decreasing', py`assert max_profit([7, 6, 4, 3, 1]) == 0`],
      ['empty', py`assert max_profit([]) == 0`],
      ['late min', py`assert max_profit([3, 8, 1, 2, 9]) == 8`],
    ] },

  { id: 'py-kadane', track: 'Python', diff: 1, title: 'Maximum Subarray (Kadane)',
    prompt: 'Return the largest sum of any non-empty contiguous subarray of <code>xs</code>. Think of it as the best P&amp;L window in a series of daily P&amp;Ls.',
    starter: py`def max_subarray(xs):
    pass
`,
    solution: py`def max_subarray(xs):
    best = cur = xs[0]
    for x in xs[1:]:
        cur = max(x, cur + x)
        best = max(best, cur)
    return best
`,
    tests: [
      ['example', py`assert max_subarray([-2, 1, -3, 4, -1, 2, 1, -5, 4]) == 6`],
      ['all negative', py`assert max_subarray([-3, -1, -2]) == -1`],
      ['single', py`assert max_subarray([5]) == 5`],
      ['all positive', py`assert max_subarray([1, 2, 3]) == 6`],
    ] },

  { id: 'py-parens', track: 'Python', diff: 1, title: 'Valid Brackets',
    prompt: 'Return True if every bracket in <code>s</code> (consisting of <code>()[]{}</code>) is closed by the same type in the correct order.',
    starter: py`def is_valid(s):
    pass
`,
    solution: py`def is_valid(s):
    pairs = {')': '(', ']': '[', '}': '{'}
    stack = []
    for c in s:
        if c in pairs:
            if not stack or stack.pop() != pairs[c]:
                return False
        else:
            stack.append(c)
    return not stack
`,
    tests: [
      ['simple', py`assert is_valid("()[]{}") is True`],
      ['nested', py`assert is_valid("{[()]}") is True`],
      ['crossed', py`assert is_valid("([)]") is False`],
      ['unclosed', py`assert is_valid("((") is False`],
      ['extra close', py`assert is_valid("())") is False`],
      ['empty', py`assert is_valid("") is True`],
    ] },

  { id: 'py-merge-intervals', track: 'Python', diff: 2, title: 'Merge Intervals',
    prompt: 'Merge all overlapping intervals (inclusive endpoints, touching intervals merge) and return them sorted by start as a list of lists.',
    starter: py`def merge(intervals):
    pass
`,
    solution: py`def merge(intervals):
    out = []
    for s, e in sorted(intervals):
        if out and s <= out[-1][1]:
            out[-1][1] = max(out[-1][1], e)
        else:
            out.append([s, e])
    return out
`,
    tests: [
      ['example', py`assert merge([[1, 3], [2, 6], [8, 10], [15, 18]]) == [[1, 6], [8, 10], [15, 18]]`],
      ['touching', py`assert merge([[1, 4], [4, 5]]) == [[1, 5]]`],
      ['unsorted', py`assert merge([[5, 7], [1, 2], [2, 3]]) == [[1, 3], [5, 7]]`],
      ['contained', py`assert merge([[1, 10], [2, 3]]) == [[1, 10]]`],
      ['empty', py`assert merge([]) == []`],
    ] },

  { id: 'py-top-k', track: 'Python', diff: 2, title: 'Top-K Frequent Tickers',
    prompt: 'Given a list of ticker symbols (one per trade), return the <code>k</code> most frequent. Break ties alphabetically.',
    starter: py`def top_k(tickers, k):
    pass
`,
    solution: py`from collections import Counter

def top_k(tickers, k):
    c = Counter(tickers)
    return sorted(c, key=lambda t: (-c[t], t))[:k]
`,
    tests: [
      ['basic', py`assert top_k(["AAPL", "MSFT", "AAPL", "GOOG", "MSFT", "AAPL"], 2) == ["AAPL", "MSFT"]`],
      ['tie alphabetical', py`assert top_k(["B", "A", "C", "B", "A"], 2) == ["A", "B"]`],
      ['k too large', py`assert top_k(["X"], 3) == ["X"]`],
    ] },

  { id: 'py-running-median', track: 'Python', diff: 3, title: 'Running Median',
    prompt: 'Return a list where element i is the median of <code>xs[:i+1]</code> (as a float). Must handle 100k elements quickly — think two heaps.',
    starter: py`import heapq

def running_median(xs):
    pass
`,
    solution: py`import heapq

def running_median(xs):
    lo, hi, out = [], [], []
    for x in xs:
        heapq.heappush(lo, -x)
        heapq.heappush(hi, -heapq.heappop(lo))
        if len(hi) > len(lo):
            heapq.heappush(lo, -heapq.heappop(hi))
        out.append(float(-lo[0]) if len(lo) > len(hi) else (-lo[0] + hi[0]) / 2)
    return out
`,
    tests: [
      ['small', py`assert running_median([2, 1, 5, 7, 2, 0, 5]) == [2, 1.5, 2, 3.5, 2, 2, 2]`],
      ['single', py`assert running_median([4]) == [4.0]`],
      ['vs brute force', py`
import random, statistics
random.seed(1)
xs = [random.randint(-50, 50) for _ in range(300)]
want = [float(statistics.median(xs[:i + 1])) for i in range(len(xs))]
assert running_median(xs) == want`],
      ['performance', py`
import random, time
xs = [random.random() for _ in range(100000)]
t = time.time(); running_median(xs)
assert time.time() - t < 5, "too slow - use heaps"`],
    ] },

  { id: 'py-lru', track: 'Python', diff: 2, title: 'LRU Cache',
    prompt: 'Implement <code>LRUCache(capacity)</code> with <code>get(key)</code> (return value or -1) and <code>put(key, value)</code>. Both O(1). When full, evict the least recently used key. <code>get</code> counts as a use.',
    starter: py`class LRUCache:
    def __init__(self, capacity):
        pass

    def get(self, key):
        pass

    def put(self, key, value):
        pass
`,
    solution: py`from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity):
        self.cap = capacity
        self.d = OrderedDict()

    def get(self, key):
        if key not in self.d:
            return -1
        self.d.move_to_end(key)
        return self.d[key]

    def put(self, key, value):
        self.d[key] = value
        self.d.move_to_end(key)
        if len(self.d) > self.cap:
            self.d.popitem(last=False)
`,
    tests: [
      ['example', py`
c = LRUCache(2)
c.put(1, 1); c.put(2, 2)
assert c.get(1) == 1
c.put(3, 3)
assert c.get(2) == -1, "2 should be evicted"
c.put(4, 4)
assert c.get(1) == -1, "1 should be evicted"
assert c.get(3) == 3 and c.get(4) == 4`],
      ['update existing', py`
c = LRUCache(2)
c.put(1, 1); c.put(2, 2); c.put(1, 10); c.put(3, 3)
assert c.get(1) == 10 and c.get(2) == -1`],
    ] },

  { id: 'py-bisect', track: 'Python', diff: 1, title: 'Binary Search (lower bound)',
    prompt: 'Given a sorted list <code>a</code>, return the first index i with <code>a[i] &gt;= x</code> (or <code>len(a)</code>). Don\'t use the <code>bisect</code> module.',
    starter: py`def lower_bound(a, x):
    pass
`,
    solution: py`def lower_bound(a, x):
    lo, hi = 0, len(a)
    while lo < hi:
        mid = (lo + hi) // 2
        if a[mid] < x:
            lo = mid + 1
        else:
            hi = mid
    return lo
`,
    tests: [
      ['found', py`assert lower_bound([1, 3, 5, 7], 5) == 2`],
      ['between', py`assert lower_bound([1, 3, 5, 7], 4) == 2`],
      ['dupes', py`assert lower_bound([1, 2, 2, 2, 3], 2) == 1`],
      ['end', py`assert lower_bound([1, 2], 9) == 2`],
      ['start', py`assert lower_bound([1, 2], -9) == 0`],
      ['empty', py`assert lower_bound([], 1) == 0`],
      ['no bisect', py`
import bisect, random
random.seed(0)
for _ in range(200):
    a = sorted(random.randint(0, 20) for _ in range(random.randint(0, 15)))
    x = random.randint(-2, 22)
    assert lower_bound(a, x) == bisect.bisect_left(a, x), (a, x)`],
    ] },

  { id: 'py-order-book', track: 'Python', diff: 3, title: 'Mini Order Book',
    prompt: 'Implement <code>match(orders)</code>. Each order is <code>(side, price, qty)</code> with side "B" or "S", processed in sequence. An incoming buy matches resting sells with price ≤ its limit (best price first, then FIFO); vice versa for sells. Trades execute at the resting order\'s price. Unfilled quantity rests on the book. Return the list of trades as <code>(price, qty)</code> tuples in execution order.',
    starter: py`def match(orders):
    pass
`,
    solution: py`import heapq

def match(orders):
    bids, asks, trades, seq = [], [], [], 0
    for side, price, qty in orders:
        book, opp = (bids, asks) if side == "B" else (asks, bids)
        while qty and opp:
            key, _, rp, rq = opp[0]
            if (side == "B" and rp > price) or (side == "S" and rp < price):
                break
            fill = min(qty, rq)
            trades.append((rp, fill))
            qty -= fill
            if fill == rq:
                heapq.heappop(opp)
            else:
                opp[0] = (key, opp[0][1], rp, rq - fill)
        if qty:
            seq += 1
            heapq.heappush(book, (-price if side == "B" else price, seq, price, qty))
    return trades
`,
    tests: [
      ['no cross', py`assert match([("B", 99, 5), ("S", 101, 5)]) == []`],
      ['simple cross', py`assert match([("S", 100, 5), ("B", 101, 3)]) == [(100, 3)]`],
      ['walk the book', py`assert match([("S", 101, 2), ("S", 100, 2), ("B", 102, 5)]) == [(100, 2), (101, 2)]`],
      ['FIFO at price', py`assert match([("B", 100, 1), ("B", 100, 2), ("S", 99, 2)]) == [(100, 1), (100, 1)]`],
      ['rest then fill', py`assert match([("B", 100, 5), ("S", 100, 2), ("S", 99, 4), ("B", 99, 1)]) == [(100, 2), (100, 3), (99, 1)]`],
    ] },

  // ======================= NUMPY =======================
  { id: 'np-log-returns', track: 'NumPy', diff: 1, title: 'Log Returns',
    prompt: 'Given a 1-D array of prices, return the array of log returns <code>log(p[t] / p[t-1])</code> (length n−1). No Python loops.',
    starter: py`import numpy as np

def log_returns(prices):
    pass
`,
    solution: py`import numpy as np

def log_returns(prices):
    p = np.asarray(prices, dtype=float)
    return np.diff(np.log(p))
`,
    tests: [
      ['values', py`assert np.allclose(log_returns(np.array([100., 110., 99.])), [np.log(1.1), np.log(0.9)])`],
      ['length', py`assert len(log_returns(np.arange(1, 11))) == 9`],
      ['sum telescopes', py`
p = np.random.default_rng(0).uniform(50, 150, 1000)
assert np.isclose(log_returns(p).sum(), np.log(p[-1] / p[0]))`],
    ] },

  { id: 'np-rolling-mean', track: 'NumPy', diff: 2, title: 'Rolling Mean (vectorised)',
    prompt: 'Return the rolling mean of 1-D array <code>x</code> with window <code>k</code>, only for full windows (length n−k+1). Do it in O(n) with <code>np.cumsum</code> — no loops.',
    starter: py`import numpy as np

def rolling_mean(x, k):
    pass
`,
    solution: py`import numpy as np

def rolling_mean(x, k):
    c = np.cumsum(np.insert(np.asarray(x, dtype=float), 0, 0.0))
    return (c[k:] - c[:-k]) / k
`,
    tests: [
      ['small', py`assert np.allclose(rolling_mean(np.array([1, 2, 3, 4, 5]), 2), [1.5, 2.5, 3.5, 4.5])`],
      ['k = n', py`assert np.allclose(rolling_mean(np.array([2., 4., 6.]), 3), [4.])`],
      ['k = 1', py`assert np.allclose(rolling_mean(np.array([3., 1.]), 1), [3., 1.])`],
      ['vs pandas', py`
x = np.random.default_rng(1).normal(size=500)
want = pd.Series(x).rolling(20).mean().dropna().values
assert np.allclose(rolling_mean(x, 20), want)`],
    ] },

  { id: 'np-zscore', track: 'NumPy', diff: 1, title: 'Column Z-Scores',
    prompt: 'Given a 2-D array (rows = days, cols = assets), standardise each column to mean 0 and (population, ddof=0) std 1 using broadcasting.',
    starter: py`import numpy as np

def zscore(X):
    pass
`,
    solution: py`import numpy as np

def zscore(X):
    X = np.asarray(X, dtype=float)
    return (X - X.mean(axis=0)) / X.std(axis=0)
`,
    tests: [
      ['means 0', py`
Z = zscore(np.random.default_rng(2).normal(5, 3, size=(100, 4)))
assert np.allclose(Z.mean(axis=0), 0)`],
      ['stds 1', py`
Z = zscore(np.random.default_rng(3).normal(5, 3, size=(100, 4)))
assert np.allclose(Z.std(axis=0), 1)`],
      ['shape', py`assert zscore(np.ones((3, 2)) + np.arange(6).reshape(3, 2)).shape == (3, 2)`],
    ] },

  { id: 'np-corr', track: 'NumPy', diff: 2, title: 'Correlation Matrix From Scratch',
    prompt: 'Return the correlation matrix of the columns of <code>X</code> (n × p) without using <code>np.corrcoef</code> or <code>np.cov</code>. Hint: demean, then a matrix product.',
    starter: py`import numpy as np

def corr_matrix(X):
    pass
`,
    solution: py`import numpy as np

def corr_matrix(X):
    X = np.asarray(X, dtype=float)
    D = X - X.mean(axis=0)
    C = D.T @ D
    s = np.sqrt(np.diag(C))
    return C / np.outer(s, s)
`,
    tests: [
      ['vs corrcoef', py`
X = np.random.default_rng(4).normal(size=(200, 5))
assert np.allclose(corr_matrix(X), np.corrcoef(X, rowvar=False))`],
      ['diag ones', py`assert np.allclose(np.diag(corr_matrix(np.random.default_rng(5).normal(size=(50, 3)))), 1)`],
      ['perfect', py`
x = np.arange(10.)
assert np.allclose(corr_matrix(np.column_stack([x, -2 * x + 1])), [[1, -1], [-1, 1]])`],
    ] },

  { id: 'np-ols', track: 'NumPy', diff: 2, title: 'OLS Regression',
    prompt: 'Fit <code>y = a + Xb</code> by least squares. <code>X</code> is n × p (no intercept column). Return a 1-D array <code>[a, b1, …, bp]</code>. Use <code>np.linalg.lstsq</code> or the normal equations.',
    starter: py`import numpy as np

def ols(X, y):
    pass
`,
    solution: py`import numpy as np

def ols(X, y):
    X = np.asarray(X, dtype=float)
    if X.ndim == 1:
        X = X[:, None]
    A = np.column_stack([np.ones(len(X)), X])
    return np.linalg.lstsq(A, np.asarray(y, dtype=float), rcond=None)[0]
`,
    tests: [
      ['exact line', py`assert np.allclose(ols(np.array([[0.], [1.], [2.]]), np.array([1., 3., 5.])), [1, 2])`],
      ['noisy multi', py`
rng = np.random.default_rng(6)
X = rng.normal(size=(5000, 3))
y = 0.5 + X @ np.array([1., -2., 0.3]) + rng.normal(scale=0.1, size=5000)
assert np.allclose(ols(X, y), [0.5, 1, -2, 0.3], atol=0.01)`],
    ] },

  { id: 'np-drawdown', track: 'NumPy', diff: 2, title: 'Maximum Drawdown',
    prompt: 'Given an equity curve (positive values), return the maximum drawdown as a positive fraction: max over t of <code>1 − equity[t] / max(equity[:t+1])</code>. Vectorise with <code>np.maximum.accumulate</code>.',
    starter: py`import numpy as np

def max_drawdown(equity):
    pass
`,
    solution: py`import numpy as np

def max_drawdown(equity):
    e = np.asarray(equity, dtype=float)
    return float(np.max(1 - e / np.maximum.accumulate(e)))
`,
    tests: [
      ['example', py`assert np.isclose(max_drawdown([100, 120, 90, 130, 65]), 0.5)`],
      ['monotone', py`assert np.isclose(max_drawdown([1, 2, 3]), 0.0)`],
      ['recovery', py`assert np.isclose(max_drawdown([10, 8, 12, 9]), 0.25)`],
    ] },

  { id: 'np-pairwise', track: 'NumPy', diff: 2, title: 'Pairwise Distances',
    prompt: 'Given <code>A</code> (n × d) and <code>B</code> (m × d), return the n × m matrix of Euclidean distances using broadcasting (no loops).',
    starter: py`import numpy as np

def pairwise_dist(A, B):
    pass
`,
    solution: py`import numpy as np

def pairwise_dist(A, B):
    A = np.asarray(A, dtype=float); B = np.asarray(B, dtype=float)
    return np.sqrt(((A[:, None, :] - B[None, :, :]) ** 2).sum(-1))
`,
    tests: [
      ['3-4-5', py`assert np.allclose(pairwise_dist([[0, 0]], [[3, 4], [0, 1]]), [[5, 1]])`],
      ['shape & values', py`
rng = np.random.default_rng(7)
A, B = rng.normal(size=(6, 3)), rng.normal(size=(4, 3))
D = pairwise_dist(A, B)
assert D.shape == (6, 4)
assert np.isclose(D[2, 3], np.linalg.norm(A[2] - B[3]))`],
    ] },

  { id: 'np-mc-option', track: 'NumPy', diff: 3, title: 'Monte Carlo Option Pricing',
    prompt: 'Price a European call under Black–Scholes by Monte Carlo. Simulate <code>S_T = S0·exp((r − σ²/2)T + σ√T·Z)</code> using <code>np.random.default_rng(seed)</code> with <code>n</code> draws, and return the discounted mean payoff <code>e^(−rT)·E[max(S_T − K, 0)]</code>.',
    starter: py`import numpy as np

def mc_call(S0, K, r, sigma, T, n=200_000, seed=0):
    pass
`,
    solution: py`import numpy as np

def mc_call(S0, K, r, sigma, T, n=200_000, seed=0):
    z = np.random.default_rng(seed).standard_normal(n)
    ST = S0 * np.exp((r - 0.5 * sigma ** 2) * T + sigma * np.sqrt(T) * z)
    return float(np.exp(-r * T) * np.maximum(ST - K, 0).mean())
`,
    tests: [
      ['close to Black-Scholes', py`
from math import log, sqrt, exp, erf
def N(x): return 0.5 * (1 + erf(x / sqrt(2)))
S0, K, r, s, T = 100, 105, 0.03, 0.2, 1.0
d1 = (log(S0 / K) + (r + s * s / 2) * T) / (s * sqrt(T)); d2 = d1 - s * sqrt(T)
bs = S0 * N(d1) - K * exp(-r * T) * N(d2)
v = mc_call(S0, K, r, s, T, n=400_000, seed=1)
assert abs(v - bs) < 0.1, (v, bs)`],
      ['deep ITM ~ forward', py`
v = mc_call(100, 1, 0.0, 0.2, 1.0, n=100_000, seed=2)
assert abs(v - 99) < 0.3, v`],
    ] },

  // ======================= PANDAS =======================
  { id: 'pd-vwap', track: 'pandas', diff: 1, title: 'VWAP per Ticker',
    prompt: 'Given a DataFrame of trades with columns <code>ticker, price, qty</code>, return a Series indexed by ticker with the volume-weighted average price Σ(price·qty)/Σqty.',
    starter: py`import pandas as pd

def vwap(trades):
    pass
`,
    solution: py`import pandas as pd

def vwap(trades):
    t = trades.assign(notional=trades.price * trades.qty)
    g = t.groupby("ticker")[["notional", "qty"]].sum()
    return g.notional / g.qty
`,
    tests: [
      ['values', py`
df = pd.DataFrame({"ticker": ["A", "A", "B"], "price": [10., 20., 5.], "qty": [1, 3, 10]})
out = vwap(df)
assert abs(out["A"] - 17.5) < 1e-9 and abs(out["B"] - 5) < 1e-9, out`],
      ['is Series', py`
df = pd.DataFrame({"ticker": ["X"], "price": [1.], "qty": [1]})
assert isinstance(vwap(df), pd.Series)`],
    ] },

  { id: 'pd-pivot-returns', track: 'pandas', diff: 2, title: 'Long to Wide Returns',
    prompt: 'Given a long DataFrame with columns <code>date, ticker, close</code> (unsorted), return a wide DataFrame of simple daily returns: index = sorted dates, columns = tickers, values = <code>close.pct_change()</code> per ticker. Drop the first (all-NaN) row.',
    starter: py`import pandas as pd

def wide_returns(df):
    pass
`,
    solution: py`import pandas as pd

def wide_returns(df):
    wide = df.pivot(index="date", columns="ticker", values="close").sort_index()
    return wide.pct_change().iloc[1:]
`,
    tests: [
      ['values', py`
df = pd.DataFrame({
    "date": pd.to_datetime(["2024-01-02", "2024-01-01", "2024-01-01", "2024-01-02"]),
    "ticker": ["A", "A", "B", "B"],
    "close": [110., 100., 50., 45.],
})
out = wide_returns(df)
assert out.shape == (1, 2), out.shape
assert abs(out.loc["2024-01-02", "A"] - 0.1) < 1e-12
assert abs(out.loc["2024-01-02", "B"] + 0.1) < 1e-12`],
      ['sorted index', py`
dates = pd.date_range("2024-01-01", periods=5)
df = pd.DataFrame({"date": list(dates[::-1]), "ticker": "Z", "close": [5., 4., 3., 2., 1.]})
out = wide_returns(df)
assert out.index.is_monotonic_increasing and len(out) == 4`],
    ] },

  { id: 'pd-group-rolling', track: 'pandas', diff: 2, title: 'Rolling Mean per Group',
    prompt: 'Add a column <code>ma3</code> to a DataFrame with columns <code>ticker, date, close</code>: the 3-row rolling mean of <code>close</code> within each ticker ordered by date (NaN until 3 observations). Return the DataFrame sorted by ticker then date, with a fresh RangeIndex.',
    starter: py`import pandas as pd

def add_ma3(df):
    pass
`,
    solution: py`import pandas as pd

def add_ma3(df):
    out = df.sort_values(["ticker", "date"]).reset_index(drop=True)
    out["ma3"] = out.groupby("ticker")["close"].transform(lambda s: s.rolling(3).mean())
    return out
`,
    tests: [
      ['values', py`
df = pd.DataFrame({"ticker": ["A"] * 4 + ["B"] * 3,
                   "date": list(pd.date_range("2024-01-01", periods=4)) + list(pd.date_range("2024-01-01", periods=3)),
                   "close": [1., 2., 3., 4., 10., 20., 30.]}).sample(frac=1, random_state=0)
out = add_ma3(df)
assert list(out.ticker) == ["A"] * 4 + ["B"] * 3
assert out.ma3.isna().sum() == 4
assert out.ma3.dropna().tolist() == [2.0, 3.0, 20.0]
assert list(out.index) == list(range(7))`],
    ] },

  { id: 'pd-asof', track: 'pandas', diff: 3, title: 'Trades vs Prevailing Quotes',
    prompt: 'Given <code>trades</code> (<code>time, ticker, price</code>) and <code>quotes</code> (<code>time, ticker, bid, ask</code>), attach to each trade the most recent quote at or before its time for the same ticker, and add a column <code>side</code>: "B" if price ≥ mid, else "S". Return the result sorted by time. Hint: <code>pd.merge_asof</code>.',
    starter: py`import pandas as pd

def classify_trades(trades, quotes):
    pass
`,
    solution: py`import pandas as pd

def classify_trades(trades, quotes):
    m = pd.merge_asof(trades.sort_values("time"), quotes.sort_values("time"),
                      on="time", by="ticker", direction="backward")
    mid = (m.bid + m.ask) / 2
    m["side"] = (m.price >= mid).map({True: "B", False: "S"})
    return m
`,
    tests: [
      ['classification', py`
t = pd.to_datetime
quotes = pd.DataFrame({"time": t(["2024-01-02 09:30:00", "2024-01-02 09:30:05", "2024-01-02 09:30:02"]), "ticker": ["X", "X", "Y"],
                       "bid": [99., 100., 49.], "ask": [101., 102., 51.]})
trades = pd.DataFrame({"time": t(["2024-01-02 09:30:06", "2024-01-02 09:30:01", "2024-01-02 09:30:03"]), "ticker": ["X", "X", "Y"],
                       "price": [100.5, 100.5, 49.5]})
out = classify_trades(trades, quotes)
assert list(out.side) == ["B", "S", "S"], list(out.side)
assert list(out.bid) == [99., 49., 100.]`],
    ] },

  { id: 'pd-best-per-sector', track: 'pandas', diff: 1, title: 'Best Performer per Sector',
    prompt: 'Given columns <code>ticker, sector, ret</code>, return a DataFrame with one row per sector (sorted by sector) holding the ticker with the highest <code>ret</code>. Columns: <code>sector, ticker, ret</code>; fresh RangeIndex.',
    starter: py`import pandas as pd

def best_per_sector(df):
    pass
`,
    solution: py`import pandas as pd

def best_per_sector(df):
    idx = df.groupby("sector")["ret"].idxmax()
    return df.loc[idx, ["sector", "ticker", "ret"]].sort_values("sector").reset_index(drop=True)
`,
    tests: [
      ['values', py`
df = pd.DataFrame({"ticker": list("ABCDE"), "sector": ["Tech", "Tech", "Energy", "Energy", "Health"],
                   "ret": [0.1, 0.3, -0.2, 0.05, 0.0]})
out = best_per_sector(df)
assert list(out.columns) == ["sector", "ticker", "ret"]
assert list(out.sector) == ["Energy", "Health", "Tech"]
assert list(out.ticker) == ["D", "E", "B"]
assert list(out.index) == [0, 1, 2]`],
    ] },

  { id: 'pd-ohlc', track: 'pandas', diff: 2, title: 'Resample Ticks to OHLC Bars',
    prompt: 'Given a Series of trade prices indexed by timestamp, return 5-minute OHLC bars as a DataFrame with columns <code>open, high, low, close</code>. Drop bars with no trades.',
    starter: py`import pandas as pd

def ohlc_5min(prices):
    pass
`,
    solution: py`import pandas as pd

def ohlc_5min(prices):
    return prices.resample("5min").ohlc().dropna()
`,
    tests: [
      ['bars', py`
idx = pd.to_datetime(["2024-01-01 09:30", "2024-01-01 09:31", "2024-01-01 09:34",
                      "2024-01-01 09:46", "2024-01-01 09:47"])
s = pd.Series([10., 12., 11., 20., 19.], index=idx)
out = ohlc_5min(s)
assert list(out.columns) == ["open", "high", "low", "close"]
assert len(out) == 2, len(out)
assert out.iloc[0].tolist() == [10., 12., 10., 11.]
assert out.iloc[1].tolist() == [20., 20., 19., 19.]`],
    ] },

  { id: 'pd-sharpe', track: 'pandas', diff: 1, title: 'Annualised Sharpe Ratio',
    prompt: 'Given a Series of daily returns and an annual risk-free rate <code>rf</code>, return the annualised Sharpe ratio: mean of (daily return − rf/252) divided by its sample std (ddof=1), times √252.',
    starter: py`import numpy as np
import pandas as pd

def sharpe(returns, rf=0.0):
    pass
`,
    solution: py`import numpy as np
import pandas as pd

def sharpe(returns, rf=0.0):
    ex = returns - rf / 252
    return float(ex.mean() / ex.std() * np.sqrt(252))
`,
    tests: [
      ['value', py`
r = pd.Series([0.01, -0.005, 0.002, 0.007, -0.001])
want = r.mean() / r.std() * np.sqrt(252)
assert np.isclose(sharpe(r), want)`],
      ['with rf', py`
r = pd.Series(np.random.default_rng(8).normal(0.0005, 0.01, 1000))
ex = r - 0.04 / 252
assert np.isclose(sharpe(r, 0.04), ex.mean() / ex.std() * np.sqrt(252))`],
    ] },

  { id: 'pd-ffill-cum', track: 'pandas', diff: 2, title: 'Clean Prices & Cumulative Return',
    prompt: 'Given a wide price DataFrame (index = dates, columns = tickers) with missing values, forward-fill gaps (but leave leading NaNs), then return a Series of each ticker\'s total return from its first valid price to its last: <code>last / first − 1</code>.',
    starter: py`import pandas as pd

def total_return(prices):
    pass
`,
    solution: py`import pandas as pd

def total_return(prices):
    p = prices.ffill()
    first = p.apply(lambda s: s.loc[s.first_valid_index()])
    return p.iloc[-1] / first - 1
`,
    tests: [
      ['values', py`
import numpy as np
df = pd.DataFrame({"A": [np.nan, 100., np.nan, 120.], "B": [50., np.nan, 55., np.nan]},
                  index=pd.date_range("2024-01-01", periods=4))
out = total_return(df)
assert np.isclose(out["A"], 0.2) and np.isclose(out["B"], 0.1), out`],
    ] },

  { id: 'pd-value-counts-bins', track: 'pandas', diff: 1, title: 'Return Buckets',
    prompt: 'Given a Series of returns, bucket them into <code>(-inf, -0.02], (-0.02, 0], (0, 0.02], (0.02, inf)</code> with <code>pd.cut</code> and return the count in each bucket as a list of 4 ints in that order.',
    starter: py`import numpy as np
import pandas as pd

def bucket_counts(returns):
    pass
`,
    solution: py`import numpy as np
import pandas as pd

def bucket_counts(returns):
    b = pd.cut(returns, [-np.inf, -0.02, 0, 0.02, np.inf])
    return [int(x) for x in b.value_counts(sort=False).tolist()]
`,
    tests: [
      ['counts', py`assert bucket_counts(pd.Series([-0.05, -0.02, -0.01, 0.0, 0.01, 0.03, 0.04])) == [2, 2, 1, 2]`],
      ['empty bucket', py`assert bucket_counts(pd.Series([0.01, 0.015])) == [0, 0, 2, 0]`],
    ] },
  // ======================= ML & STATS =======================
  { id: 'ml-logreg', track: 'ML & Stats', diff: 2, title: 'Logistic Regression from Scratch',
    prompt: 'Fit logistic regression by batch gradient descent on the mean log-loss. <code>X</code> is n × p (no intercept column), <code>y</code> is 0/1. Return a 1-D array <code>[b0, b1, …, bp]</code> (intercept first). Use the gradient <code>Xᵀ(σ(Xb) − y)/n</code>.',
    starter: py`import numpy as np

def fit_logistic(X, y, lr=0.5, n_iter=3000):
    pass
`,
    solution: py`import numpy as np

def fit_logistic(X, y, lr=0.5, n_iter=3000):
    X = np.column_stack([np.ones(len(X)), np.asarray(X, dtype=float)])
    y = np.asarray(y, dtype=float)
    b = np.zeros(X.shape[1])
    for _ in range(n_iter):
        p = 1 / (1 + np.exp(-X @ b))
        b -= lr * X.T @ (p - y) / len(y)
    return b
`,
    tests: [
      ['recovers coefficients', py`
rng = np.random.default_rng(0)
X = rng.normal(size=(20000, 2))
true = np.array([0.5, 1.0, -2.0])
p = 1 / (1 + np.exp(-(true[0] + X @ true[1:])))
y = (rng.random(20000) < p).astype(float)
b = fit_logistic(X, y)
assert len(b) == 3, b
assert np.allclose(b, true, atol=0.1), b`],
      ['separates classes', py`
rng = np.random.default_rng(1)
X = np.vstack([rng.normal(-2, 1, (200, 1)), rng.normal(2, 1, (200, 1))])
y = np.r_[np.zeros(200), np.ones(200)]
b = fit_logistic(X, y)
pred = (b[0] + X[:, 0] * b[1]) > 0
assert (pred == y).mean() > 0.95`],
    ] },

  { id: 'ml-kmeans', track: 'ML & Stats', diff: 2, title: 'k-Means Clustering',
    prompt: 'Implement Lloyd’s k-means. Start from the given initial centroids <code>init</code> (k × d), alternate assignment and update until assignments stop changing (or <code>n_iter</code> rounds). Return <code>(centroids, labels)</code>. If a cluster becomes empty, keep its previous centroid.',
    starter: py`import numpy as np

def kmeans(X, init, n_iter=100):
    pass
`,
    solution: py`import numpy as np

def kmeans(X, init, n_iter=100):
    X = np.asarray(X, dtype=float)
    C = np.array(init, dtype=float)
    labels = None
    for _ in range(n_iter):
        d = ((X[:, None, :] - C[None, :, :]) ** 2).sum(-1)
        new = d.argmin(1)
        if labels is not None and np.array_equal(new, labels):
            break
        labels = new
        for k in range(len(C)):
            if np.any(labels == k):
                C[k] = X[labels == k].mean(0)
    return C, labels
`,
    tests: [
      ['three blobs', py`
rng = np.random.default_rng(2)
centers = np.array([[0, 0], [10, 0], [0, 10]], dtype=float)
X = np.vstack([c + rng.normal(size=(100, 2)) for c in centers])
C, labels = kmeans(X, X[[0, 100, 200]] + 3)
order = np.argsort(C[:, 0] + 2 * C[:, 1])
assert np.allclose(C[order], centers[np.argsort(centers[:, 0] + 2 * centers[:, 1])], atol=0.5), C
assert len(set(labels[:100])) == 1 and len(set(labels[100:200])) == 1`],
      ['labels shape', py`
C, labels = kmeans(np.array([[0.], [1.], [10.], [11.]]), np.array([[0.], [10.]]))
assert list(labels) == [0, 0, 1, 1] and np.allclose(C.ravel(), [0.5, 10.5])`],
    ] },

  { id: 'st-ewma-vol', track: 'ML & Stats', diff: 2, title: 'EWMA Volatility',
    prompt: 'Compute RiskMetrics-style EWMA variance of returns <code>r</code>: <code>s2[0] = r[0]²</code> and <code>s2[t] = λ·s2[t−1] + (1 − λ)·r[t]²</code>. Return the volatility <code>√s2</code> as a NumPy array.',
    starter: py`import numpy as np

def ewma_vol(r, lam=0.94):
    pass
`,
    solution: py`import numpy as np

def ewma_vol(r, lam=0.94):
    r = np.asarray(r, dtype=float)
    s2 = np.empty_like(r)
    s2[0] = r[0] ** 2
    for t in range(1, len(r)):
        s2[t] = lam * s2[t - 1] + (1 - lam) * r[t] ** 2
    return np.sqrt(s2)
`,
    tests: [
      ['small', py`assert np.allclose(ewma_vol([0.1, 0.0], lam=0.5), [0.1, np.sqrt(0.005)])`],
      ['vs pandas ewm', py`
r = np.random.default_rng(3).normal(0, 0.01, 500)
want = np.sqrt(pd.Series(r ** 2).ewm(alpha=0.06, adjust=False).mean().values)
assert np.allclose(ewma_vol(r, 0.94), want)`],
    ] },

  { id: 'st-ar1', track: 'ML & Stats', diff: 1, title: 'Fit an AR(1) & Half-Life',
    prompt: 'Given a series <code>x</code>, estimate <code>x[t] = c + φ·x[t−1] + ε</code> by OLS. Return <code>(c, phi, half_life)</code> where half-life = <code>ln(0.5)/ln(φ)</code> (assume 0 &lt; φ &lt; 1).',
    starter: py`import numpy as np

def fit_ar1(x):
    pass
`,
    solution: py`import numpy as np

def fit_ar1(x):
    x = np.asarray(x, dtype=float)
    A = np.column_stack([np.ones(len(x) - 1), x[:-1]])
    c, phi = np.linalg.lstsq(A, x[1:], rcond=None)[0]
    return float(c), float(phi), float(np.log(0.5) / np.log(phi))
`,
    tests: [
      ['simulated', py`
rng = np.random.default_rng(4)
x = np.zeros(20000)
for t in range(1, len(x)):
    x[t] = 1.0 + 0.8 * x[t - 1] + rng.normal()
c, phi, hl = fit_ar1(x)
assert abs(phi - 0.8) < 0.02 and abs(c - 1.0) < 0.1, (c, phi)
assert abs(hl - np.log(0.5) / np.log(phi)) < 1e-9`],
    ] },

  { id: 'st-bootstrap', track: 'ML & Stats', diff: 2, title: 'Bootstrap Confidence Interval',
    prompt: 'Return a percentile bootstrap <code>(lo, hi)</code> confidence interval for the MEAN of <code>x</code>: draw <code>n_boot</code> resamples of size n with replacement using <code>np.random.default_rng(seed)</code>, compute each mean, and take the <code>alpha/2</code> and <code>1 − alpha/2</code> quantiles. Vectorise (one call to <code>rng.integers</code>).',
    starter: py`import numpy as np

def bootstrap_ci(x, n_boot=5000, alpha=0.05, seed=0):
    pass
`,
    solution: py`import numpy as np

def bootstrap_ci(x, n_boot=5000, alpha=0.05, seed=0):
    x = np.asarray(x, dtype=float)
    idx = np.random.default_rng(seed).integers(0, len(x), size=(n_boot, len(x)))
    means = x[idx].mean(axis=1)
    lo, hi = np.quantile(means, [alpha / 2, 1 - alpha / 2])
    return float(lo), float(hi)
`,
    tests: [
      ['close to normal theory', py`
x = np.random.default_rng(5).normal(10, 2, 400)
lo, hi = bootstrap_ci(x)
se = x.std(ddof=1) / np.sqrt(len(x))
assert abs(lo - (x.mean() - 1.96 * se)) < 0.05 and abs(hi - (x.mean() + 1.96 * se)) < 0.05, (lo, hi)`],
      ['reproducible', py`
x = np.arange(50.)
assert bootstrap_ci(x, seed=7) == bootstrap_ci(x, seed=7)`],
      ['wider for higher confidence', py`
x = np.random.default_rng(6).normal(size=100)
a = bootstrap_ci(x, alpha=0.1); b = bootstrap_ci(x, alpha=0.01)
assert b[0] < a[0] and b[1] > a[1]`],
    ] },

  { id: 'st-pca', track: 'ML & Stats', diff: 2, title: 'PCA via SVD',
    prompt: 'Return <code>(components, ratio)</code>: the top <code>k</code> principal components of <code>X</code> (n × d) as a k × d array of unit vectors (rows), and the fraction of total variance each explains. Centre the columns first; use <code>np.linalg.svd</code>.',
    starter: py`import numpy as np

def pca(X, k):
    pass
`,
    solution: py`import numpy as np

def pca(X, k):
    X = np.asarray(X, dtype=float)
    Xc = X - X.mean(axis=0)
    _, s, Vt = np.linalg.svd(Xc, full_matrices=False)
    var = s ** 2
    return Vt[:k], var[:k] / var.sum()
`,
    tests: [
      ['dominant direction', py`
rng = np.random.default_rng(8)
t = rng.normal(size=2000)
X = np.column_stack([t, t, 0.1 * rng.normal(size=2000)])
comps, ratio = pca(X, 1)
assert comps.shape == (1, 3)
assert np.allclose(np.abs(comps[0]), [1 / np.sqrt(2), 1 / np.sqrt(2), 0], atol=0.02), comps
assert ratio[0] > 0.99`],
      ['orthonormal & eigenvalues', py`
X = np.random.default_rng(9).normal(size=(500, 4)) @ np.random.default_rng(10).normal(size=(4, 4))
comps, ratio = pca(X, 4)
assert np.allclose(comps @ comps.T, np.eye(4), atol=1e-8)
ev = np.sort(np.linalg.eigvalsh(np.cov(X, rowvar=False)))[::-1]
assert np.allclose(ratio, ev / ev.sum())`],
    ] },

  { id: 'ml-walk-forward', track: 'ML & Stats', diff: 2, title: 'Walk-Forward Splits',
    prompt: 'Time-series cross-validation. Return a list of <code>(train_idx, test_idx)</code> NumPy arrays for <code>n</code> observations: the final <code>n_splits × test_size</code> observations form consecutive test blocks (in order); each training set is every index before the test block minus a <code>gap</code> of observations immediately preceding it (an embargo).',
    starter: py`import numpy as np

def walk_forward(n, n_splits, test_size, gap=0):
    pass
`,
    solution: py`import numpy as np

def walk_forward(n, n_splits, test_size, gap=0):
    out = []
    start0 = n - n_splits * test_size
    for i in range(n_splits):
        s = start0 + i * test_size
        out.append((np.arange(0, max(0, s - gap)), np.arange(s, s + test_size)))
    return out
`,
    tests: [
      ['basic', py`
sp = walk_forward(10, 2, 2)
assert [list(a) for a, b in sp] == [[0, 1, 2, 3, 4, 5], [0, 1, 2, 3, 4, 5, 6, 7]]
assert [list(b) for a, b in sp] == [[6, 7], [8, 9]]`],
      ['gap', py`
sp = walk_forward(10, 2, 2, gap=1)
assert list(sp[0][0]) == [0, 1, 2, 3, 4] and list(sp[1][0]) == [0, 1, 2, 3, 4, 5, 6]`],
      ['no leakage', py`
for tr, te in walk_forward(100, 5, 10, gap=3):
    assert tr.max() < te.min() - 3`],
    ] },
];
