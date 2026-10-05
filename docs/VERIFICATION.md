# Verification

Canonical source verification is `npm run verify`, which runs strict TypeScript check then the Node contract suite. CI also syntax-checks both benchmark scripts. Source/CI success proves only repository source behavior; it does not prove Contabo runtime, real AI Core integration, universal language quality, latency under load, same-language integrity, or Production readiness.

## Current phase — Translation Integrity Core

Before same-language canonical rewrite or native/style work, cross-language transformation must preserve meaning/protected values and fail closed when correctness cannot be established.

Repository/CI gates cover request validation, protected-token/structure validation, source-language mismatch, semantic-record validation, target-language rejection, exact model identity, loopback-only AI Core, Evidence Integrity, deterministic Risk routing, bounded retry/reanalysis, and second-failure fail closed.

Implemented Language Integrity v3 source slices now cover:

- typed `TransformationContract`, `TransformationRun`, `MeaningEvidenceGraph`, `AttemptRecord`, `ErrorDelta` and bounded correction routes;
- deterministic zero-model-call `RiskProfile` classification as `simple / complex / high-risk / ambiguous`;
- Router signals derived from source surface evidence including segment/context shape, script mix, explicit negation, conditions/exceptions, modality, protected quantities/values, reference context and explicit ambiguity;
- code-point length retained as trace only: no numeric long-text routing threshold is accepted without Benchmark Evidence;
- `high-risk` / `ambiguous` select `risk_focused` first generation; `simple` / `complex` preserve the existing `document` path;
- Risk routing does not disable or weaken Evidence Integrity, deterministic protected-value/structure checks, semantic validation, or fail-closed behavior;
- normal successful path call count is unchanged by Risk routing; Router behavior is observable through `risk_class`, `risk_signals`, and `risk_focused_generations`;
- source semantic records normalized into typed `MeaningEvidenceGraph` while ORIGINAL remains separate authority;
- independent pre-generation Granite Evidence Integrity rejects unsupported additions, contradictions or invented ambiguity resolution;
- ordinary semantic failure routes to one ORIGINAL-anchored `FRESH_REGENERATE`;
- unresolved/guessed ambiguity routes to one bounded fresh-context `REANALYZE` using ORIGINAL + ErrorDelta only, never the prior candidate;
- reanalyzed evidence must preserve detected language and pass Evidence Integrity again before regeneration;
- a second semantic failure routes to `FAIL_CLOSED`.

Required source tests for the Risk Router slice:

- plain single-script input => `simple`;
- multi-segment/reference-context input => `complex` and context-selection trace;
- negation/condition/protected quantity => `high-risk`;
- explicit ambiguity => `ambiguous` with precedence over lower classes;
- protected code/URL excluded from script-mix detection while still traced as protected risk;
- long text records length but does not change risk class through an invented numeric threshold;
- engine high-risk path selects `STRATEGY=risk_focused`, keeps Evidence Integrity enabled, keeps `external_api_calls=0`, and adds no normal-path model call;
- engine simple path remains `STRATEGY=document` with the same integrity gates;
- all existing deterministic, Evidence Integrity, translation, reanalysis, target-language, model-identity and semantic-retry regressions remain green.

These behaviors are accepted only at `CI_EXACT_SHA` when the final head passes `npm run verify`. They do not prove real Qwen3/Granite multilingual runtime quality or that every language-specific risk phenomenon is covered.

Live service acceptance uses `scripts/service-benchmark.py benchmarks/regression-corpus.seed.jsonl` against the real service. The current seed remains `SEED_NOT_ACCEPTANCE_AUTHORITY` until separately reviewed and exercised live.

## Architecture v3 remaining evidence

The following remain not source-complete or not acceptance-proven:

- targeted meaning-preserving projection / normalization selected by Risk Router;
- multilingual/runtime evidence that Risk routing improves semantic accuracy without unacceptable latency or false routing;
- multilingual/runtime proof that Granite reliably judges ORIGINAL-vs-EvidenceGraph integrity;
- multilingual/runtime proof that fresh-context REANALYZE improves ambiguity failures without unsupported additions;
- Deterministic Japanese Parser MCP and other Language Intelligence Adapter integration;
- persistent Attempt/Checkpoint/Failure Memory and safe memory reuse;
- repeated-run semantic stability;
- real runtime coverage across language classes and adversarial meaning cases.

Source/CI PASS for Router, Evidence Integrity or REANALYZE is **not** universal language correctness. Runtime and human evidence remain separate acceptance levels.

## Language Intelligence Adapter verification

Language-specific adapters are not universal completion evidence. Each adapter requires controlled A/B evaluation against the common core. For Deterministic Japanese Parser MCP this includes critical semantic error rate, polarity/condition/exception/modality/reference preservation, unresolved-meaning guessing rate, latency/CPU/RAM/call overhead, and Japanese-input/output directions where applicable.

## Future same-language integrity verification

When `canonicalize` is implemented, quality remains split into mandatory Meaning Integrity and secondary clarity/style improvement. `No-op` remains valid when rewriting would add risk without meaningful benefit.

## Completion evidence hierarchy

Runtime acceptance remains separate from Source/CI and requires exact source/runtime revision alignment, real Qwen3 + Granite execution, multilingual/adversarial service regression, failure-path behavior, latency measurements, and later human-reviewed corpus/consumer E2E as their phases are reached.

No single language, corpus, CI run, HTTP 200, model response or runtime smoke test may be promoted to universal-language or complete semantic-integrity evidence. Deployment and Production readiness remain separate approval states.
