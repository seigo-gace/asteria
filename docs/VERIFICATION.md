# Verification

Canonical source verification is `npm run verify`, which runs strict TypeScript check then the Node contract suite.

CI also syntax-checks both benchmark scripts. Source/CI success proves only repository source behavior. It does not prove Contabo runtime, real AI Core integration, universal language quality, latency under load, Astera App cutover, same-language integrity capability, or Production readiness.

## Current phase — Translation Integrity Core

Before same-language canonical rewrite or native/style work, the current phase must prove that cross-language transformation preserves meaning and protected values and fails closed when correctness cannot be established.

Repository/CI gates cover request validation, protected-token/structure validation, source-language mismatch before translation generation, semantic-record validation, target-language rejection, model identity, loopback-only AI Core, Evidence Integrity, bounded retry/reanalysis, and second-failure fail-closed behavior.

The implemented Language Integrity Architecture v3 source slices now cover:

- typed `TransformationContract`, `TransformationRun`, `MeaningEvidenceGraph`, `AttemptRecord`, `ErrorDelta`, and bounded correction-route contracts;
- source semantic records normalized into a typed `MeaningEvidenceGraph` while ORIGINAL remains separate semantic authority;
- an independent pre-generation Granite Evidence Integrity Gate that rejects unsupported additions, contradictions, or invented ambiguity resolution;
- successful eligible requests record the local gate as `evidence_validations`; external translation API calls remain zero;
- ordinary semantic failure routes to one ORIGINAL-anchored `FRESH_REGENERATE` attempt;
- unresolved/guessed ambiguity routes to one bounded `REANALYZE` instead of immediate blind regeneration or unbounded retry;
- REANALYZE receives only ORIGINAL plus verifier `ErrorDelta`; it must not receive or copy the previous candidate translation;
- the fresh reanalysis graph must match the initial detected language and pass the same ORIGINAL-vs-EvidenceGraph integrity gate before regeneration is permitted;
- accepted reanalysis evidence is supplied to one ORIGINAL-anchored semantic retry and the final Granite comparison uses the accepted reanalysis source record;
- source reanalysis is bounded to one attempt (`maxSourceReanalyses=1`) and reported as `source_reanalyses`;
- reanalysis evidence failure is fail-closed before a second translation-generation call;
- a second semantic failure routes to `FAIL_CLOSED`.

Required source tests for this slice:

- direct fresh-context reanalysis prompt contract: previous candidate absent, ORIGINAL present, ambiguity must remain unresolved when unsupported;
- engine recovery path: ambiguity verdict -> one source reanalysis -> second Evidence Integrity pass -> ORIGINAL-anchored regeneration -> semantic PASS;
- reanalysis evidence rejection path: second Evidence Integrity failure -> no retry generation;
- existing deterministic, translation, target-language, model-identity and semantic-retry regressions remain green.

These behaviors are accepted only at `CI_EXACT_SHA` when the final head passes `npm run verify`. They do not prove real Qwen3/Granite multilingual runtime quality.

Live service acceptance uses `scripts/service-benchmark.py benchmarks/regression-corpus.seed.jsonl` against the real asteria service backed by Qwen3 + Granite. The current seed remains `SEED_NOT_ACCEPTANCE_AUTHORITY` until separately reviewed and exercised live.

## Architecture v3 remaining evidence

The following dimensions remain not source-complete or not acceptance-proven:

- Risk Router and selective heavy-path routing;
- multilingual/runtime proof that Granite reliably judges ORIGINAL-vs-EvidenceGraph integrity;
- multilingual/runtime proof that fresh-context REANALYZE improves ambiguity failures without adding unsupported meaning;
- Deterministic Japanese Parser MCP and other Language Intelligence Adapter integration;
- persistent Attempt/Checkpoint/Failure Memory;
- memory reuse that cannot blindly copy prior output;
- repeated-run semantic stability;
- real runtime coverage across language classes and adversarial meaning cases.

Source/CI PASS for Evidence Integrity or REANALYZE is therefore **not** universal proof of language correctness. Runtime and human evidence remain separate acceptance levels.

## Language Intelligence Adapter verification

Language-specific adapters are not universal completion evidence. Each adapter requires an A/B evaluation against the common core. For Deterministic Japanese Parser MCP, required evidence includes critical semantic error rate, polarity/condition/exception/modality/reference preservation, unresolved-meaning guessing rate, latency/CPU/RAM/call overhead, and both Japanese-input/output directions where applicable.

## Future same-language integrity verification

When `canonicalize` is implemented, quality remains split into mandatory Meaning Integrity and secondary clarity/style improvement. `No-op` must remain valid when rewriting would add risk without meaningful benefit.

## Completion evidence hierarchy

Runtime acceptance remains separate from source/CI and requires exact source/runtime revision alignment, real Qwen3 + Granite execution, multilingual/adversarial service regression, failure-path behavior, latency measurements, and later human-reviewed corpus/consumer E2E as their phases are reached.

No single language, corpus, CI run, HTTP 200, model response or runtime smoke test may be promoted to universal-language or complete semantic-integrity evidence. Deployment and Production readiness remain separate approval states.
