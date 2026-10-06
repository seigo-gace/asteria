import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyTranslationRisk } from './risk-router.js';
import { inspectProtectedLiterals } from './quality.js';

const classify = (bodies: string[]) => classifyTranslationRisk(bodies, inspectProtectedLiterals);

test('plain single-script sentence stays simple', () => {
  const risk = classify(['Please translate this sentence.']);
  assert.equal(risk.riskClass, 'simple');
  assert.equal(risk.requiresFocusedMeaningAcquisition, false);
  assert.equal(risk.requiresContextSelection, false);
});

test('multi-segment reference context is complex without inventing a length threshold', () => {
  const risk = classify(['Project Alpha is ready.', 'It will launch after approval.']);
  assert.equal(risk.riskClass, 'complex');
  assert.ok(risk.signals.includes('multi_segment'));
  assert.ok(risk.signals.includes('reference_context'));
  assert.equal(risk.requiresContextSelection, true);
  assert.equal(risk.codePoints, [...'Project Alpha is ready.\nIt will launch after approval.'].length);
});

test('negation condition and protected values route to high-risk', () => {
  const risk = classify(['Do not publish this unless approved before 2026-12-31.']);
  assert.equal(risk.riskClass, 'high-risk');
  assert.ok(risk.signals.includes('negation'));
  assert.ok(risk.signals.includes('condition'));
  assert.ok(risk.signals.includes('quantity_or_protected_value'));
  assert.equal(risk.requiresFocusedMeaningAcquisition, true);
});

test('explicit ambiguity takes precedence over other risk signals', () => {
  const risk = classify(['The owner is unclear; do not guess who it means.']);
  assert.equal(risk.riskClass, 'ambiguous');
  assert.ok(risk.signals.includes('explicit_ambiguity'));
  assert.ok(risk.signals.includes('negation'));
  assert.equal(risk.requiresFocusedMeaningAcquisition, true);
});

test('protected code and URL are excluded from script mixing while still traced as protected risk', () => {
  const risk = classify(['日本語の本文です。 `const x = 1` https://example.com']);
  assert.deepEqual(risk.scripts, ['cjk']);
  assert.ok(risk.signals.includes('quantity_or_protected_value'));
  assert.equal(risk.signals.includes('mixed_script'), false);
});

test('long text is traced but does not change class without an authority-defined threshold', () => {
  const source = 'A'.repeat(5000);
  const risk = classify([source]);
  assert.equal(risk.codePoints, 5000);
  assert.equal(risk.riskClass, 'simple');
});
