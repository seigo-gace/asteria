# Verification

Canonical source verification is `npm run verify`, which runs strict TypeScript check then the Node contract suite.

CI also syntax-checks both benchmark scripts. Source/CI success proves only repository source behavior. It does not prove Contabo runtime, real AI Core integration, universal language quality, latency under load, Astera App cutover, same-language integrity capability, or Production readiness.

## Current phase — Translation Integrity Core

Before same-language canonical rewrite or native/style work, the current phase must prove that cross-language transformation preserves meaning and protected values and fails closed when correctness cannot be established.

Repository/CI gates currently cover request validation, protected-token/structure validation, source-language mismatch before translation generation, semantic-record validation, target-language rejection, model identity, loopback-only AI Core, and second-failure fail-closed behavior.

The implemented Language Integrity Architecture v3 source slices now cover:

- typed `TransformationContract`, `TransformationRun`, `MeaningEvidenceGraph`, `AttemptRecord`, `ErrorDelta`, and bounded correction-route contracts;
- source semantic records normalized into a typed `MeaningEvidenceGraph` containing detected language, claims, constraints, conditions, entities, quantities, and uncertainties;
- graph construction uses the existing Qwen semantic-recorder result, so graph construction itself adds no additional Qwen call;
- ORIGINAL text remains the semantic authority and is stored separately from source evidence in `TransformationRun`;
- an independent pre-generation Evidence Integrity Gate sends raw ORIGINAL plus the graph to Granite and rejects unsupported additions, contradictions, or invented ambiguity resolution;
- the Evidence Integrity Gate must pass at score `>=0.98` with no reported integrity defect before translation generation is permitted;
- Evidence Integrity failure is fail-closed as `TRANSLATION_EVIDENCE_INTEGRITY_FAILED` and must occur before any translation-generation call;
- successful non-empty requests record exactly one `evidence_validations` operation in usage; this adds one local Granite call and therefore changes latency/CPU/call count even though external translation API calls remain zero;
- semantic-verdict failures are classified into critical error categories including omission, unsupported addition, contradiction, polarity, condition/exception, modality, entity/reference, quantity/time, wrong language, literal/structure and unresolved guessing;
- ordinary semantic failure routes to one `FRESH_REGENERATE` attempt anchored to ORIGINAL input;
- unresolved or guessed ambiguity routes to `REANALYZE`; because executable source reanalysis is not implemented yet, the current engine fails closed with `TRANSLATION_REANALYSIS_REQUIRED` rather than blindly regenerating;
- a second semantic failure routes to `FAIL_CLOSED`;
- target-language retry guidance retains the concrete requested target language.

Source tests must prove both sides of the Evidence Integrity Gate: a grounded graph passes, while unsupported evidence or invented resolution fails before translation generation. Existing translation/retry/structure tests must also pass with the additional validator call and updated call-count expectations.

These source behaviors are acceptance only at `CI_EXACT_SHA` when the final head passes `npm run verify`. They do not prove real Qwen3/Granite runtime quality or universal multilingual Evidence Integrity performance.

Live service acceptance uses `scripts/service-benchmark.py benchmarks/regression-corpus.seed.jsonl` against the real asteria service backed by Qwen3 + Granite. The current 13-case seed covers multilingual/adversarial meaning risks including negation, prohibitions, conditions, exceptions, quantities, deadlines, ordering, permissions, low-resource Swahili, RTL/CJK scripts, and embedded prompt-injection text.

The service benchmark is a fail-closed execution gate: any HTTP/contract failure, empty translation, required protected-literal loss, or non-zero `external_api_calls` produces `gate=FAIL` and process exit 1. A benchmark PASS still does not promote the corpus to human-reviewed language-pair authority; every seed row remains `SEED_NOT_ACCEPTANCE_AUTHORITY` until separately reviewed.

## Architecture v3 remaining evidence

The following dimensions remain not source-complete or not acceptance-proven:

- multilingual/runtime proof that Granite can reliably judge ORIGINAL-vs-EvidenceGraph integrity across the required language classes;
- Risk Router;
- executable `REANALYZE` source analysis;
- Deterministic Japanese Parser MCP and other Language Intelligence Adapter integration;
- persistent Attempt/Checkpoint/Failure Memory;
- memory reuse that cannot blindly copy prior output;
- repeated-run semantic stability;
- real runtime coverage across language classes and adversarial meaning cases.

Meaning Evidence Graph existence and a source-test PASS are therefore **not** universal proof that its content is correct. The pre-generation gate adds an independent rejection layer, while multilingual runtime and human evidence remain separate acceptance levels.

## Language Intelligence Adapter verification

Language-specific adapters are not universal completion evidence. Each adapter requires an A/B evaluation against the common core.

For Deterministic Japanese Parser MCP, required evidence includes at minimum:

- identical Japanese test corpus with adapter disabled/enabled;
- critical semantic error rate;
- polarity/condition/exception/modality/reference preservation;
- unresolved-meaning guessing rate;
- latency/CPU/RAM/call overhead;
- Japanese→other-language and other-language→Japanese coverage where applicable.

A DJPMCP improvement proves the adapter's value for tested Japanese risk classes; it does not prove universal-language completion.

## Future same-language integrity verification

When `canonicalize` is implemented, quality is split into separate axes:

1. **Meaning Integrity** — mandatory gate.
2. **Clarity/readability/style improvement** — secondary quality objective.

Required same-language gates include preservation of negation, conditions, exceptions, quantities, dates/deadlines, entities, references, causality, order and modality strength. `No-op` must be accepted as correct when rewriting is unnecessary or riskier than preserving the original.

## Completion evidence hierarchy

Runtime acceptance remains separate from source/CI and requires exact source/runtime revision alignment, real Qwen3 + Granite execution, multilingual/adversarial service regression, failure-path behavior, latency measurements, and later human-reviewed corpus/consumer E2E as their phases are reached.

Final quality reporting should include, where applicable:

- critical semantic error rate;
- omission/addition/contradiction counts;
- polarity/condition/exception/modality defects;
- entity/reference/quantity/time defects;
- unresolved-meaning guessing rate;
- protected-invariant retention;
- repeated-run semantic stability;
- human pairwise adjudication;
- p50/p95/max latency;
- CPU/RAM and calls per accepted output.

No single language, corpus, CI run, HTTP 200, model response or runtime smoke test may be promoted to universal-language or complete semantic-integrity evidence. Deployment and Production readiness remain separate approval states.
