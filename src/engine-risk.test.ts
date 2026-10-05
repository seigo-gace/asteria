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
function translation(request: RequestBody): boolean { return request.model === QWEN && user(request).includes('BEGIN_BATCH'); }
function response(model: string, content: string): Response { return new Response(JSON.stringify({ model, choices: [{ message: { content } }], usage: { prompt_tokens: 12, completion_tokens: 8 } }), { status: 200, headers: { 'content-type': 'application/json' } }); }
function evidencePass(): string { return JSON.stringify({ valid: true, score: 1, unsupported_evidence: [], contradictions: [], invented_resolutions: [] }); }
function semanticPass(): string { return JSON.stringify({ equivalent: true, score: 1, target_language_match: true, critical_differences: [] }); }

async function run(text: string): Promise<{ out: Awaited<ReturnType<typeof translateSegments>>; translationRequest: RequestBody }> {
  const old = globalThis.fetch;
  let translationRequest: RequestBody | undefined;
  globalThis.fetch = async (_input, init) => {
    const request = body(init);
    if (translation(request)) {
      translationRequest = request;
      const batch = user(request).match(/BEGIN_BATCH\n([\s\S]*)\nEND_BATCH$/)?.[1] ?? '';
      return response(QWEN_RESPONSE, batch);
    }
    if (request.model === QWEN) return response(QWEN_RESPONSE, MEANING_EN);
    if (system(request).includes('evidence-integrity judge')) return response(GRANITE_RESPONSE, evidencePass());
    return response(GRANITE_RESPONSE, semanticPass());
  };
  try {
    const out = await translateSegments({ request_id: 'risk-route', profile_version: PROFILE_VERSION, source_language: 'en', target_language: 'ja', segments: [{ id: 's1', text }] }, CONFIG);
    assert.ok(translationRequest);
    return { out, translationRequest };
  } finally {
    globalThis.fetch = old;
  }
}

test('high-risk source selects risk-focused generation without adding model calls or skipping integrity gates', async () => {
  const { out, translationRequest } = await run('Do not publish this unless approved before 2026-12-31.');
  assert.match(user(translationRequest), /STRATEGY=risk_focused/);
  assert.match(user(translationRequest), /RISK_CLASS=high-risk/);
  assert.match(user(translationRequest), /negation/);
  assert.match(user(translationRequest), /condition/);
  assert.equal(out.usage.risk_class, 'high-risk');
  assert.equal(out.usage.risk_focused_generations, 1);
  assert.equal(out.usage.evidence_validations, 1);
  assert.equal(out.usage.calls, 5);
  assert.equal(out.usage.external_api_calls, 0);
});

test('simple source keeps existing document generation path with the same integrity gates', async () => {
  const { out, translationRequest } = await run('Hello world.');
  assert.match(user(translationRequest), /STRATEGY=document/);
  assert.doesNotMatch(user(translationRequest), /RISK_CLASS=/);
  assert.equal(out.usage.risk_class, 'simple');
  assert.equal(out.usage.risk_focused_generations, 0);
  assert.equal(out.usage.evidence_validations, 1);
  assert.equal(out.usage.calls, 5);
  assert.equal(out.usage.external_api_calls, 0);
});
