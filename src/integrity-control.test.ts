import assert from 'node:assert/strict';
import test from 'node:test';
import { createTranslationContract, errorDeltaGuidance, semanticErrorDeltas, selectCorrectionRoute } from './integrity-control.js';

test('translation contract keeps original authority and bounded regeneration/reanalysis', () => {
  assert.deepEqual(createTranslationContract('ja', 'en'), {
    mode: 'translate',
    sourceLanguage: 'en',
    targetLanguage: 'ja',
    preserveOriginalAuthority: true,
    maxSemanticRegenerations: 1,
    maxSourceReanalyses: 1
  });
});

test('semantic differences become typed critical error deltas', () => {
  const deltas = semanticErrorDeltas({
    equivalent: false,
    score: 0.6,
    targetLanguageMatch: false,
    criticalDifferences: ['negation removed', 'deadline changed from 2026-10-01 to 2026-10-02']
  });
  assert.deepEqual(deltas.map((delta) => delta.kind), ['wrong_language', 'polarity', 'quantity_time']);
  assert.match(errorDeltaGuidance(deltas), /\[wrong_language\]/);
  assert.match(errorDeltaGuidance(deltas), /\[polarity\]/);
  assert.match(errorDeltaGuidance(deltas), /\[quantity_time\]/);
});

test('first semantic failure routes to fresh regeneration', () => {
  const deltas = semanticErrorDeltas({ equivalent: false, score: 0.7, targetLanguageMatch: true, criticalDifferences: ['meaning differs'] });
  assert.equal(selectCorrectionRoute(deltas, 1), 'FRESH_REGENERATE');
});

test('unsupported ambiguity resolution routes to reanalysis', () => {
  const deltas = semanticErrorDeltas({ equivalent: false, score: 0.8, targetLanguageMatch: true, criticalDifferences: ['ambiguous referent was guessed'] });
  assert.equal(selectCorrectionRoute(deltas, 1), 'REANALYZE');
});

test('second failed attempt always fails closed', () => {
  const deltas = semanticErrorDeltas({ equivalent: false, score: 0.8, targetLanguageMatch: true, criticalDifferences: ['condition changed'] });
  assert.equal(selectCorrectionRoute(deltas, 2), 'FAIL_CLOSED');
});

test('clean verdict routes to pass', () => {
  assert.equal(selectCorrectionRoute(semanticErrorDeltas({ equivalent: true, score: 1, targetLanguageMatch: true, criticalDifferences: [] }), 1), 'PASS');
});
