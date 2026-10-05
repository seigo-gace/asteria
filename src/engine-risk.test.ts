import assert from 'node:assert/strict';
import test from 'node:test';
import { PROFILE_VERSION, translateSegments } from './engine.js';

const QWEN = 'qwen3//models/Qwen3-8B-Q4_K_M.gguf';
const QWEN_RESPONSE = '/models/Qwen3-8B-Q4_K_M.gguf';
const GRANITE_RESPONSE = '/models/granite-4.2-8b-Q4_K_M.gguf';
const CONFIG = { aiCore: { baseUrl: 'http://127.0.0.1:18080', apiKey: 'test-key' }, timeoutMs: 30_000 };
const MEANING_EN = JSON.stringify({ detected_language: 'en', claims: ['same meaning'], constraints: [], conditions: [], entities: [], quantities: [], uncertainties: [] });

type RequestBody = { model: string; messages: Array<{ role: string; content: string }> };
function body(init: RequestInit | undefined): RequestBody { return JSON.parse(String(init?.body)) as RequestBody; }
function user(request: RequestBody): string { return request.messages.find((item) => item.role === 'user')?.content ?? ''; }
function system(request: RequestBody): string { return request.messages.find((item) => item.role === 'system')?.content ?? ''; }
function translation(request: RequestBody): boolean { return request.model === QWEN && system(request).includes('translation-only runtime'); }
function normalization(request: RequestBody): boolean { return request.model === QWEN && system(request).includes('meaning-preserving source normalizer'); }
function response(model: string, content: string): Response { return new Response(JSON.stringify({ model, choices: [{ message: { content } }], usage: { prompt_tokens: 12, completion_tokens: 8 } }), { status: 200, headers: { 'content-type': 'application/json' } }); }
function evidencePass(): string { return JSON.stringify({ valid: true, score: 1, unsupported_evidence: [], contradictions: [], invented_resolutions: [] }); }
function semanticPass(): string { return JSON.stringify({ equivalent: true, score: 1, target_language_match: true, critical_differences: [] }); }
function normalizationPass(): string { return JSON.stringify({ equivalent: true, score: 1, same_language: true, critical_differences: [] }); }
function normalizationFail(): string { return JSON.stringify({ equivalent: false, score: 0.4, same_language: true, critical_differences: ['negation changed'] }); }

async function run(text: string, normalizationAccepted = true): Promise<{ out: Awaited<ReturnType<typeof translateSegments>>; translationRequest: RequestBody; meaningRequests: RequestBody[] }> {
  const old = globalThis.fetch;
  let translationRequest: RequestBody | undefined;
  const meaningRequests: RequestBody[] = [];
  globalThis.fetch = async (_input, init) => {
    const request = body(init);
    if (normalization(request)) {
      const batch = user(request).match(/NORMALIZATION_BATCH_BEGIN\n([\s\S]*)\nNORMALIZATION_BATCH_END$/)?.[1] ?? '';
      const normalized = normalizationAccepted ? batch : batch.replace('Do not publish', 'Publish');
      return response(QWEN_RESPONSE, normalized);
    }
    if (translation(request)) {
      translationRequest = request;
      const batch = user(request).match(/BEGIN_BATCH\n([\s\S]*)\nEND_BATCH$/)?.[1] ?? '';
      return response(QWEN_RESPONSE, batch);
    }
    if (request.model === QWEN) {
      meaningRequests.push(request);
      return response(QWEN_RESPONSE, MEANING_EN);
    }
    if (system(request).includes('normalization-equivalence judge')) return response(GRANITE_RESPONSE, normalizationAccepted ? normalizationPass() : normalizationFail());
    if (system(request).includes('evidence-integrity judge')) return response(GRANITE_RESPONSE, evidencePass());
    return response(GRANITE_RESPONSE, semanticPass());
  };
  try {
    const out = await translateSegments({ request_id: 'risk-route', profile_version: PROFILE_VERSION, source_language: 'en', target_language: 'ja', segments: [{ id: 's1', text }] }, CONFIG);
    assert.ok(translationRequest);
    return { out, translationRequest, meaningRequests };
  } finally { globalThis.fetch = old; }
}

test('high-risk source uses gated normalization after ORIGINAL evidence and risk-focused generation', async () => {
  const { out, translationRequest, meaningRequests } = await run('Do not publish this unless approved before 2026-12-31.');
  assert.match(user(translationRequest), /STRATEGY=risk_focused/);
  assert.match(user(translationRequest), /RISK_CLASS=high-risk/);
  assert.match(user(translationRequest), /NORMALIZATION_ATTEMPTED=1/);
  assert.match(user(translationRequest), /NORMALIZATION_ACCEPTED=1/);
  assert.match(user(translationRequest), /VERIFIED_SOURCE_EVIDENCE=/);
  assert.ok(meaningRequests.length >= 3);
  assert.match(user(meaningRequests[0]!), /Do not publish/);
  assert.equal(out.usage.risk_class, 'high-risk');
  assert.equal(out.usage.risk_focused_generations, 1);
  assert.equal(out.usage.normalization_attempts, 1);
  assert.equal(out.usage.normalization_accepts, 1);
  assert.equal(out.usage.normalization_rejects, 0);
  assert.equal(out.usage.normalization_validations, 1);
  assert.equal(out.usage.evidence_validations, 2);
  assert.equal(out.usage.calls, 9);
  assert.equal(out.usage.external_api_calls, 0);
});

test('normalization semantic rejection discards candidate and retains ORIGINAL evidence', async () => {
  const original = 'Do not publish this unless approved before 2026-12-31.';
  const { out, translationRequest, meaningRequests } = await run(original, false);
  assert.equal(out.usage.normalization_attempts, 1);
  assert.equal(out.usage.normalization_accepts, 0);
  assert.equal(out.usage.normalization_rejects, 1);
  assert.equal(out.usage.normalization_validations, 1);
  assert.equal(out.usage.evidence_validations, 1);
  assert.equal(out.usage.calls, 7);
  assert.match(user(translationRequest), /NORMALIZATION_ACCEPTED=0/);
  assert.match(user(meaningRequests[0]!), /Do not publish/);
  assert.equal(meaningRequests.length, 2);
});

test('quantity-only high-risk input stays risk-focused without unnecessary normalization', async () => {
  const { out, translationRequest } = await run('Keep 2026-12-31 and 95% unchanged.');
  assert.match(user(translationRequest), /STRATEGY=risk_focused/);
  assert.match(user(translationRequest), /NORMALIZATION_ATTEMPTED=0/);
  assert.equal(out.usage.risk_class, 'high-risk');
  assert.equal(out.usage.normalization_attempts, 0);
  assert.equal(out.usage.calls, 5);
});

test('simple source keeps existing document generation path without normalization overhead', async () => {
  const { out, translationRequest } = await run('Hello world.');
  assert.match(user(translationRequest), /STRATEGY=document/);
  assert.doesNotMatch(user(translationRequest), /RISK_CLASS=/);
  assert.equal(out.usage.risk_class, 'simple');
  assert.equal(out.usage.risk_focused_generations, 0);
  assert.equal(out.usage.normalization_attempts, 0);
  assert.equal(out.usage.normalization_accepts, 0);
  assert.equal(out.usage.normalization_rejects, 0);
  assert.equal(out.usage.normalization_validations, 0);
  assert.equal(out.usage.evidence_validations, 1);
  assert.equal(out.usage.calls, 5);
  assert.equal(out.usage.external_api_calls, 0);
});
