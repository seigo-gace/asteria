import { codedError } from './errors.js';

export type RuntimeConfig = {
  host: string;
  port: number;
  internalToken: string;
  aiCoreBaseUrl: string;
  aiCoreApiKey: string;
  translationTimeoutMs: number;
  maxBodyBytes: number;
};

function positiveInt(raw: string | undefined, fallback: number, code: string): number {
  const value = raw === undefined || raw.trim() === '' ? fallback : Number(raw);
  if (!Number.isInteger(value) || value <= 0) throw codedError(code, `${code} must be a positive integer.`);
  return value;
}

function localHost(host: string): boolean {
  return new Set(['127.0.0.1', 'localhost', '::1', '[::1]']).has(host);
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  const host = env.HOST?.trim() || '127.0.0.1';
  if (!localHost(host)) throw codedError('ASTERIA_HOST_LOCAL_ONLY', 'AsteriaAI must bind to loopback only.');
  const internalToken = env.ASTERIA_INTERNAL_TOKEN?.trim() || '';
  const aiCoreApiKey = env.AI_CORE_API_KEY?.trim() || '';
  if (!internalToken) throw codedError('ASTERIA_INTERNAL_TOKEN_REQUIRED', 'ASTERIA_INTERNAL_TOKEN is required.');
  if (!aiCoreApiKey) throw codedError('TRANSLATION_AI_CORE_KEY_NOT_CONFIGURED', 'AI Core API key is required.');
  return {
    host,
    port: positiveInt(env.PORT, 18110, 'ASTERIA_PORT_INVALID'),
    internalToken,
    aiCoreBaseUrl: env.AI_CORE_BASE_URL?.trim() || 'http://127.0.0.1:18080',
    aiCoreApiKey,
    translationTimeoutMs: positiveInt(env.ASTERIA_TRANSLATION_TIMEOUT_MS, 90_000, 'ASTERIA_TIMEOUT_INVALID'),
    maxBodyBytes: positiveInt(env.ASTERIA_MAX_BODY_BYTES, 1_000_000, 'ASTERIA_MAX_BODY_BYTES_INVALID'),
  };
}
