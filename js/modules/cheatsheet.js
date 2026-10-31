import { h } from '../lib/util.js';

const HTML = String.raw`
<h2>Numbers to know cold</h2>
<table>
<tr><td>Normal quantiles</td><td>P(|Z|&lt;1) ≈ 68.3%, P(|Z|&lt;1.645) = 90%, P(|Z|&lt;1.96) = 95%, P(|Z|&lt;2.576) = 99%, P(|Z|&lt;3) ≈ 99.7%</td></tr>
<tr><td>Constants</td><td>e ≈ 2.718, 1/e ≈ 0.368, ln 2 ≈ 0.693, ln 10 ≈ 2.303, √2 ≈ 1.414, √3 ≈ 1.732, π ≈ 3.1416, √(2/π) ≈ 0.798, φ(0) = 1/√(2π) ≈ 0.399</td></tr>
<tr><td>Powers of 2</td><td>2¹⁰ = 1024, 2¹⁶ = 65,536, 2²⁰ ≈ 1.05M, 2³⁰ ≈ 1.07B</td></tr>
<tr><td>Fractions</td><td>1/6 = .1667, 1/7 = .142857, 1/8 = .125, 1/9 = .111, 1/11 = .0909, 1/12 = .0833, 1/16 = .0625</td></tr>
<tr><td>Rule of 72</td><td>Doubling time ≈ 72 / (rate in %)</td></tr>
<tr><td>Squares trick</td><td>(a ± b)² = a² ± 2ab + b²; e.g. 47² = 50² − 2·50·3 + 9 = 2209. n5² = n(n+1) followed by 25.</td></tr>
<tr><td>Dice</td><td>One die: mean 3.5, var 35/12 ≈ 2.92. Two dice sum: P(7)=6/36, P(k) = (6 − |k−7|)/36</td></tr>
</table>

<h2>Probability toolkit</h2>
<ul>
<li><b>Linearity of expectation</b> works without independence. Write counts as sums of indicators: E[#fixed points] = Σ P(i fixed) = 1.</li>
<li><b>First-step analysis</b>: define E<sub>s</sub> per state, condition on the first move, solve the linear system (HH: E = 6, HHH: 14, n-in-a-row: 2<sup>n+1</sup> − 2).</li>
<li><b>Symmetry</b>: the k-th card is as likely to be any card as the first; n uniforms split [0,1] into n+1 pieces of equal expected length 1/(n+1).</li>
<li><b>Complement</b>: P(at least one) = 1 − P(none).</li>
<li><b>Inclusion–exclusion</b>: P(∪A<sub>i</sub>) = ΣP(A<sub>i</sub>) − ΣP(A<sub>i</sub>A<sub>j</sub>) + … ; derangements D<sub>n</sub>/n! → 1/e.</li>
<li><b>Bayes</b>: P(A|B) = P(B|A)P(A) / P(B). Write a 2×2 table with 1000 people when in doubt.</li>
<li><b>Tower rule</b>: E[X] = E[E[X|Y]]; <b>total variance</b>: Var X = E[Var(X|Y)] + Var(E[X|Y]).</li>
<li><b>Order statistics of U(0,1)</b>: E[k-th smallest of n] = k/(n+1); max has CDF x<sup>n</sup>.</li>
<li><b>Coupon collector</b>: n·H<sub>n</sub> ≈ n ln n + 0.577n draws to see all n.</li>
<li><b>Martingales &amp; optional stopping</b>: fair game ⇒ E[X<sub>T</sub>] = X<sub>0</sub>. Gambler's ruin: P(hit N before 0 from i) = i/N; E[time] = i(N − i). Biased: P = (1 − (q/p)<sup>i</sup>)/(1 − (q/p)<sup>N</sup>).</li>
<li><b>Geometric probability</b>: draw the square/cube; probability = area of good region.</li>
<li><b>Expected value of a game with stopping</b>: backward induction — keep if current ≥ continuation value.</li>
<li><b>Wald's identity</b>: E[Σ<sub>i≤N</sub> X<sub>i</sub>] = E[N]·E[X] for a stopping time N.</li>
<li><b>Memorylessness</b>: geometric &amp; exponential. Min of exponentials with rates λ<sub>i</sub> is Exp(Σλ<sub>i</sub>); P(i first) = λ<sub>i</sub>/Σλ.</li>
</ul>

<h2>Distributions</h2>
<table>
<tr><th>Distribution</th><th>PMF / PDF</th><th>Mean</th><th>Variance</th></tr>
<tr><td>Bernoulli(p)</td><td>p, 1−p</td><td>p</td><td>p(1−p)</td></tr>
<tr><td>Binomial(n,p)</td><td>C(n,k)p<sup>k</sup>(1−p)<sup>n−k</sup></td><td>np</td><td>np(1−p)</td></tr>
<tr><td>Geometric(p) (# trials)</td><td>(1−p)<sup>k−1</sup>p</td><td>1/p</td><td>(1−p)/p²</td></tr>
<tr><td>Poisson(λ)</td><td>e<sup>−λ</sup>λ<sup>k</sup>/k!</td><td>λ</td><td>λ</td></tr>
<tr><td>Uniform(a,b)</td><td>1/(b−a)</td><td>(a+b)/2</td><td>(b−a)²/12</td></tr>
<tr><td>Exponential(λ)</td><td>λe<sup>−λx</sup></td><td>1/λ</td><td>1/λ²</td></tr>
<tr><td>Normal(μ,σ²)</td><td>φ((x−μ)/σ)/σ</td><td>μ</td><td>σ²</td></tr>
<tr><td>Lognormal</td><td>log X ~ N(μ,σ²)</td><td>e<sup>μ+σ²/2</sup></td><td>(e<sup>σ²</sup>−1)e<sup>2μ+σ²</sup></td></tr>
</table>
<p class="small muted">Sum of independent normals is normal; sum of Poissons is Poisson; E[e<sup>X</sup>] = e<sup>μ+σ²/2</sup> for normal X.</p>

<h2>Statistics &amp; ML</h2>
<ul>
<li><b>CLT</b>: x̄ ≈ N(μ, σ²/n). Standard error = σ/√n; to halve a CI you need 4× data.</li>
<li><b>Unbiased sample variance</b> divides by n − 1.</li>
<li><b>Hypothesis tests</b>: p-value = P(data at least this extreme | H<sub>0</sub>). Type I = false positive (α), Type II = false negative (β), power = 1 − β. Multiple testing ⇒ Bonferroni α/m.</li>
<li><b>OLS</b>: β̂ = (XᵀX)<sup>−1</sup>Xᵀy. Simple regression slope = ρ·σ<sub>y</sub>/σ<sub>x</sub> = Cov(x,y)/Var(x); R² = ρ². β<sub>y|x</sub>·β<sub>x|y</sub> = ρ².</li>
<li><b>OLS assumptions</b>: linearity, exogeneity E[ε|X]=0, homoskedasticity, no perfect collinearity, (normal errors for exact inference). Violations ⇒ robust SEs, GLS, IV…</li>
<li><b>Multicollinearity</b> inflates coefficient variance (VIF), not bias. Ridge (L2) shrinks; Lasso (L1) selects.</li>
<li><b>Bias–variance</b>: MSE = bias² + variance + noise. Use out-of-sample / walk-forward validation in finance (no shuffling time series!).</li>
<li><b>Correlation</b> matrices must be PSD; corr(X,Z) ≥ cos(θ<sub>XY</sub> + θ<sub>YZ</sub>). Uncorrelated ≠ independent (Z and Z²).</li>
<li><b>Look-ahead bias, survivorship bias, overfitting</b> — mention them in any backtest discussion.</li>
</ul>

<h2>Markets &amp; finance</h2>
<ul>
<li><b>Returns</b>: simple r = P<sub>t</sub>/P<sub>t−1</sub> − 1 (aggregates across assets); log r = ln(P<sub>t</sub>/P<sub>t−1</sub>) (aggregates across time).</li>
<li><b>Vol scaling</b>: σ<sub>T</sub> = σ<sub>daily</sub>·√T; annualise with √252. 16% annual ≈ 1% daily.</li>
<li><b>Sharpe</b> = (mean excess return / std)·√252 for daily data.</li>
<li><b>Kelly</b>: f* = (bp − q)/b; even-money ⇒ p − q. Continuous: f* = μ/σ².</li>
<li><b>Risk-neutral pricing</b>: price = discounted expected payoff under q where the stock grows at r. One-step binomial: q = (S(1+r) − S<sub>d</sub>)/(S<sub>u</sub> − S<sub>d</sub>).</li>
<li><b>Put–call parity</b>: C − P = S − K·e<sup>−rT</sup>.</li>
<li><b>Quick option approximations</b>: ATM call ≈ 0.4·σ√T·S; ATM straddle ≈ 0.8·σ√T·S.</li>
<li><b>Market making</b>: quote around your fair value; a trade against you is information — move your market toward it. Width reflects uncertainty; never quote a market you wouldn't trade on both sides.</li>
<li><b>Expected value vs. utility</b>: be ready to explain why you'd decline a +EV bet with ruinous variance.</li>
</ul>

<h2>pandas / NumPy idioms</h2>
<table>
<tr><td>Per-group transform</td><td><code>df.groupby("tkr")["px"].transform(lambda s: s.rolling(20).mean())</code></td></tr>
<tr><td>Long → wide</td><td><code>df.pivot(index="date", columns="tkr", values="close")</code></td></tr>
<tr><td>Wide → long</td><td><code>wide.stack()</code> / <code>df.melt(id_vars=[...])</code></td></tr>
<tr><td>Returns</td><td><code>px.pct_change()</code>, <code>np.log(px).diff()</code></td></tr>
<tr><td>As-of join</td><td><code>pd.merge_asof(trades, quotes, on="time", by="tkr")</code> (both sorted by time)</td></tr>
<tr><td>Resample</td><td><code>s.resample("5min").ohlc()</code>, <code>.resample("W").last()</code></td></tr>
<tr><td>Arg-max per group</td><td><code>df.loc[df.groupby("g")["x"].idxmax()]</code></td></tr>
<tr><td>Bucketing</td><td><code>pd.cut</code> (fixed edges) / <code>pd.qcut</code> (quantiles)</td></tr>
<tr><td>Rolling (NumPy)</td><td><code>c = np.cumsum(np.insert(x, 0, 0)); (c[k:] - c[:-k]) / k</code></td></tr>
<tr><td>Running max / drawdown</td><td><code>np.maximum.accumulate(eq)</code></td></tr>
<tr><td>Broadcasting</td><td><code>(A[:, None, :] - B[None, :, :])</code> → n × m × d</td></tr>
<tr><td>Avoid</td><td><code>df.iterrows()</code>, chained assignment, Python loops over rows</td></tr>
</table>

<h2>How to answer in the room</h2>
<ul>
<li>Restate the problem and assumptions (fair coin? replacement? independence?).</li>
<li>Try small cases (n = 1, 2, 3) and look for a pattern; sanity-check limits.</li>
<li>Say your approach before computing; give a quick estimate, then refine.</li>
<li>When stuck, name a tool: symmetry, linearity, recursion/states, complement, conditioning.</li>
<li>For coding: clarify inputs/edge cases, state complexity, write clean code, test with an example.</li>
<li>Check the answer: is the probability in [0,1]? Does the EV pass a smell test?</li>
</ul>
`;

export function render(root) {
  root.append(h('h1', {}, 'Cheat Sheet'), h('p', { class: 'sub' }, 'The formulas, facts and idioms that come up again and again. Read it the night before.'),
    h('div', { class: 'card cheat', html: HTML }));
}
