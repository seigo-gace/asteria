import assert from 'node:assert/strict';
import test from 'node:test';
import { reanalysisRecord } from './semantic.js';

const QWEN_RESPONSE = '/models/Qwen3-8B-Q4_K_M.gguf';
const CONFIG = { baseUrl: 'http://127.0.0.1:18080', apiKey: 'test-key' };

function response(content: string): Response {
  return new Response(JSON.stringify({ model: QWEN_RESPONSE, choices: [{ message: { content } }], usage: { prompt_tokens: 10, completion_tokens: 5 } }), { status: 200, headers: { 'content-type': 'application/json' } });
}

test('source reanalysis ignores prior candidate and rebuilds evidence from ORIGINAL plus verifier concern', async () => {
  const old = globalThis.fetch;
  globalThis.fetch = async (_input, init) => {
    const body = JSON.parse(String(init?.body)) as { messages: Array<{ role: string; content: string }> };
    const system = body.messages.find((item) => item.role === 'system')?.content ?? '';
    const user = body.messages.find((item) => item.role === 'user')?.content ?? '';
    assert.match(system, /Ignore the previous translation completely/);
    assert.match(system, /Never guess a missing fact or referent/);
    assert.match(user, /ambiguous referent was guessed without evidence/);
    assert.match(user, /The owner is unclear/);
    assert.doesNotMatch(user, /PREVIOUS_TRANSLATION/);
    return response(JSON.stringify({
      detected_language: 'en',
      claims: ['Publication is prohibited.'],
      constraints: ['Do not publish.'],
      conditions: [],
      entities: [],
      quantities: [],
      uncertainties: ['The owner is unclear.']
    }));
  };
  try {
    const out = await reanalysisRecord(CONFIG, 'Do not publish. The owner is unclear.', '[unresolved_guess] ambiguous referent was guessed without evidence', 30_000);
    assert.deepEqual(out.graph.uncertainties, ['The owner is unclear.']);
    assert.equal(out.detectedLanguage, 'en');
  } finally {
    globalThis.fetch = old;
  }
});
