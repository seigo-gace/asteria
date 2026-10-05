import crypto from 'node:crypto';
import http, { type IncomingMessage, type ServerResponse } from 'node:http';
import { PROFILE_VERSION, translateSegments } from './engine.js';
import { codedError } from './errors.js';
import type { RuntimeConfig } from './config.js';
import { GRANITE_MODEL_ID, QWEN_MODEL_ID } from './ai-core.js';
import type { JapaneseLanguageIntelligence } from './japanese-language-intelligence.js';
import type { TranslationMemory } from './translation-memory.js';
import type { AsteriaRuntimeLogEvent } from './tgserver-log.js';

type RuntimeLogger = { log(event: AsteriaRuntimeLogEvent): void };

function authorized(req: IncomingMessage, token: string): boolean {
  const raw = req.headers.authorization || '';
  const expected = `Bearer ${token}`;
  const left = Buffer.from(raw);
  const right = Buffer.from(expected);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function json(res: ServerResponse, statusCode: number, body: unknown): void {
  const text = JSON.stringify(body);
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(text),
    'cache-control': 'no-store'
  });
  res.end(text);
}

async function readJson(req: IncomingMessage, limit: number): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > limit) throw codedError('REQUEST_BODY_TOO_LARGE', 'Request body exceeds configured byte limit.', false, 413);
    chunks.push(buffer);
  }
  const text = Buffer.concat(chunks).toString('utf8');
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw codedError('REQUEST_JSON_INVALID', 'Request body must be valid JSON.', false, 400);
  }
}

function status(error: unknown): number {
  const explicit = (error as { status?: unknown } | null)?.status;
  return typeof explicit === 'number' && explicit >= 400 && explicit <= 599 ? explicit : 500;
}

function errorCode(error: unknown): string {
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === 'string' ? code : 'ASTERIA_INTERNAL_ERROR';
}

function errorBody(error: unknown): unknown {
  return {
    error: {
      code: errorCode(error),
      message: error instanceof Error ? error.message : 'Internal error.',
      retryable: (error as { retryable?: unknown } | null)?.retryable === true
    }
  };
}

export function createAsteriaServer(
  config: RuntimeConfig,
  runtimeLogger?: RuntimeLogger,
  memory?: TranslationMemory,
  japaneseLanguageIntelligence?: JapaneseLanguageIntelligence
): http.Server {
  return http.createServer(async (req, res) => {
    let path = '/';
    try {
      if (!authorized(req, config.internalToken)) {
        json(res, 401, { error: { code: 'ASTERIA_UNAUTHORIZED', message: 'Bearer authentication required.', retryable: false } });
        return;
      }

      path = new URL(req.url || '/', 'http://127.0.0.1').pathname;
      if (req.method === 'GET' && path === '/internal/v1/health') {
        json(res, 200, { status: 'ok', service: 'asteria-ai', profile_version: PROFILE_VERSION });
        return;
      }
      if (req.method === 'GET' && path === '/internal/v1/capabilities') {
        json(res, 200, {
          profile_version: PROFILE_VERSION,
          translator_model: QWEN_MODEL_ID,
          validator_model: GRANITE_MODEL_ID,
          language_capability_status: 'NOT_VERIFIED',
          source_language: 'BCP47_OPTIONAL',
          target_language: 'BCP47_REQUIRED',
          glossary: 'NOT_IMPLEMENTED_FAIL_CLOSED',
          persistent_failure_memory: memory ? 'SOURCE_CONFIGURED_RUNTIME_UNVERIFIED' : 'DISABLED',
          japanese_language_intelligence: japaneseLanguageIntelligence ? 'SOURCE_CONFIGURED_RUNTIME_UNVERIFIED' : 'DISABLED',
          external_translation_api: false
        });
        return;
      }
      if (req.method === 'POST' && path === '/internal/v1/translate') {
        const body = await readJson(req, config.maxBodyBytes);
        const result = await translateSegments(body, {
          aiCore: { baseUrl: config.aiCoreBaseUrl, apiKey: config.aiCoreApiKey },
          timeoutMs: config.translationTimeoutMs,
          ...(memory ? { memory } : {}),
          ...(japaneseLanguageIntelligence ? { japaneseLanguageIntelligence } : {})
        });
        json(res, 200, result);
        runtimeLogger?.log({ level: 'info', event: 'translate_succeeded', status: 200 });
        return;
      }
      json(res, 404, { error: { code: 'ASTERIA_ROUTE_NOT_FOUND', message: 'Route not found.', retryable: false } });
    } catch (error) {
      const statusCode = status(error);
      if (req.method === 'POST' && path === '/internal/v1/translate') {
        runtimeLogger?.log({ level: 'error', event: 'translate_failed', status: statusCode, code: errorCode(error) });
      }
      json(res, statusCode, errorBody(error));
    }
  });
}
