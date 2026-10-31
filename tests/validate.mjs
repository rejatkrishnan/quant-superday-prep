// Data + logic validation. Run: node tests/validate.mjs
import assert from 'node:assert/strict';
import { PROB_QUESTIONS } from '../js/data/probability.js';
import { BRAINTEASERS } from '../js/data/brainteasers.js';
import { CODING_PROBLEMS } from '../js/data/coding.js';
import { FERMI } from '../js/data/fermi.js';
import { parseAnswer, gradeNumeric } from '../js/lib/util.js';
import { makeSequence } from '../js/modules/sequences.js';
import { makeGenerated } from '../js/modules/probability.js';
import { makeProblem } from '../js/modules/mentalmath.js';

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; } catch (e) { console.error(`✗ ${name}\n  ${e.message}`); process.exitCode = 1; }
}
const unique = (arr, label) => assert.equal(new Set(arr).size, arr.length, `duplicate ids in ${label}`);

test('probability bank', () => {
  unique(PROB_QUESTIONS.map((q) => q.id), 'probability');
  for (const q of PROB_QUESTIONS) {
    assert.ok(q.q && q.sol && q.hint && q.topic, `${q.id} missing fields`);
    assert.ok(Number.isFinite(q.ans), `${q.id} ans not finite`);
    assert.ok([1, 2, 3].includes(q.diff), `${q.id} bad diff`);
  }
});

test('brainteasers', () => {
  unique(BRAINTEASERS.map((b) => b.id), 'brainteasers');
  for (const b of BRAINTEASERS) {
    assert.ok(b.title && b.q && b.answer && b.sol && Array.isArray(b.tags), `${b.id} missing fields`);
    if ('ans' in b) assert.ok(Number.isFinite(b.ans), `${b.id} ans`);
  }
});

test('coding problems', () => {
  unique(CODING_PROBLEMS.map((p) => p.id), 'coding');
  for (const p of CODING_PROBLEMS) {
    assert.ok(p.title && p.prompt && p.starter && p.solution && p.tests.length, `${p.id} missing fields`);
    for (const t of p.tests) assert.ok(Array.isArray(t) && t.length === 2, `${p.id} malformed test`);
  }
});

test('fermi', () => {
  unique(FERMI.map((f) => f.id), 'fermi');
  for (const f of FERMI) assert.ok(f.v > 0 && f.q, f.id);
});

test('answer parser', () => {
  const cases = [
    ['1/6', 1 / 6], ['0.25', 0.25], ['25%', 0.25], ['2^10', 1024], ['2**10', 1024], ['1-(5/6)^4', 1 - (5 / 6) ** 4],
    ['sqrt(2/pi)', Math.sqrt(2 / Math.PI)], ['e^-3', Math.exp(-3)], ['exp(-3)', Math.exp(-3)], ['3,990', 3990],
    ['-2^2', -4], ['2pi', 2 * Math.PI], ['5!', 120], ['161/36', 161 / 36], ['1e3', 1000], ['.5', 0.5], ['(1+2)*3', 9],
    ['14/3', 14 / 3], ['ln(2)', Math.log(2)], [' 7 ', 7],
  ];
  for (const [s, v] of cases) assert.ok(Math.abs(parseAnswer(s) - v) < 1e-12, `${s} -> ${parseAnswer(s)} (want ${v})`);
  for (const bad of ['', 'abc', '1/', '((2)', '2 3x']) assert.ok(Number.isNaN(parseAnswer(bad)), `"${bad}" should be invalid`);
});

test('grading', () => {
  assert.equal(gradeNumeric('0.1667', 1 / 6), 'correct');
  assert.equal(gradeNumeric('0.17', 1 / 6), 'close');
  assert.equal(gradeNumeric('0.5', 1 / 6), 'wrong');
  assert.equal(gradeNumeric('0', 0), 'correct');
  assert.equal(gradeNumeric('hello', 1), 'invalid');
  assert.equal(gradeNumeric('23', 23, 0), 'correct');
  assert.equal(gradeNumeric('24', 23, 0), 'close');
});

test('every curated answer is accepted when typed exactly', () => {
  for (const q of PROB_QUESTIONS) assert.equal(gradeNumeric(String(q.ans), q.ans, q.tol ?? 0.005), 'correct', q.id);
});

test('sequence generators', () => {
  for (const level of ['mixed', '1', '2', '3', 'classic']) {
    for (let i = 0; i < 2000; i++) {
      const s = makeSequence(level);
      assert.ok(s.shown.length >= 3 && s.shown.every(Number.isInteger) && Number.isInteger(s.ans), JSON.stringify(s));
      assert.ok(s.rule, 'missing rule');
    }
  }
});

test('probability generators', () => {
  for (let i = 0; i < 3000; i++) {
    const q = makeGenerated();
    assert.ok(Number.isFinite(q.ans) && q.ans >= 0, `${q.id}: ${q.ans}`);
    assert.ok(q.q && q.sol && q.hint, q.id);
    if (/probability/i.test(q.q)) assert.ok(q.ans <= 1 + 1e-12, `${q.id} prob > 1`);
  }
});

test('mental math generator', () => {
  const ops = ['add', 'sub', 'mul', 'div', 'pct', 'dec', 'frac', 'sq', 'big'];
  for (let i = 0; i < 5000; i++) {
    const p = makeProblem(ops);
    assert.ok(p.text && Number.isFinite(p.answer), JSON.stringify(p));
    // Answers must be typeable exactly (no repeating decimals)
    assert.ok(Math.abs(Number(String(p.answer)) - p.answer) < 1e-9 && String(p.answer).length <= 10, JSON.stringify(p));
  }
});

console.log(`${passed} test groups passed${process.exitCode ? ' (with failures above)' : ''}`);
