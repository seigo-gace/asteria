import assert from 'node:assert/strict';
import test from 'node:test';
import { PROFILE_VERSION, translateSegments } from './engine.js';
import type { JapaneseLanguageIntelligence } from './japanese-language-intelligence.js';

const QWEN = 'qwen3//models/Qwen3-8B-Q4_K_M.gguf';
const QWEN_RESPONSE = '/models/Qwen3-8B-Q4_K_M.gguf';
const GRANITE_RESPONSE = '/models/granite-4.2-8b-Q4_K_M.gguf';
type RequestBody = { model: string; messages: Array<{ role: string; content: string }> };
function body(init: RequestInit | undefined): RequestBody { return JSON.parse(String(init?.body)) as RequestBody; }
function user(request: RequestBody): string { return request.messages.find((item) => item.role === 'user')?.content ?? ''; }
function system(request: RequestBody): string { return request.messages.find((item) => item.role === 'system')?.content ?? ''; }
function response(model: string, content: string): Response { return new Response(JSON.stringify({ model, choices: [{ message: { content } }], usage: { prompt_tokens: 10, completion_tokens: 5 } }), { status: 200, headers: { 'content-type': 'application/json' } }); }
function evidencePass(): string { return JSON.stringify({ valid: true, score: 1, unsupported_evidence: [], contradictions: [], invented_resolutions: [] }); }
function semanticPass(): string { return JSON.stringify({ equivalent: true, score: 1, target_language_match: true, critical_differences: [] }); }
function normalizationPass(): string { return JSON.stringify({ equivalent: true, score: 1, same_language: true, critical_differences: [] }); }

async function run(sourceLanguage: 'ja' | 'en', text: string, adapter: JapaneseLanguageIntelligence): Promise<{ out: Awaited<ReturnType<typeof translateSegments>>; translationRequest: RequestBody; adapterCalls: number }> {
  const oldFetch = globalThis.fetch;
  let translationRequest: RequestBody | undefined;
  let adapterCalls = 0;
  const wrapped: JapaneseLanguageIntelligence = { analyze: async (originals) => { adapterCalls += 1; return adapter.analyze(originals); } };
  const meaning = JSON.stringify({ detected_language: sourceLanguage, claims: ['same meaning'], constraints: [], conditions: [], entities: [], quantities: [], uncertainties: [] });
  globalThis.fetch = async (_input, init) => {
    const request = body(init);
    if (request.model === QWEN && system(request).includes('meaning-preserving source normalizer')) {
      const batch = user(request).match(/NORMALIZATION_BATCH_BEGIN\n([\s\S]*)\nNORMALIZATION_BATCH_END$/)?.[1] ?? '';
      return response(QWEN_RESPONSE, batch);
    }
    if (request.model === QWEN && system(request).includes('translation-only runtime')) {
      translationRequest = request;
      const batch = user(request).match(/BEGIN_BATCH\n([\s\S]*)\nEND_BATCH$/)?.[1] ?? '';
      return response(QWEN_RESPONSE, batch);
    }
    if (request.model === QWEN) return response(QWEN_RESPONSE, meaning);
    if (system(request).includes('normalization-equivalence judge')) return response(GRANITE_RESPONSE, normalizationPass());
    if (system(request).includes('evidence-integrity judge')) return response(GRANITE_RESPONSE, evidencePass());
    return response(GRANITE_RESPONSE, semanticPass());
  };
  try {
    const out = await translateSegments({ request_id: 'djpmcp-ab', profile_version: PROFILE_VERSION, source_language: sourceLanguage, target_language: sourceLanguage === 'ja' ? 'en' : 'ja', segments: [{ id: 's1', text }] }, { aiCore: { baseUrl: 'http://127.0.0.1:18080', apiKey: 'test-key' }, timeoutMs: 30_000, japaneseLanguageIntelligence: wrapped });
    assert.ok(translationRequest);
    return { out, translationRequest, adapterCalls };
  } finally { globalThis.fetch = oldFetch; }
}

test('high-risk Japanese source uses accepted DJPMCP evidence as bounded generation guidance', async () => {
  const adapter: JapaneseLanguageIntelligence = { analyze: async () => ({ accepted: true, guidance: 'DJPMCP_STRUCTURED_EVIDENCE={"status":"COMPLETE","polarity":"negative"}', status: 'COMPLETE', semanticHash: 'a'.repeat(64), unresolvedCount: 0 }) };
  const { out, translationRequest, adapterCalls } = await run('ja', '承認されるまで変更しないでください。', adapter);
  assert.equal(adapterCalls, 1);
  assert.match(user(translationRequest), /DJPMCP_STRUCTURED_EVIDENCE=/);
  assert.equal(out.usage.japanese_adapter_attempts, 1);
  assert.equal(out.usage.japanese_adapter_accepts, 1);
  assert.equal(out.usage.japanese_adapter_rejects, 0);
  assert.equal(out.usage.japanese_adapter_errors, 0);
});

test('non-Japanese high-risk source bypasses the Japanese adapter', async () => {
  const adapter: JapaneseLanguageIntelligence = { analyze: async () => ({ accepted: true, guidance: 'SHOULD_NOT_APPEAR', status: 'COMPLETE', unresolvedCount: 0 }) };
  const { out, translationRequest, adapterCalls } = await run('en', 'Do not publish until approved.', adapter);
  assert.equal(adapterCalls, 0);
  assert.doesNotMatch(user(translationRequest), /SHOULD_NOT_APPEAR/);
  assert.equal(out.usage.japanese_adapter_attempts, 0);
});

test('invalid or unavailable Japanese adapter does not weaken existing integrity path', async () => {
  const adapter: JapaneseLanguageIntelligence = { analyze: async () => { throw new Error('adapter unavailable'); } };
  const { out, translationRequest, adapterCalls } = await run('ja', '承認されるまで変更しないでください。', adapter);
  assert.equal(adapterCalls, 1);
  assert.doesNotMatch(user(translationRequest), /DJPMCP_STRUCTURED_EVIDENCE=/);
  assert.equal(out.usage.japanese_adapter_attempts, 1);
  assert.equal(out.usage.japanese_adapter_accepts, 0);
  assert.equal(out.usage.japanese_adapter_errors, 1);
  assert.ok(out.usage.evidence_validations >= 1);
  assert.ok(out.usage.semantic_validations >= 1);
});

test('DJPMCP PARTIAL guidance preserves unresolved state as data', async () => {
  const adapter: JapaneseLanguageIntelligence = { analyze: async () => ({ accepted: true, guidance: 'DJPMCP_STRUCTURED_EVIDENCE={"status":"PARTIAL","unresolved_count":1}', status: 'PARTIAL', unresolvedCount: 1 }) };
  const { out, translationRequest } = await run('ja', 'それが承認されるまで変更しないでください。', adapter);
  assert.match(user(translationRequest), /"status":"PARTIAL"/);
  assert.match(user(translationRequest), /"unresolved_count":1/);
  assert.equal(out.usage.japanese_adapter_accepts, 1);
});
