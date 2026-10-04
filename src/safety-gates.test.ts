import assert from 'node:assert/strict';
import test from 'node:test';
import { translateSegments, PROFILE_VERSION } from './engine.js';

const QWEN = 'qwen3//models/Qwen3-8B-Q4_K_M.gguf';
const QWEN_RESPONSE = '/models/Qwen3-8B-Q4_K_M.gguf';
const CONFIG = { aiCore: { baseUrl: 'http://127.0.0.1:18080', apiKey: 'test-key' }, timeoutMs: 30_000 };
type RequestBody = { model: string; messages: Array<{ role: string; content: string }> };
function body(init: RequestInit | undefined): RequestBody { return JSON.parse(String(init?.body)) as RequestBody; }
function user(request: RequestBody): string { return request.messages.find((item) => item.role === 'user')?.content ?? ''; }
function response(model: string, content: string): Response { return new Response(JSON.stringify({ model, choices: [{ message: { content } }], usage: { prompt_tokens: 1, completion_tokens: 1 } }), { status: 200, headers: { 'content-type': 'application/json' } }); }
function semantic(language: string): string { return JSON.stringify({ detected_language: language, claims: [], constraints: [], conditions: [], entities: [], quantities: [], uncertainties: [] }); }
function request(sourceLanguage?: string): Record<string, unknown> { return { request_id: 'safety-gate', profile_version: PROFILE_VERSION, source_language: sourceLanguage, target_language: 'ja', segments: [{ id: 'body', text: 'Do not publish this result.' }] }; }

test('declared source-language mismatch fails before translation generation', async () => {
  const old = globalThis.fetch;
  let translationCalls = 0;
  let totalCalls = 0;
  globalThis.fetch = async (_input, init) => {
    totalCalls += 1;
    const req = body(init);
    if (req.model === QWEN && user(req).includes('BEGIN_BATCH')) translationCalls += 1;
    return response(QWEN_RESPONSE, semantic('en'));
  };
  try {
    await assert.rejects(() => translateSegments(request('de'), CONFIG), (error: unknown) => (error as { code?: string }).code === 'SOURCE_LANGUAGE_MISMATCH');
    assert.equal(totalCalls, 1);
    assert.equal(translationCalls, 0);
  } finally {
    globalThis.fetch = old;
  }
});

test('invalid semantic detected_language fails closed before translation generation', async () => {
  const old = globalThis.fetch;
  let translationCalls = 0;
  globalThis.fetch = async (_input, init) => {
    const req = body(init);
    if (req.model === QWEN && user(req).includes('BEGIN_BATCH')) translationCalls += 1;
    return response(QWEN_RESPONSE, semantic('not_a_language'));
  };
  try {
    await assert.rejects(() => translateSegments(request(), CONFIG), (error: unknown) => (error as { code?: string }).code === 'TRANSLATION_SEMANTIC_RECORD_INVALID');
    assert.equal(translationCalls, 0);
  } finally {
    globalThis.fetch = old;
  }
});
