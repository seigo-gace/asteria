import assert from 'node:assert/strict';
import test from 'node:test';
import { once } from 'node:events';
import { createAsteriaServer } from './http.js';
import type { RuntimeConfig } from './config.js';
const CONFIG: RuntimeConfig = { host: '127.0.0.1', port: 18110, internalToken: 'test-internal-token', aiCoreBaseUrl: 'http://127.0.0.1:18080', aiCoreApiKey: 'test-key', translationTimeoutMs: 30_000, maxBodyBytes: 100_000 };
async function withServer(run: (base: string) => Promise<void>): Promise<void> { const server = createAsteriaServer(CONFIG); server.listen(0, '127.0.0.1'); await once(server, 'listening'); const address = server.address(); if (!address || typeof address === 'string') throw new Error('bad address'); try { await run(`http://127.0.0.1:${address.port}`); } finally { server.close(); await once(server, 'close'); } }
test('internal endpoints require bearer auth and capability response is fail-closed', async () => withServer(async (base) => { const unauthorized = await fetch(`${base}/internal/v1/health`); assert.equal(unauthorized.status, 401); const response = await fetch(`${base}/internal/v1/capabilities`, { headers: { authorization: 'Bearer test-internal-token' } }); assert.equal(response.status, 200); const body = await response.json() as Record<string, unknown>; assert.equal(body.language_capability_status, 'NOT_VERIFIED'); assert.equal(body.glossary, 'NOT_IMPLEMENTED_FAIL_CLOSED'); assert.equal(body.external_translation_api, false); }));
