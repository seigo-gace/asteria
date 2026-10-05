import assert from 'node:assert/strict';
import test from 'node:test';
import { PROFILE_VERSION, translateSegments } from './engine.js';

const QWEN = 'qwen3//models/Qwen3-8B-Q4_K_M.gguf';
const QWEN_RESPONSE = '/models/Qwen3-8B-Q4_K_M.gguf';
const GRANITE_RESPONSE = '/models/granite-4.2-8b-Q4_K_M.gguf';
const CONFIG = { aiCore: { baseUrl: 'http://127.0.0.1:18080', apiKey: 'test-key' }, timeoutMs: 30_000 };
const MEANING_EN = JSON.stringify({ detected_language: 'en', claims: ['same meaning'], constraints: [], conditions: [], entities: [], quantities: [], uncertainties: [] });
const REANALYZED_EN = JSON.stringify({ detected_language: 'en', claims: ['same meaning'], constraints: [], conditions: [], entities: [], quantities: [], uncertainties: ['referent remains unresolved'] });

type RequestBody = { model: string; messages: Array<{ role: string; content: string }> };
function body(init: RequestInit | undefined): RequestBody { return JSON.parse(String(init?.body)) as RequestBody; }
function user(request: RequestBody): string { return request.messages.find((item) => item.role === 'user')?.content ?? ''; }
function system(request: RequestBody): string { return request.messages.find((item) => item.role === 'system')?.content ?? ''; }
function translation(request: RequestBody): boolean { return request.model === QWEN && system(request).includes('translation-only runtime'); }
function normalization(request: RequestBody): boolean { return request.model === QWEN && system(request).includes('meaning-preserving source normalizer'); }
function normalizationGate(request: RequestBody): boolean { return system(request).includes('normalization-equivalence judge'); }
function reanalysis(request: RequestBody): boolean { return request.model === QWEN && system(request).includes('fresh-context source reanalyst'); }
function evidenceGate(request: RequestBody): boolean { return system(request).includes('evidence-integrity judge'); }
function response(model: string, content: string): Response { return new Response(JSON.stringify({ model, choices: [{ message: { content } }], usage: { prompt_tokens: 12, completion_tokens: 8 } }), { status: 200, headers: { 'content-type': 'application/json' } }); }
function pass(): string { return JSON.stringify({ equivalent: true, score: 1, target_language_match: true, critical_differences: [] }); }
function evidencePass(): string { return JSON.stringify({ valid: true, score: 1, unsupported_evidence: [], contradictions: [], invented_resolutions: [] }); }
function normalizationReject(): string { return JSON.stringify({ equivalent: false, score: 0.5, same_language: true, critical_differences: ['legacy integrity test keeps ORIGINAL evidence'] }); }
function normalizationBatch(request: RequestBody): string { return user(request).match(/NORMALIZATION_BATCH_BEGIN\n([\s\S]*)\nNORMALIZATION_BATCH_END$/)?.[1] ?? ''; }
function req(): Record<string, unknown> { return { request_id: 'integrity-1', profile_version: PROFILE_VERSION, source_language: 'en', target_language: 'ja', segments: [{ id: 's1', text: 'Do not publish this before 2026-12-31. The owner is unclear.' }] }; }

test('semantic retry is driven by typed error-delta guidance and restarts from original', async () => {
  const old = globalThis.fetch;
  let translations = 0;
  let verdicts = 0;
  globalThis.fetch = async (_input, init) => {
    const request = body(init);
    if (normalization(request)) return response(QWEN_RESPONSE, normalizationBatch(request));
    if (translation(request)) {
      translations += 1;
      const content = user(request);
      const batch = content.match(/BEGIN_BATCH\n([\s\S]*)\nEND_BATCH$/)?.[1] ?? '';
      if (translations === 2) { assert.match(content, /STRATEGY=semantic_retry/); assert.match(content, /\[polarity\] negation removed/); }
      return response(QWEN_RESPONSE, batch);
    }
    if (request.model === QWEN) return response(QWEN_RESPONSE, MEANING_EN);
    if (normalizationGate(request)) return response(GRANITE_RESPONSE, normalizationReject());
    if (evidenceGate(request)) return response(GRANITE_RESPONSE, evidencePass());
    verdicts += 1;
    return response(GRANITE_RESPONSE, verdicts === 1 ? JSON.stringify({ equivalent: false, score: 0.6, target_language_match: true, critical_differences: ['negation removed'] }) : pass());
  };
  try {
    const out = await translateSegments(req(), CONFIG);
    assert.equal(translations, 2);
    assert.equal(verdicts, 2);
    assert.equal(out.usage.evidence_validations, 1);
    assert.equal(out.usage.normalization_rejects, 1);
    assert.equal(out.usage.source_reanalyses, 0);
    assert.equal(out.usage.semantic_retries, 1);
  } finally { globalThis.fetch = old; }
});

test('unsupported ambiguity guessing triggers fresh source reanalysis and ORIGINAL-anchored regeneration', async () => {
  const old = globalThis.fetch;
  let translations = 0;
  let verdicts = 0;
  let reanalyses = 0;
  let evidenceChecks = 0;
  globalThis.fetch = async (_input, init) => {
    const request = body(init);
    if (normalization(request)) return response(QWEN_RESPONSE, normalizationBatch(request));
    if (translation(request)) {
      translations += 1;
      const content = user(request);
      const batch = content.match(/BEGIN_BATCH\n([\s\S]*)\nEND_BATCH$/)?.[1] ?? '';
      if (translations === 2) { assert.match(content, /STRATEGY=semantic_retry/); assert.match(content, /REANALYZED_SOURCE_EVIDENCE=/); assert.match(content, /referent remains unresolved/); }
      return response(QWEN_RESPONSE, batch);
    }
    if (request.model === QWEN) {
      if (reanalysis(request)) { reanalyses += 1; assert.match(user(request), /ambiguous referent was guessed without evidence/); assert.doesNotMatch(user(request), /PREVIOUS_TRANSLATION/); return response(QWEN_RESPONSE, REANALYZED_EN); }
      return response(QWEN_RESPONSE, MEANING_EN);
    }
    if (normalizationGate(request)) return response(GRANITE_RESPONSE, normalizationReject());
    if (evidenceGate(request)) { evidenceChecks += 1; return response(GRANITE_RESPONSE, evidencePass()); }
    verdicts += 1;
    return response(GRANITE_RESPONSE, verdicts === 1 ? JSON.stringify({ equivalent: false, score: 0.7, target_language_match: true, critical_differences: ['ambiguous referent was guessed without evidence'] }) : pass());
  };
  try {
    const out = await translateSegments(req(), CONFIG);
    assert.equal(translations, 2);
    assert.equal(verdicts, 2);
    assert.equal(reanalyses, 1);
    assert.equal(evidenceChecks, 2);
    assert.equal(out.usage.source_reanalyses, 1);
    assert.equal(out.usage.evidence_validations, 2);
    assert.equal(out.usage.semantic_retries, 1);
  } finally { globalThis.fetch = old; }
});

test('unsupported source evidence fails closed before optional normalization or translation generation', async () => {
  const old = globalThis.fetch;
  let translations = 0;
  let normalizations = 0;
  let evidenceChecks = 0;
  globalThis.fetch = async (_input, init) => {
    const request = body(init);
    if (normalization(request)) { normalizations += 1; throw new Error('normalization must not run'); }
    if (translation(request)) { translations += 1; throw new Error('translation must not run'); }
    if (request.model === QWEN) return response(QWEN_RESPONSE, MEANING_EN);
    if (evidenceGate(request)) { evidenceChecks += 1; return response(GRANITE_RESPONSE, JSON.stringify({ valid: false, score: 0.2, unsupported_evidence: ['Evidence invented approval.'], contradictions: [], invented_resolutions: [] })); }
    return response(GRANITE_RESPONSE, pass());
  };
  try {
    await assert.rejects(() => translateSegments(req(), CONFIG), (error: unknown) => (error as { code?: string }).code === 'TRANSLATION_EVIDENCE_INTEGRITY_FAILED');
    assert.equal(evidenceChecks, 1);
    assert.equal(normalizations, 0);
    assert.equal(translations, 0);
  } finally { globalThis.fetch = old; }
});

test('reanalysis evidence that is not grounded in ORIGINAL fails closed before retry generation', async () => {
  const old = globalThis.fetch;
  let translations = 0;
  let verdicts = 0;
  let evidenceChecks = 0;
  globalThis.fetch = async (_input, init) => {
    const request = body(init);
    if (normalization(request)) return response(QWEN_RESPONSE, normalizationBatch(request));
    if (translation(request)) { translations += 1; const batch = user(request).match(/BEGIN_BATCH\n([\s\S]*)\nEND_BATCH$/)?.[1] ?? ''; return response(QWEN_RESPONSE, batch); }
    if (request.model === QWEN) return response(QWEN_RESPONSE, reanalysis(request) ? REANALYZED_EN : MEANING_EN);
    if (normalizationGate(request)) return response(GRANITE_RESPONSE, normalizationReject());
    if (evidenceGate(request)) {
      evidenceChecks += 1;
      if (evidenceChecks === 1) return response(GRANITE_RESPONSE, evidencePass());
      return response(GRANITE_RESPONSE, JSON.stringify({ valid: false, score: 0.3, unsupported_evidence: [], contradictions: [], invented_resolutions: ['Reanalysis guessed the unresolved owner.'] }));
    }
    verdicts += 1;
    return response(GRANITE_RESPONSE, JSON.stringify({ equivalent: false, score: 0.7, target_language_match: true, critical_differences: ['ambiguous referent was guessed without evidence'] }));
  };
  try {
    await assert.rejects(() => translateSegments(req(), CONFIG), (error: unknown) => (error as { code?: string }).code === 'TRANSLATION_EVIDENCE_INTEGRITY_FAILED');
    assert.equal(translations, 1);
    assert.equal(verdicts, 1);
    assert.equal(evidenceChecks, 2);
  } finally { globalThis.fetch = old; }
});
