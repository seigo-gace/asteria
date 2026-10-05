import { codedError } from './errors.js';

export type RuntimeConfig = {
  host: string;
  port: number;
  internalToken: string;
  aiCoreBaseUrl: string;
  aiCoreApiKey: string;
  translationTimeoutMs: number;
  maxBodyBytes: number;
  memoryFile?: string;
  djpmcpBaseUrl?: string;
  djpmcpApiKey?: string;
  djpmcpTimeoutMs?: number;
};

function positiveInt(raw: string | undefined, fallback: number, code: string): number {
  const value = raw === undefined || raw.trim() === '' ? fallback : Number(raw);
  if (!Number.isInteger(value) || value <= 0) throw codedError(code, `${code} must be a positive integer.`);
  return value;
}
function localHost(host: string): boolean { return new Set(['127.0.0.1', 'localhost', '::1', '[::1]']).has(host); }
function absolutePath(raw: string | undefined, fallback: string, code: string): string {
  const value = raw?.trim() || fallback;
  if (!value.startsWith('/')) throw codedError(code, `${code} must be an absolute path.`);
  return value;
}
function loopbackHttpUrl(raw: string, code: string): string {
  let url: URL;
  try { url = new URL(raw); } catch { throw codedError(code, `${code} must be a valid URL.`); }
  if (url.protocol !== 'http:' || !localHost(url.hostname)) throw codedError(code, `${code} must use loopback HTTP.`);
  return url.toString().replace(/\/$/, '');
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  const host = env.HOST?.trim() || '127.0.0.1';
  if (!localHost(host)) throw codedError('ASTERIA_HOST_LOCAL_ONLY', 'AsteriaAI must bind to loopback only.');
  const internalToken = env.ASTERIA_INTERNAL_TOKEN?.trim() || '';
  const aiCoreApiKey = env.AI_CORE_API_KEY?.trim() || '';
  if (!internalToken) throw codedError('ASTERIA_INTERNAL_TOKEN_REQUIRED', 'ASTERIA_INTERNAL_TOKEN is required.');
  if (!aiCoreApiKey) throw codedError('TRANSLATION_AI_CORE_KEY_NOT_CONFIGURED', 'AI Core API key is required.');

  const djpmcpBaseRaw = env.DJPMCP_BASE_URL?.trim() || '';
  const djpmcpApiKey = env.DJPMCP_API_KEY?.trim() || '';
  if (Boolean(djpmcpBaseRaw) !== Boolean(djpmcpApiKey)) throw codedError('DJPMCP_CONFIG_INCOMPLETE', 'DJPMCP_BASE_URL and DJPMCP_API_KEY must be configured together.');
  const djpmcpBaseUrl = djpmcpBaseRaw ? loopbackHttpUrl(djpmcpBaseRaw, 'DJPMCP_BASE_URL_INVALID') : undefined;

  return {
    host,
    port: positiveInt(env.PORT, 18110, 'ASTERIA_PORT_INVALID'),
    internalToken,
    aiCoreBaseUrl: env.AI_CORE_BASE_URL?.trim() || 'http://127.0.0.1:18080',
    aiCoreApiKey,
    translationTimeoutMs: positiveInt(env.ASTERIA_TRANSLATION_TIMEOUT_MS, 90_000, 'ASTERIA_TIMEOUT_INVALID'),
    maxBodyBytes: positiveInt(env.ASTERIA_MAX_BODY_BYTES, 1_000_000, 'ASTERIA_MAX_BODY_BYTES_INVALID'),
    memoryFile: absolutePath(env.ASTERIA_MEMORY_FILE, '/app/data/translation-memory.jsonl', 'ASTERIA_MEMORY_FILE_INVALID'),
    ...(djpmcpBaseUrl ? {
      djpmcpBaseUrl,
      djpmcpApiKey,
      djpmcpTimeoutMs: positiveInt(env.DJPMCP_TIMEOUT_MS, 1_000, 'DJPMCP_TIMEOUT_INVALID')
    } : {})
  };
}
