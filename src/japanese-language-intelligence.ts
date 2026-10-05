export type JapaneseLanguageIntelligenceResult = {
  accepted: boolean;
  guidance: string;
  status: 'COMPLETE' | 'PARTIAL' | 'FAILED';
  semanticHash?: string;
  unresolvedCount: number;
};

export interface JapaneseLanguageIntelligence {
  analyze(originals: readonly string[]): Promise<JapaneseLanguageIntelligenceResult>;
}

export type DjpmcpHttpConfig = {
  baseUrl: string;
  apiKey: string;
  timeoutMs: number;
  deadlineMs?: number;
};

type JsonObject = Record<string, unknown>;

const SAFE_ID = /^[A-Za-z0-9._:-]{1,128}$/;
const MAX_PROPOSITIONS = 10;
const MAX_ARGUMENTS = 6;
const MAX_SCOPE_EDGES = 10;
const MAX_GUIDANCE_CHARS = 1100;

function object(value: unknown): JsonObject | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as JsonObject : null;
}

function array(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function text(value: unknown, max = 64): string | undefined {
  return typeof value === 'string' && value.length > 0 && value.length <= max ? value : undefined;
}

function safeId(value: unknown): string | undefined {
  const valueText = text(value, 128);
  return valueText && SAFE_ID.test(valueText) ? valueText : undefined;
}

function span(value: unknown): [number, number] | undefined {
  const item = object(value);
  const start = item?.start;
  const end = item?.end;
  return Number.isInteger(start) && Number.isInteger(end) && Number(start) >= 0 && Number(end) >= Number(start)
    ? [Number(start), Number(end)]
    : undefined;
}

function compactProposition(value: unknown): JsonObject | null {
  const proposition = object(value);
  if (!proposition) return null;
  const compact: JsonObject = {};
  const id = safeId(proposition.proposition_id);
  if (id) compact.id = id;
  const sourceSpan = span(proposition.source_span);
  if (sourceSpan) compact.span = sourceSpan;
  for (const key of ['polarity', 'sentence_mood', 'speech_act', 'deontic_force', 'epistemic_status', 'tense', 'status'] as const) {
    const valueText = text(proposition[key]);
    if (valueText) compact[key] = valueText;
  }
  const forceLevel = proposition.force_level;
  if (Number.isInteger(forceLevel) && Number(forceLevel) >= 1 && Number(forceLevel) <= 5) compact.force_level = forceLevel;
  const aspect = array(proposition.aspect).map((item) => text(item, 32)).filter((item): item is string => Boolean(item)).slice(0, 4);
  const voice = array(proposition.voice).map((item) => text(item, 32)).filter((item): item is string => Boolean(item)).slice(0, 4);
  if (aspect.length) compact.aspect = aspect;
  if (voice.length) compact.voice = voice;
  const args = array(proposition.arguments).slice(0, MAX_ARGUMENTS).map((raw) => {
    const argument = object(raw);
    if (!argument) return null;
    const output: JsonObject = {};
    const role = text(argument.role, 48);
    const status = text(argument.status, 32);
    const entityId = safeId(argument.entity_id);
    const argumentSpan = span(argument.span);
    if (role) output.role = role;
    if (status) output.status = status;
    if (entityId) output.entity_id = entityId;
    if (typeof argument.explicit === 'boolean') output.explicit = argument.explicit;
    if (argumentSpan) output.span = argumentSpan;
    return Object.keys(output).length ? output : null;
  }).filter((item): item is JsonObject => item !== null);
  if (args.length) compact.args = args;
  return Object.keys(compact).length ? compact : null;
}

function compactScope(value: unknown): JsonObject | null {
  const edge = object(value);
  if (!edge) return null;
  const source = safeId(edge.source_id);
  const target = safeId(edge.target_id);
  const relation = text(edge.relation, 48);
  const status = text(edge.status, 32);
  if (!source || !target || !relation) return null;
  return { source, target, relation, ...(status ? { status } : {}) };
}

function boundedGuidance(summary: JsonObject): string {
  let encoded = JSON.stringify(summary);
  if (encoded.length <= MAX_GUIDANCE_CHARS) return `DJPMCP_STRUCTURED_EVIDENCE=${encoded}`;
  const minimal: JsonObject = {
    adapter: 'djpmcp',
    status: summary.status,
    semantic_hash: summary.semantic_hash,
    proposition_count: summary.proposition_count,
    scope_edge_count: summary.scope_edge_count,
    unresolved_count: summary.unresolved_count,
    ambiguity_count: summary.ambiguity_count,
    missing_information_count: summary.missing_information_count,
    contradiction_count: summary.contradiction_count
  };
  encoded = JSON.stringify(minimal);
  return `DJPMCP_STRUCTURED_EVIDENCE=${encoded}`;
}

export function parseDjpmcpAnalyzeResponse(payload: unknown, expectedOriginal: string): JapaneseLanguageIntelligenceResult {
  const root = object(payload);
  if (!root) throw new Error('DJPMCP response must be a JSON object.');
  const status = root.overall_status;
  if (status !== 'COMPLETE' && status !== 'PARTIAL' && status !== 'FAILED') throw new Error('DJPMCP response has invalid overall_status.');
  if (root.original_text !== expectedOriginal) throw new Error('DJPMCP response original_text does not match request.');
  const graph = object(root.meaning_graph);
  if (!graph) throw new Error('DJPMCP response is missing meaning_graph.');
  const semanticHash = typeof graph.semantic_hash === 'string' && /^[a-f0-9]{32,128}$/i.test(graph.semantic_hash) ? graph.semantic_hash : undefined;
  const propositions = array(graph.propositions).slice(0, MAX_PROPOSITIONS).map(compactProposition).filter((item): item is JsonObject => item !== null);
  const scopeEdges = array(graph.scope_edges).slice(0, MAX_SCOPE_EDGES).map(compactScope).filter((item): item is JsonObject => item !== null);
  const unresolvedCount = array(graph.unresolved).length;
  const summary: JsonObject = {
    adapter: 'djpmcp',
    status,
    ...(semanticHash ? { semantic_hash: semanticHash } : {}),
    proposition_count: array(graph.propositions).length,
    scope_edge_count: array(graph.scope_edges).length,
    unresolved_count: unresolvedCount,
    ambiguity_count: array(root.ambiguities).length,
    missing_information_count: array(root.missing_information).length,
    contradiction_count: array(root.contradictions).length,
    propositions,
    scope_edges: scopeEdges
  };
  return {
    accepted: status !== 'FAILED',
    guidance: status === 'FAILED' ? '' : boundedGuidance(summary),
    status,
    ...(semanticHash ? { semanticHash } : {}),
    unresolvedCount
  };
}

function loopbackUrl(raw: string): URL {
  const url = new URL(raw);
  if (url.protocol !== 'http:') throw new Error('DJPMCP base URL must use http on loopback.');
  if (!new Set(['127.0.0.1', 'localhost', '::1', '[::1]']).has(url.hostname)) throw new Error('DJPMCP base URL must be loopback only.');
  return url;
}

export class DjpmcpHttpLanguageIntelligence implements JapaneseLanguageIntelligence {
  private readonly endpoint: URL;
  private readonly apiKey: string;
  private readonly timeoutMs: number;
  private readonly deadlineMs: number;

  constructor(config: DjpmcpHttpConfig) {
    const base = loopbackUrl(config.baseUrl);
    if (!config.apiKey.trim()) throw new Error('DJPMCP API key is required when the adapter is enabled.');
    if (!Number.isInteger(config.timeoutMs) || config.timeoutMs <= 0) throw new Error('DJPMCP timeout must be a positive integer.');
    const deadlineMs = config.deadlineMs ?? 50;
    if (!Number.isInteger(deadlineMs) || deadlineMs < 1 || deadlineMs > 60_000) throw new Error('DJPMCP deadline must be 1-60000 ms.');
    this.endpoint = new URL('/v1/analyze', base);
    this.apiKey = config.apiKey;
    this.timeoutMs = config.timeoutMs;
    this.deadlineMs = deadlineMs;
  }

  async analyze(originals: readonly string[]): Promise<JapaneseLanguageIntelligenceResult> {
    const originalText = originals.join('\n\n');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${this.apiKey}`,
          'content-type': 'application/json',
          accept: 'application/json'
        },
        body: JSON.stringify({
          original_text: originalText,
          execution_mode: 'analysis',
          analysis_depth: 'auto',
          deadline_ms: this.deadlineMs
        }),
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`DJPMCP HTTP ${response.status}`);
      const payload: unknown = await response.json();
      return parseDjpmcpAnalyzeResponse(payload, originalText);
    } finally {
      clearTimeout(timer);
    }
  }
}
