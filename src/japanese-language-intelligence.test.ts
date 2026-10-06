import assert from 'node:assert/strict';
import test from 'node:test';
import { DjpmcpHttpLanguageIntelligence, parseDjpmcpAnalyzeResponse } from './japanese-language-intelligence.js';

function valid(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    overall_status: 'COMPLETE',
    execution_allowed: true,
    blocked_reasons: [],
    original_text: '変更しないでください。',
    meaning_graph: {
      graph_version: '2.3.0',
      semantic_hash: 'a'.repeat(64),
      propositions: [{
        proposition_id: 'p1',
        polarity: 'negative',
        sentence_mood: 'imperative',
        speech_act: 'directive',
        deontic_force: 'prohibition',
        force_level: 4,
        source_span: { start: 0, end: 11, source_text: '変更しないでください。' },
        arguments: [{ role: 'theme', value: '変更', explicit: true, status: 'RESOLVED', span: { start: 0, end: 2, source_text: '変更' } }],
        status: 'RESOLVED'
      }],
      scope_edges: [{ edge_id: 's1', source_id: 'p1', target_id: 'p1', relation: 'negation_scope', marker: 'ない', status: 'RESOLVED' }],
      unresolved: []
    },
    ambiguities: [],
    missing_information: [],
    contradictions: [],
    ...overrides
  };
}

test('DJPMCP response becomes bounded structural guidance without copying source prose', () => {
  const result = parseDjpmcpAnalyzeResponse(valid(), '変更しないでください。');
  assert.equal(result.accepted, true);
  assert.equal(result.status, 'COMPLETE');
  assert.equal(result.semanticHash, 'a'.repeat(64));
  assert.match(result.guidance, /^DJPMCP_STRUCTURED_EVIDENCE=/);
  assert.match(result.guidance, /"polarity":"negative"/);
  assert.match(result.guidance, /"deontic_force":"prohibition"/);
  assert.doesNotMatch(result.guidance, /変更しないでください/);
  assert.doesNotMatch(result.guidance, /source_text/);
});

test('PARTIAL preserves unresolved state instead of inventing resolution', () => {
  const result = parseDjpmcpAnalyzeResponse(valid({ overall_status: 'PARTIAL', meaning_graph: { ...(valid().meaning_graph as Record<string, unknown>), unresolved: [{ type: 'reference' }] } }), '変更しないでください。');
  assert.equal(result.accepted, true);
  assert.equal(result.status, 'PARTIAL');
  assert.equal(result.unresolvedCount, 1);
  assert.match(result.guidance, /"unresolved_count":1/);
});

test('FAILED analysis is rejected as guidance', () => {
  const result = parseDjpmcpAnalyzeResponse(valid({ overall_status: 'FAILED' }), '変更しないでください。');
  assert.equal(result.accepted, false);
  assert.equal(result.guidance, '');
});

test('mismatched original is rejected', () => {
  assert.throws(() => parseDjpmcpAnalyzeResponse(valid(), '別の原文'), /does not match request/);
});

test('invalid schema is rejected', () => {
  assert.throws(() => parseDjpmcpAnalyzeResponse({ overall_status: 'COMPLETE', original_text: '変更しないでください。' }, '変更しないでください。'), /meaning_graph/);
});

test('HTTP adapter accepts loopback endpoint and uses verified /v1/analyze contract', async () => {
  const oldFetch = globalThis.fetch;
  let seenUrl = '';
  let seenAuth = '';
  let seenBody: Record<string, unknown> | undefined;
  globalThis.fetch = async (input, init) => {
    seenUrl = String(input);
    seenAuth = String((init?.headers as Record<string, string> | undefined)?.authorization ?? '');
    seenBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
    return new Response(JSON.stringify(valid()), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  try {
    const adapter = new DjpmcpHttpLanguageIntelligence({ baseUrl: 'http://127.0.0.1:8765', apiKey: 'test-key', timeoutMs: 1000 });
    const result = await adapter.analyze(['変更しないでください。']);
    assert.equal(result.accepted, true);
    assert.equal(seenUrl, 'http://127.0.0.1:8765/v1/analyze');
    assert.equal(seenAuth, 'Bearer test-key');
    assert.equal(seenBody?.original_text, '変更しないでください。');
    assert.equal(seenBody?.execution_mode, 'analysis');
    assert.equal(seenBody?.analysis_depth, 'auto');
    assert.equal(seenBody?.deadline_ms, 50);
  } finally {
    globalThis.fetch = oldFetch;
  }
});

test('HTTP adapter rejects non-loopback transport and missing key', () => {
  assert.throws(() => new DjpmcpHttpLanguageIntelligence({ baseUrl: 'https://example.com', apiKey: 'x', timeoutMs: 1000 }), /loopback/);
  assert.throws(() => new DjpmcpHttpLanguageIntelligence({ baseUrl: 'http://127.0.0.1:8765', apiKey: '', timeoutMs: 1000 }), /API key/);
});
