# Verification

Canonical source verification is `npm run verify`, which runs strict TypeScript check then the Node contract suite.

CI also syntax-checks both benchmark scripts. Source/CI success proves only repository source behavior. It does not prove Contabo runtime, real AI Core integration, universal language quality, latency under load, Astera App cutover, same-language integrity capability, or Production readiness.

## Current phase — Translation Integrity Core

Before same-language canonical rewrite or native/style work, the current phase must prove that cross-language transformation preserves meaning and protected values and fails closed when correctness cannot be established.

Repository/CI gates currently cover request validation, protected-token/structure validation, source-language mismatch before translation generation, semantic-record validation, semantic retry from ORIGINAL input, target-language rejection, model identity, loopback-only AI Core, and second-failure fail-closed behavior.

Live service acceptance uses `scripts/service-benchmark.py benchmarks/regression-corpus.seed.jsonl` against the real asteria service backed by Qwen3 + Granite. The current 13-case seed covers multilingual/adversarial meaning risks including negation, prohibitions, conditions, exceptions, quantities, deadlines, ordering, permissions, low-resource Swahili, RTL/CJK scripts, and embedded prompt-injection text.

The service benchmark is a fail-closed execution gate: any HTTP/contract failure, empty translation, required protected-literal loss, or non-zero `external_api_calls` produces `gate=FAIL` and process exit 1. A benchmark PASS still does not promote the corpus to human-reviewed language-pair authority; every seed row remains `SEED_NOT_ACCEPTANCE_AUTHORITY` until separately reviewed.

## Architecture v3 integrity evidence

The adopted Language Integrity architecture adds verification dimensions beyond the current executable baseline. Source implementation and acceptance must separately prove:

- Original Input remains the authority and is not silently replaced by an intermediate representation;
- Meaning Evidence Graph does not add unsupported facts or silently resolve ambiguity;
- omission, unsupported addition and contradiction detection;
- polarity/negation preservation;
- condition and exception preservation;
- modality/deontic-strength preservation;
- entity, reference/coreference, quantity and temporal preservation;
- unresolved/ambiguous meaning is not guessed;
- Transformation Contract invariants survive generation;
- ErrorDelta routes the failure to the correct bounded action: local fix, fresh regeneration, reanalysis or fail-closed;
- repeated identical failures do not loop indefinitely;
- memory reuse does not blindly copy prior output;
- risk routing does not weaken correctness for simple-path inputs.

These gates are **design-adopted but not yet source-implemented** unless and until exact-source evidence proves otherwise.

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
