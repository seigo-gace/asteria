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
function translation(request: RequestBody): boolean { return request.model === QWEN && user(request).includes('BEGIN_BATCH'); }
function response(model: string, content: string): Response { return new Response(JSON.stringify({ model, choices: [{ message: { content } }], usage: { prompt_tokens: 12, completion_tokens: 8 } }), { status: 200, headers: { 'content-type': 'application/json' } }); }
function pass(): string { return JSON.stringify({ equivalent: true, score: 1, target_language_match: true, critical_differences: [] }); }
function req(): Record<string, unknown> { return { request_id: 'integrity-1', profile_version: PROFILE_VERSION, source_language: 'en', target_language: 'ja', segments: [{ id: 's1', text: 'Do not publish this before 2026-12-31.' }] }; }

test('semantic retry is driven by typed error-delta guidance and restarts from original', async () => {
  const old = globalThis.fetch;
  let translations = 0;
  let verdicts = 0;
  globalThis.fetch = async (_input, init) => {
    const request = body(init);
    if (translation(request)) {
      translations += 1;
      const content = user(request);
      const batch = content.match(/BEGIN_BATCH\n([\s\S]*)\nEND_BATCH$/)?.[1] ?? '';
      if (translations === 2) {
        assert.match(content, /STRATEGY=semantic_retry/);
        assert.match(content, /\[polarity\] negation removed/);
      }
      return response(QWEN_RESPONSE, batch);
    }
    if (request.model === QWEN) return response(QWEN_RESPONSE, MEANING_EN);
    verdicts += 1;
    return response(GRANITE_RESPONSE, verdicts === 1 ? JSON.stringify({ equivalent: false, score: 0.6, target_language_match: true, critical_differences: ['negation removed'] }) : pass());
  };
  try {
    const out = await translateSegments(req(), CONFIG);
    assert.equal(translations, 2);
    assert.equal(verdicts, 2);
    assert.equal(out.usage.semantic_retries, 1);
  } finally {
    globalThis.fetch = old;
  }
});

test('unsupported ambiguity guessing routes to reanalysis and does not blindly regenerate', async () => {
  const old = globalThis.fetch;
  let translations = 0;
  let verdicts = 0;
  globalThis.fetch = async (_input, init) => {
    const request = body(init);
    if (translation(request)) {
      translations += 1;
      const batch = user(request).match(/BEGIN_BATCH\n([\s\S]*)\nEND_BATCH$/)?.[1] ?? '';
      return response(QWEN_RESPONSE, batch);
    }
    if (request.model === QWEN) return response(QWEN_RESPONSE, MEANING_EN);
    verdicts += 1;
    return response(GRANITE_RESPONSE, JSON.stringify({ equivalent: false, score: 0.7, target_language_match: true, critical_differences: ['ambiguous referent was guessed without evidence'] }));
  };
  try {
    await assert.rejects(() => translateSegments(req(), CONFIG), (error: unknown) => (error as { code?: string }).code === 'TRANSLATION_REANALYSIS_REQUIRED');
    assert.equal(translations, 1);
    assert.equal(verdicts, 1);
  } finally {
    globalThis.fetch = old;
  }
});
