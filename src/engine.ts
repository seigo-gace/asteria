import { GRANITE_MODEL_ID, QWEN_MODEL_ID, requestAiCore, type AiCoreConfig, type EngineResult } from './ai-core.js';
import { codedError } from './errors.js';
import { evidenceIntegrityFailureSummary, evidenceIntegrityPass, evidenceIntegrityVerdict } from './evidence-integrity.js';
import { createTranslationContract, errorDeltaGuidance, semanticErrorDeltas, selectCorrectionRoute, type AttemptRecord, type CorrectionRoute, type ErrorDelta, type TransformationRun } from './integrity-control.js';
import { canonicalLanguage, sameLanguage } from './language.js';
import { meaningPreservingNormalizationCandidate, normalizationEquivalencePass, normalizationEquivalenceVerdict } from './normalization.js';
import { decodeBatch, deterministicValidationError, encodeBatch, guidanceBlock, inspectProtectedLiterals, serializeMeaningBatch, translationInstruction, validateBatchStructure, type TranslationStrategy } from './quality.js';
import { classifyTranslationRisk, riskGuidance, type RiskClass, type RiskSignal } from './risk-router.js';
import { meaningRecord, reanalysisRecord, SEMANTIC_PASS_SCORE, semanticPass, semanticVerdict, type MeaningRecordResult } from './semantic.js';
import { meaningEvidenceDigest, translationInputBindingDigest, type TranslationMemory, type TranslationMemoryContext } from './translation-memory.js';

export const PROFILE_VERSION = 'asteria-translation-v1';
export type TranslationSegment = { id: string; text: string };
export type TranslationRequest = { request_id: string; profile_version: string; target_language: string; source_language?: string; glossary_id?: string; segments: TranslationSegment[] };
export type TranslationUsage = { provider: 'ai_core_qwen3'; model: string; validation_model: string; calls: number; input_tokens: number; output_tokens: number; external_api_calls: 0; validation_fallbacks: number; evidence_validations: number; semantic_validations: number; semantic_retries: number; source_reanalyses: number; risk_focused_generations: number; normalization_attempts: number; normalization_accepts: number; normalization_rejects: number; normalization_validations: number; memory_hits: number; memory_reopened: number; memory_writes: number; memory_errors: number; risk_class: RiskClass; risk_signals: readonly RiskSignal[] };
export type TranslationResponse = { request_id: string; profile_version: string; source_language?: string; detected_source_language?: string; target_language: string; language_capability_status: 'NOT_VERIFIED'; segments: TranslationSegment[]; usage: TranslationUsage };
export type EngineConfig = { aiCore: AiCoreConfig; timeoutMs: number; memory?: TranslationMemory };
type BatchResult = EngineResult & { bodies: string[] };
const NORMALIZATION_SIGNALS = new Set<RiskSignal>(['negation', 'condition', 'exception', 'modality', 'reference_context', 'explicit_ambiguity']);

function validRequestId(value: unknown): string { if (typeof value !== 'string' || !/^[A-Za-z0-9._:-]{1,128}$/.test(value)) throw codedError('REQUEST_ID_INVALID', 'request_id must be 1-128 safe identifier characters.', false, 400); return value; }
function validateSegments(value: unknown): TranslationSegment[] { if (!Array.isArray(value) || value.length < 1 || value.length > 128) throw codedError('SEGMENTS_INVALID', 'segments must contain 1-128 ordered items.', false, 400); const seen = new Set<string>(); return value.map((item, index) => { if (!item || typeof item !== 'object' || Array.isArray(item)) throw codedError('SEGMENT_INVALID', `segment ${index} is invalid.`, false, 400); const id = (item as { id?: unknown }).id; const text = (item as { text?: unknown }).text; if (typeof id !== 'string' || !/^[A-Za-z0-9._:-]{1,128}$/.test(id) || seen.has(id)) throw codedError('SEGMENT_ID_INVALID', `segment ${index} id is invalid or duplicated.`, false, 400); if (typeof text !== 'string') throw codedError('SEGMENT_TEXT_INVALID', `segment ${index} text must be a string.`, false, 400); seen.add(id); return { id, text }; }); }
function parseRequest(input: unknown): { requestId: string; targetLanguage: string; sourceLanguage?: string; segments: TranslationSegment[] } { if (!input || typeof input !== 'object' || Array.isArray(input)) throw codedError('REQUEST_INVALID', 'Request body must be an object.', false, 400); const body = input as TranslationRequest; const requestId = validRequestId(body.request_id); if (body.profile_version !== PROFILE_VERSION) throw codedError('PROFILE_VERSION_UNSUPPORTED', `profile_version must be ${PROFILE_VERSION}.`, false, 400); const targetLanguage = canonicalLanguage(body.target_language, 'target_language'); const sourceLanguage = body.source_language === undefined || body.source_language === '' ? undefined : canonicalLanguage(body.source_language, 'source_language'); if (typeof body.glossary_id === 'string' && body.glossary_id.trim()) throw codedError('TRANSLATION_GLOSSARY_NOT_IMPLEMENTED', 'glossary_id is reserved but not implemented; request rejected instead of silently ignoring it.', false, 409); if (body.glossary_id !== undefined && typeof body.glossary_id !== 'string') throw codedError('GLOSSARY_ID_INVALID', 'glossary_id must be a string when supplied.', false, 400); return { requestId, targetLanguage, ...(sourceLanguage ? { sourceLanguage } : {}), segments: validateSegments(body.segments) }; }
async function translateBatch(aiCore: AiCoreConfig, bodies: string[], targetLanguage: string, sourceLanguage: string | undefined, strategy: TranslationStrategy, timeoutMs: number, guidance = ''): Promise<BatchResult> { const encoded = encodeBatch(bodies); const response = await requestAiCore(aiCore, QWEN_MODEL_ID, translationInstruction(strategy), `TARGET_LANGUAGE=${targetLanguage}\nSOURCE_LANGUAGE=${sourceLanguage ?? 'AUTO'}\nSTRATEGY=${strategy}${guidanceBlock(strategy, guidance)}\nBEGIN_BATCH\n${encoded.text}\nEND_BATCH`, timeoutMs, 8192); try { const translated = decodeBatch(response.text, bodies.length, encoded.tokens); validateBatchStructure(bodies, translated); return { ...response, bodies: translated }; } catch (error) { throw Object.assign(error instanceof Error ? error : new Error('translation validation failed'), { engineUsage: response }); } }

export async function translateSegments(input: unknown, config: EngineConfig): Promise<TranslationResponse> {
  const request = parseRequest(input), contract = createTranslationContract(request.targetLanguage, request.sourceLanguage);
  const active = request.segments.map((segment, index) => ({ segment, index })).filter(({ segment }) => segment.text.trim()), originals = active.map(({ segment }) => segment.text), risk = classifyTranslationRisk(originals, inspectProtectedLiterals);
  const totals = { calls: 0, inputTokens: 0, outputTokens: 0, validationFallbacks: 0, evidenceValidations: 0, semanticValidations: 0, semanticRetries: 0, sourceReanalyses: 0, riskFocusedGenerations: 0, normalizationAttempts: 0, normalizationAccepts: 0, normalizationRejects: 0, normalizationValidations: 0, memoryHits: 0, memoryReopened: 0, memoryWrites: 0, memoryErrors: 0 };
  const add = (engine: EngineResult) => { totals.calls += 1; totals.inputTokens += engine.inputTokens; totals.outputTokens += engine.outputTokens; };
  const output = request.segments.map((segment) => ({ ...segment })); let detectedSourceLanguage: string | undefined;
  const bindingDigest = translationInputBindingDigest({ profileVersion: PROFILE_VERSION, ...(request.sourceLanguage ? { sourceLanguage: request.sourceLanguage } : {}), targetLanguage: request.targetLanguage, translatorModel: QWEN_MODEL_ID, validatorModel: GRANITE_MODEL_ID, originals });

  if (active.length) {
    const originalBatch = serializeMeaningBatch(originals), attempts: AttemptRecord[] = [], focused = risk.requiresFocusedMeaningAcquisition, normalizationNeeded = focused && risk.signals.some((signal) => NORMALIZATION_SIGNALS.has(signal));
    const originalMeaning = await meaningRecord(config.aiCore, originalBatch, config.timeoutMs); add(originalMeaning.result); detectedSourceLanguage = originalMeaning.detectedLanguage;
    if (request.sourceLanguage && !sameLanguage(request.sourceLanguage, detectedSourceLanguage)) throw codedError('SOURCE_LANGUAGE_MISMATCH', `Detected source language ${detectedSourceLanguage} does not match requested ${request.sourceLanguage}.`, false, 422);
    const originalEvidenceCheck = await evidenceIntegrityVerdict(config.aiCore, originalBatch, originalMeaning.graph, config.timeoutMs); add(originalEvidenceCheck.result); totals.evidenceValidations += 1;
    if (!evidenceIntegrityPass(originalEvidenceCheck.verdict)) throw codedError('TRANSLATION_EVIDENCE_INTEGRITY_FAILED', `Source evidence graph is not safely grounded in ORIGINAL: ${evidenceIntegrityFailureSummary(originalEvidenceCheck.verdict)}`, false, 422);

    let sourceMeaning: MeaningRecordResult = originalMeaning, normalizationAccepted = false;
    if (normalizationNeeded) {
      totals.normalizationAttempts += 1;
      try {
        const normalization = await meaningPreservingNormalizationCandidate(config.aiCore, originals, request.sourceLanguage ?? detectedSourceLanguage, config.timeoutMs); add(normalization.result);
        const normalizedBatch = serializeMeaningBatch(normalization.bodies), normalizationCheck = await normalizationEquivalenceVerdict(config.aiCore, originalBatch, normalizedBatch, config.timeoutMs); add(normalizationCheck.result); totals.normalizationValidations += 1;
        if (normalizationEquivalencePass(normalizationCheck.verdict)) {
          const normalizedMeaning = await meaningRecord(config.aiCore, normalizedBatch, config.timeoutMs); add(normalizedMeaning.result);
          const normalizedEvidence = await evidenceIntegrityVerdict(config.aiCore, originalBatch, normalizedMeaning.graph, config.timeoutMs); add(normalizedEvidence.result); totals.evidenceValidations += 1;
          if (sameLanguage(normalizedMeaning.detectedLanguage, detectedSourceLanguage) && evidenceIntegrityPass(normalizedEvidence.verdict)) { sourceMeaning = normalizedMeaning; normalizationAccepted = true; totals.normalizationAccepts += 1; } else totals.normalizationRejects += 1;
        } else totals.normalizationRejects += 1;
      } catch (error) { if (!deterministicValidationError(error)) throw error; const failedUsage = (error as { engineUsage?: EngineResult }).engineUsage; if (failedUsage) add(failedUsage); totals.normalizationRejects += 1; }
    }

    const evidenceDigest = meaningEvidenceDigest(sourceMeaning.graph);
    const memoryContext: TranslationMemoryContext = { bindingDigest, evidenceDigest, profileVersion: PROFILE_VERSION, sourceLanguage: detectedSourceLanguage, targetLanguage: request.targetLanguage, riskClass: risk.riskClass };
    let persistentGuidance = '';
    if (config.memory) {
      try { const history = await config.memory.readFailures({ bindingDigest, evidenceDigest }); totals.memoryHits += history.guidance_records; totals.memoryReopened += history.reopened_records; persistentGuidance = history.guidance; } catch { totals.memoryErrors += 1; }
    }
    const rememberFailure = async (attemptNo: number, route: CorrectionRoute, deltas: readonly ErrorDelta[], context: TranslationMemoryContext): Promise<void> => { if (!config.memory) return; try { if (await config.memory.appendFailure({ ...context, attemptNo, route, failureKinds: deltas.map((delta) => delta.kind) })) totals.memoryWrites += 1; } catch { totals.memoryErrors += 1; } };
    const rememberAccepted = async (attemptNo: number, context: TranslationMemoryContext): Promise<void> => { if (!config.memory) return; try { if (await config.memory.appendAccepted({ ...context, attemptNo })) totals.memoryWrites += 1; } catch { totals.memoryErrors += 1; } };

    const run: TransformationRun = { runId: request.requestId, original: originals, contract, risk, sourceEvidence: sourceMeaning.graph, attempts };
    const initialStrategy: TranslationStrategy = focused ? 'risk_focused' : 'document';
    const initialGuidance = [focused ? riskGuidance(run.risk) : '', focused ? `NORMALIZATION_ATTEMPTED=${normalizationNeeded ? '1' : '0'}` : '', focused ? `NORMALIZATION_ACCEPTED=${normalizationAccepted ? '1' : '0'}` : '', focused ? `VERIFIED_SOURCE_EVIDENCE=${sourceMeaning.record}` : '', persistentGuidance].filter(Boolean).join('\n');
    let candidate: BatchResult;
    try { if (focused) totals.riskFocusedGenerations += 1; candidate = await translateBatch(config.aiCore, originals, request.targetLanguage, request.sourceLanguage, initialStrategy, config.timeoutMs, initialGuidance); add(candidate); }
    catch (error) { if (!deterministicValidationError(error)) throw error; const failedUsage = (error as { engineUsage?: EngineResult }).engineUsage; if (failedUsage) add(failedUsage); totals.validationFallbacks += 1; candidate = await translateBatch(config.aiCore, originals, request.targetLanguage, request.sourceLanguage, 'lines', config.timeoutMs, initialGuidance); add(candidate); }

    const candidateMeaning = await meaningRecord(config.aiCore, serializeMeaningBatch(candidate.bodies), config.timeoutMs); add(candidateMeaning.result);
    const first = await semanticVerdict(config.aiCore, sourceMeaning.record, candidateMeaning.record, request.targetLanguage, config.timeoutMs); add(first.result); totals.semanticValidations += 1;
    let acceptedMemoryContext = memoryContext;
    if (!semanticPass(first.verdict)) {
      const firstDeltas = semanticErrorDeltas(first.verdict, SEMANTIC_PASS_SCORE), firstRoute = selectCorrectionRoute(firstDeltas, 1); attempts.push({ attempt: 1, route: firstRoute, errors: firstDeltas }); await rememberFailure(1, firstRoute, firstDeltas, memoryContext);
      if (firstRoute !== 'FRESH_REGENERATE' && firstRoute !== 'REANALYZE') throw codedError('TRANSLATION_INTEGRITY_ROUTE_UNAVAILABLE', `Translation integrity route ${firstRoute} is not executable in the current translation phase.`, false, 422);
      if (run.contract.maxSemanticRegenerations < 1) throw codedError('TRANSLATION_INTEGRITY_ROUTE_UNAVAILABLE', 'Semantic regeneration budget is exhausted.', false, 422);
      const guidanceParts = [errorDeltaGuidance(firstDeltas)].filter(Boolean); let acceptedSourceRecord = sourceMeaning.record;
      if (firstRoute === 'REANALYZE') {
        if (run.contract.maxSourceReanalyses < 1) throw codedError('TRANSLATION_REANALYSIS_REQUIRED', 'Source reanalysis budget is exhausted.', false, 422);
        totals.sourceReanalyses += 1; const reanalysis = await reanalysisRecord(config.aiCore, originalBatch, errorDeltaGuidance(firstDeltas), config.timeoutMs); add(reanalysis.result);
        if (!sameLanguage(reanalysis.detectedLanguage, detectedSourceLanguage)) throw codedError('TRANSLATION_REANALYSIS_LANGUAGE_MISMATCH', `Source reanalysis changed detected language from ${detectedSourceLanguage} to ${reanalysis.detectedLanguage}.`, true, 502);
        const reanalysisEvidence = await evidenceIntegrityVerdict(config.aiCore, originalBatch, reanalysis.graph, config.timeoutMs); add(reanalysisEvidence.result); totals.evidenceValidations += 1;
        if (!evidenceIntegrityPass(reanalysisEvidence.verdict)) throw codedError('TRANSLATION_EVIDENCE_INTEGRITY_FAILED', `Reanalyzed source evidence is not safely grounded in ORIGINAL: ${evidenceIntegrityFailureSummary(reanalysisEvidence.verdict)}`, false, 422);
        acceptedSourceRecord = reanalysis.record; acceptedMemoryContext = { ...memoryContext, evidenceDigest: meaningEvidenceDigest(reanalysis.graph) }; guidanceParts.push(`REANALYZED_SOURCE_EVIDENCE=${reanalysis.record}`);
      }
      if (!first.verdict.targetLanguageMatch) guidanceParts.push(`Candidate prose must be translated into requested target language ${request.targetLanguage}; do not leave source prose untranslated.`);
      if (!guidanceParts.length) guidanceParts.push(`Semantic score ${first.verdict.score.toFixed(3)} was below ${SEMANTIC_PASS_SCORE}. Preserve every material meaning exactly.`);
      totals.semanticRetries += 1; const retry = await translateBatch(config.aiCore, originals, request.targetLanguage, request.sourceLanguage, 'semantic_retry', config.timeoutMs, guidanceParts.join('\n')); add(retry);
      const retryMeaning = await meaningRecord(config.aiCore, serializeMeaningBatch(retry.bodies), config.timeoutMs); add(retryMeaning.result);
      const second = await semanticVerdict(config.aiCore, acceptedSourceRecord, retryMeaning.record, request.targetLanguage, config.timeoutMs); add(second.result); totals.semanticValidations += 1;
      if (!semanticPass(second.verdict)) { const secondDeltas = semanticErrorDeltas(second.verdict, SEMANTIC_PASS_SCORE), secondRoute = selectCorrectionRoute(secondDeltas, 2); attempts.push({ attempt: 2, route: secondRoute, errors: secondDeltas }); await rememberFailure(2, secondRoute, secondDeltas, acceptedMemoryContext); throw codedError('TRANSLATION_SEMANTIC_EQUIVALENCE_FAILED', `Translation failed semantic equivalence after retry: route=${secondRoute}; errors=${errorDeltaGuidance(secondDeltas) || 'unspecified'}`, false, 422); }
      attempts.push({ attempt: 2, route: 'PASS', errors: [] }); candidate = retry; await rememberAccepted(2, acceptedMemoryContext);
    } else { attempts.push({ attempt: 1, route: 'PASS', errors: [] }); await rememberAccepted(1, memoryContext); }
    active.forEach(({ index }, translatedIndex) => { output[index] = { ...output[index]!, text: candidate.bodies[translatedIndex] ?? output[index]!.text }; });
  }

  return { request_id: request.requestId, profile_version: PROFILE_VERSION, ...(request.sourceLanguage ? { source_language: request.sourceLanguage } : {}), ...(detectedSourceLanguage ? { detected_source_language: detectedSourceLanguage } : {}), target_language: request.targetLanguage, language_capability_status: 'NOT_VERIFIED', segments: output, usage: { provider: 'ai_core_qwen3', model: QWEN_MODEL_ID, validation_model: GRANITE_MODEL_ID, calls: totals.calls, input_tokens: totals.inputTokens, output_tokens: totals.outputTokens, external_api_calls: 0, validation_fallbacks: totals.validationFallbacks, evidence_validations: totals.evidenceValidations, semantic_validations: totals.semanticValidations, semantic_retries: totals.semanticRetries, source_reanalyses: totals.sourceReanalyses, risk_focused_generations: totals.riskFocusedGenerations, normalization_attempts: totals.normalizationAttempts, normalization_accepts: totals.normalizationAccepts, normalization_rejects: totals.normalizationRejects, normalization_validations: totals.normalizationValidations, memory_hits: totals.memoryHits, memory_reopened: totals.memoryReopened, memory_writes: totals.memoryWrites, memory_errors: totals.memoryErrors, risk_class: risk.riskClass, risk_signals: risk.signals } };
}
