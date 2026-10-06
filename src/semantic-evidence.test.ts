import assert from 'node:assert/strict';
import test from 'node:test';
import { meaningRecord } from './semantic.js';

const QWEN_RESPONSE = '/models/Qwen3-8B-Q4_K_M.gguf';
const CONFIG = { baseUrl: 'http://127.0.0.1:18080', apiKey: 'test-key' };

function response(content: string): Response {
  return new Response(JSON.stringify({ model: QWEN_RESPONSE, choices: [{ message: { content } }], usage: { prompt_tokens: 10, completion_tokens: 5 } }), { status: 200, headers: { 'content-type': 'application/json' } });
}

test('meaning record exposes a typed evidence graph while preserving canonical record JSON', async () => {
  const old = globalThis.fetch;
  globalThis.fetch = async () => response(JSON.stringify({
    detected_language: 'EN-us',
    claims: ['  The system is ready.  '],
    constraints: ['Do not publish.'],
    conditions: ['Only if approved.'],
    entities: ['Project A'],
    quantities: ['3 items'],
    uncertainties: ['Owner is ambiguous.']
  }));
  try {
    const out = await meaningRecord(CONFIG, 'source', 30_000);
    assert.deepEqual(out.graph, {
      detectedLanguage: 'en-US',
      claims: ['The system is ready.'],
      constraints: ['Do not publish.'],
      conditions: ['Only if approved.'],
      entities: ['Project A'],
      quantities: ['3 items'],
      uncertainties: ['Owner is ambiguous.']
    });
    assert.deepEqual(JSON.parse(out.record), {
      detected_language: 'en-US',
      claims: ['The system is ready.'],
      constraints: ['Do not publish.'],
      conditions: ['Only if approved.'],
      entities: ['Project A'],
      quantities: ['3 items'],
      uncertainties: ['Owner is ambiguous.']
    });
  } finally {
    globalThis.fetch = old;
  }
});
