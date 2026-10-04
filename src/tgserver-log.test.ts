import assert from 'node:assert/strict';
import test from 'node:test';
import {
  TGSERVER_ZERO_PROJECT_ID,
  TgServerLogSink,
  buildAsteriaZeroLog,
  buildTgServerBulkUrl,
  normalizeAsteriaErrorCode,
  validateTgServerBulkReceipt
} from './tgserver-log.js';

test('P007 producer normalizes ZERO bulk endpoint', () => {
  assert.equal(buildTgServerBulkUrl('http://127.0.0.1:3000'), 'http://127.0.0.1:3000/ingest/bulk');
  assert.equal(buildTgServerBulkUrl('http://127.0.0.1:3000/ingest'), 'http://127.0.0.1:3000/ingest/bulk');
  assert.equal(buildTgServerBulkUrl('http://127.0.0.1:3000/ingest/bulk/'), 'http://127.0.0.1:3000/ingest/bulk');
});

test('P007 envelope is fixed and excludes arbitrary error text', () => {
  assert.equal(TGSERVER_ZERO_PROJECT_ID, 'P007');
  assert.equal(normalizeAsteriaErrorCode('TRANSLATION_FAILED'), 'TRANSLATION_FAILED');
  assert.equal(normalizeAsteriaErrorCode('token=secret'), 'ASTERIA_INTERNAL_ERROR');
  assert.deepEqual(buildAsteriaZeroLog({
    level: 'error',
    event: 'translate_failed',
    code: 'TRANSLATION_FAILED',
    status: 502,
    createdAt: '2026-10-04T12:00:00.000Z'
  }), {
    project_id: 'P007',
    severity: 'error',
    message: JSON.stringify({ event: 'translate_failed', code: 'TRANSLATION_FAILED', status: 502 }),
    hint: 'asteria-runtime',
    timestamp: '2026-10-04T12:00:00.000Z'
  });
});

test('P007 sink sends logs[] without producer secret and accepts duplicate receipt', async () => {
  const captured: Array<{ url: string; headers: HeadersInit | undefined; body: string | undefined }> = [];
  const sink = new TgServerLogSink({
    url: 'http://127.0.0.1:3000/ingest',
    batchSize: 10,
    fetchImpl: async (input, init) => {
      captured.push({ url: String(input), headers: init?.headers, body: String(init?.body ?? '') });
      return new Response(JSON.stringify({ results: [{ status: 'duplicate' }] }), { status: 200 });
    }
  });
  sink.log({ level: 'info', event: 'translate_succeeded', status: 200, createdAt: '2026-10-04T12:00:01.000Z' });
  assert.equal(await sink.flush(), true);
  const request = captured[0];
  assert.ok(request);
  assert.equal(request.url, 'http://127.0.0.1:3000/ingest/bulk');
  assert.deepEqual(request.headers, { 'content-type': 'application/json' });
  const body = JSON.parse(request.body ?? '{}');
  assert.equal(body.logs[0].project_id, 'P007');
  assert.equal(sink.queued, 0);
});

test('P007 sink requeues failed batches without breaking caller', async () => {
  const sink = new TgServerLogSink({
    url: 'http://127.0.0.1:3000',
    batchSize: 10,
    queueLimit: 10,
    fetchImpl: async () => { throw new Error('offline'); }
  });
  sink.log({ level: 'error', event: 'translate_failed', code: 'AI_CORE_UNAVAILABLE', status: 503 });
  assert.equal(await sink.flush(), false);
  assert.equal(sink.queued, 1);

  assert.doesNotThrow(() => validateTgServerBulkReceipt({ results: [{ status: 'accepted' }] }, 1));
  assert.throws(() => validateTgServerBulkReceipt({ results: [{ status: 'rejected' }] }, 1));
});
