export type TransformationMode = 'translate' | 'canonicalize' | 'style';

export type ErrorDeltaKind =
  | 'omission'
  | 'unsupported_addition'
  | 'contradiction'
  | 'polarity'
  | 'condition_exception'
  | 'modality'
  | 'entity_reference'
  | 'quantity_time'
  | 'wrong_language'
  | 'literal_structure'
  | 'unresolved_guess'
  | 'semantic_other';

export type ErrorDelta = {
  kind: ErrorDeltaKind;
  severity: 'critical';
  detail: string;
};

export type CorrectionRoute = 'PASS' | 'LOCAL_FIX' | 'FRESH_REGENERATE' | 'REANALYZE' | 'FAIL_CLOSED';

export type TransformationContract = {
  mode: TransformationMode;
  sourceLanguage?: string;
  targetLanguage: string;
  preserveOriginalAuthority: true;
  maxSemanticRegenerations: 1;
};

export type MeaningEvidenceGraph = {
  detectedLanguage: string;
  claims: readonly string[];
  constraints: readonly string[];
  conditions: readonly string[];
  entities: readonly string[];
  quantities: readonly string[];
  uncertainties: readonly string[];
};

export type AttemptRecord = {
  attempt: number;
  route: CorrectionRoute;
  errors: readonly ErrorDelta[];
};

export type TransformationRun = {
  runId: string;
  original: readonly string[];
  contract: TransformationContract;
  attempts: readonly AttemptRecord[];
};

type SemanticVerdictLike = {
  equivalent: boolean;
  score: number;
  targetLanguageMatch: boolean;
  criticalDifferences: readonly string[];
};

export function createTranslationContract(targetLanguage: string, sourceLanguage?: string): TransformationContract {
  return {
    mode: 'translate',
    ...(sourceLanguage ? { sourceLanguage } : {}),
    targetLanguage,
    preserveOriginalAuthority: true,
    maxSemanticRegenerations: 1
  };
}

function classifyDifference(detail: string): ErrorDeltaKind {
  const text = detail.toLowerCase();
  if (/untranslated|target language|wrong language|language mismatch/.test(text)) return 'wrong_language';
  if (/ambigu|uncertain|unknown|guess|resolved without evidence/.test(text)) return 'unresolved_guess';
  if (/omit|missing|dropped|removed|lost/.test(text)) return 'omission';
  if (/unsupported|added|invented|hallucinat/.test(text)) return 'unsupported_addition';
  if (/negat|polarity|must not|prohibit|forbid/.test(text)) return 'polarity';
  if (/condition|exception|\bif\b|unless|except/.test(text)) return 'condition_exception';
  if (/modality|\bmust\b|\bmay\b|\bshould\b|required|optional|permission/.test(text)) return 'modality';
  if (/quantity|number|amount|percent|date|deadline|time|before|after/.test(text)) return 'quantity_time';
  if (/entity|reference|referent|pronoun|subject|object/.test(text)) return 'entity_reference';
  if (/literal|placeholder|structure|marker|url|code token/.test(text)) return 'literal_structure';
  if (/contradict|opposite|reversed/.test(text)) return 'contradiction';
  return 'semantic_other';
}

export function semanticErrorDeltas(verdict: SemanticVerdictLike): ErrorDelta[] {
  const deltas: ErrorDelta[] = [];
  if (!verdict.targetLanguageMatch) {
    deltas.push({ kind: 'wrong_language', severity: 'critical', detail: 'Candidate output does not match the requested target language.' });
  }
  for (const detail of verdict.criticalDifferences) {
    const trimmed = detail.trim();
    if (!trimmed) continue;
    deltas.push({ kind: classifyDifference(trimmed), severity: 'critical', detail: trimmed });
  }
  if ((!verdict.equivalent || verdict.score < 0.98) && deltas.length === 0) {
    deltas.push({ kind: 'semantic_other', severity: 'critical', detail: `Semantic equivalence score ${verdict.score.toFixed(3)} did not pass.` });
  }
  return deltas;
}

export function selectCorrectionRoute(deltas: readonly ErrorDelta[], attempt: number): CorrectionRoute {
  if (deltas.length === 0) return 'PASS';
  if (attempt >= 2) return 'FAIL_CLOSED';
  if (deltas.some((delta) => delta.kind === 'unresolved_guess')) return 'REANALYZE';
  if (deltas.every((delta) => delta.kind === 'literal_structure')) return 'LOCAL_FIX';
  return 'FRESH_REGENERATE';
}

export function errorDeltaGuidance(deltas: readonly ErrorDelta[]): string {
  return deltas.map((delta) => `[${delta.kind}] ${delta.detail}`).join('\n');
}
