import assert from 'node:assert/strict';
import test from 'node:test';
import { evidenceIntegrityPass, evidenceIntegrityVerdict } from './evidence-integrity.js';
import type { MeaningEvidenceGraph } from './integrity-control.js';

const GRANITE_RESPONSE = '/models/granite-4.2-8b-Q4_K_M.gguf';
const CONFIG = { baseUrl: 'http://127.0.0.1:18080', apiKey: 'test-key' };
const GRAPH: MeaningEvidenceGraph = {
  detectedLanguage: 'en',
  claims: ['The release is approved.'],
  constraints: ['Do not publish before 2026-12-31.'],
  conditions: [],
  entities: ['release'],
  quantities: ['2026-12-31'],
  uncertainties: []
};

function response(content: string): Response {
  return new Response(JSON.stringify({ model: GRANITE_RESPONSE, choices: [{ message: { content } }], usage: { prompt_tokens: 10, completion_tokens: 5 } }), { status: 200, headers: { 'content-type': 'application/json' } });
}

test('evidence integrity accepts graph only when fully grounded in original', async () => {
  const old = globalThis.fetch;
  globalThis.fetch = async (_input, init) => {
    const body = JSON.parse(String(init?.body)) as { messages: Array<{ role: string; content: string }> };
    const system = body.messages.find((item) => item.role === 'system')?.content ?? '';
    const user = body.messages.find((item) => item.role === 'user')?.content ?? '';
    assert.match(system, /ORIGINAL text is the sole semantic authority/);
    assert.match(user, /Do not publish before 2026-12-31/);
    return response(JSON.stringify({ valid: true, score: 1, unsupported_evidence: [], contradictions: [], invented_resolutions: [] }));
  };
  try {
    const out = await evidenceIntegrityVerdict(CONFIG, 'The release is approved. Do not publish before 2026-12-31.', GRAPH, 30_000);
    assert.equal(evidenceIntegrityPass(out.verdict), true);
  } finally {
    globalThis.fetch = old;
  }
});

test('evidence integrity rejects unsupported additions and invented resolution', async () => {
  const old = globalThis.fetch;
  globalThis.fetch = async () => response(JSON.stringify({
    valid: false,
    score: 0.4,
    unsupported_evidence: ['Graph invented approval by the legal team.'],
    contradictions: [],
    invented_resolutions: ['Graph resolved an ambiguous owner as Alice.']
  }));
  try {
    const out = await evidenceIntegrityVerdict(CONFIG, 'Do not publish yet. The owner is unclear.', GRAPH, 30_000);
    assert.equal(evidenceIntegrityPass(out.verdict), false);
    assert.deepEqual(out.verdict.unsupportedEvidence, ['Graph invented approval by the legal team.']);
    assert.deepEqual(out.verdict.inventedResolutions, ['Graph resolved an ambiguous owner as Alice.']);
  } finally {
    globalThis.fetch = old;
  }
});
