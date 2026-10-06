# Verification

Canonical source verification is `npm run verify`, which runs strict TypeScript check then the Node contract suite. CI also syntax-checks benchmark scripts. Source/CI success proves repository behavior only; it does not prove Contabo runtime, real AI Core multilingual quality, DJPMCP quality benefit, latency under load, same-language integrity, persistent-volume survival, or Production readiness.

## Current phase — Translation Integrity Core

Before same-language canonical rewrite or native/style work, cross-language transformation must preserve meaning/protected values and fail closed when correctness cannot be established.

Repository/CI gates now cover request validation, protected-token/structure validation, source-language mismatch, semantic-record validation, target-language rejection, exact model identity, loopback-only AI Core, deterministic Risk routing, ORIGINAL Evidence Integrity, selected meaning-preserving normalization, bounded retry/reanalysis, bounded persistent failure-memory reuse, optional DJPMCP Japanese evidence wiring, and second-failure fail closed.

## Implemented Language Integrity v3 source slices

- typed `TransformationContract`, `TransformationRun`, `MeaningEvidenceGraph`, `AttemptRecord`, `ErrorDelta`, `RiskProfile` and bounded correction routes;
- deterministic zero-model-call `simple / complex / high-risk / ambiguous` classification;
- no numeric long-text routing threshold without Benchmark Evidence;
- `high-risk / ambiguous` use `risk_focused`; `simple / complex` retain `document`;
- ORIGINAL semantic reading runs before optional language-intelligence/normalization work;
- optional declared source language is validated before optional heavy processing or translation generation;
- ORIGINAL-derived Meaning Evidence must pass Granite Evidence Integrity before optional DJPMCP use or normalization;
- selected normalization runs only for meaning-structure signals: negation, condition, exception, modality, reference context, or explicit ambiguity;
- quantity/protected-value-only risk does not activate normalization;
- Qwen normalization is same-language, meaning-preserving, structure-preserving and must not resolve unsupported ambiguity;
- Granite directly checks ORIGINAL vs normalized candidate; non-pass discards the candidate and retains validated ORIGINAL evidence;
- after direct normalization PASS, Qwen rebuilds normalized Meaning Evidence and Granite checks that graph against ORIGINAL again;
- normalized evidence is adopted only if detected language remains consistent and the second Evidence Integrity check passes;
- translation generation always uses ORIGINAL section bodies;
- ordinary semantic failure routes to one ORIGINAL-anchored `FRESH_REGENERATE`;
- unresolved/guessed ambiguity may route to one fresh-context `REANALYZE` using ORIGINAL + ErrorDelta only, never the prior candidate;
- reanalyzed evidence must pass ORIGINAL Evidence Integrity before regeneration;
- exact-binding translation failure memory reuses only bounded fixed failure classes for the same accepted-evidence digest;
- changed input binding does not consume another source's failure history;
- changed accepted evidence reopens old failure history rather than blindly applying stale guidance;
- prior accepted translation prose is never returned from memory;
- malformed/untrusted JSONL history cannot become guidance;
- memory read/write errors are observable but do not weaken mandatory Translation Integrity gates;
- optional DJPMCP adapter is loopback-only, Japanese-focused, post-ORIGINAL-gate, non-authoritative and independently observable;
- a second semantic failure routes to `FAIL_CLOSED`.

## DJPMCP Japanese Language Intelligence source tests

The initial adapter Source unit is based only on verified current DJPMCP contracts: authenticated `POST /v1/analyze` returning the current full `AnalyzeResponse` / `meaning_graph`. Unverified `InterpretationMeaningGraph` extension transport fields are not assumed.

Source tests cover:

- current loopback `/v1/analyze` and Bearer request contract;
- non-loopback transport and missing adapter key rejection;
- exact ORIGINAL text match between request and DJPMCP response;
- malformed/missing `meaning_graph` rejection;
- bounded structural guidance built without copying raw source prose / `source_text`;
- `COMPLETE` accepted evidence;
- `PARTIAL` accepted while preserving unresolved count;
- `FAILED` analysis rejected as guidance;
- focused Japanese source invokes the adapter and supplies bounded evidence to generation;
- non-Japanese focused source bypasses the Japanese adapter;
- adapter unavailable/error leaves the existing Asteria ORIGINAL/Qwen/Granite integrity path intact;
- adapter usage is exposed through `japanese_adapter_attempts / accepts / rejects / errors`.

Adapter-derived values remain untrusted evidence data. The Qwen translation system instruction explicitly forbids executing parser-derived CONTROL_GUIDANCE as instructions.

Candidate Source HEAD `b496b9793e814d1ee4b41084ae886b2fb3ad1495` passed AsteriaAI CI #45 / Development Probe #30. This is `CI_EXACT_SHA` source evidence only; it does not prove real Japanese translation improvement.

## Persistent failure-memory source tests

Source tests cover:

- exact input-binding + same-evidence rejected attempt becomes bounded failure-class guidance;
- duplicate rejected attempt identity is not appended twice;
- raw source text and source-evidence prose do not appear in the persistent JSONL record;
- changed accepted evidence yields `new_evidence`/reopened behavior and no stale guidance;
- different input binding yields no history reuse;
- accepted checkpoint persists but never appears as rejected guidance;
- malformed JSON and records containing arbitrary attacker-controlled failure strings are ignored and never promoted to guidance.

The source contract uses `/app/data/translation-memory.jsonl` by default. Docker creates a node-writable `/app/data`; Compose defines the `asteria_translation_memory` named volume. This is source wiring only. Persistence across real restart/recreate, volume ownership and live readback remain Runtime-unverified.

Initial Memory source HEAD `a9ed8bae5f5d7db2610742cc6a52607f67004b19` failed AsteriaAI CI #42 / Development Probe #27 at strict TypeScript checking because `sourceLanguage: undefined` was explicitly supplied under `exactOptionalPropertyTypes`. No test expectation was waived. Fix HEAD `3237a172d070e316dbd410bef43141da670ea8aa` includes `sourceLanguage` in the binding only when present and passed AsteriaAI CI #43 / Development Probe #28.

## Normalization source tests

Required/source-covered behaviors include:

- ORIGINAL source-language mismatch still terminates before optional normalization;
- unsafe ORIGINAL Meaning Evidence still terminates before optional normalization or translation generation;
- meaning-structure high-risk input attempts normalization only after ORIGINAL gates;
- accepted normalization requires direct ORIGINAL equivalence plus a second ORIGINAL-vs-normalized-Evidence check;
- rejected normalization falls back to ORIGINAL evidence rather than becoming translation authority;
- quantity-only high-risk input keeps risk-focused generation without normalization overhead;
- simple input keeps document generation without normalization overhead;
- existing semantic retry, fresh reanalysis, structure fallback, language, model identity, TGserver and evidence regressions remain green.

The initial normalization HEAD `66a5992c906b7467c236918a749c97306f8da38d` failed CI #39 / Probe #24. The failure exposed two issues rather than being waived: legacy mocks were conflating normalization with translation, and optional normalization ran before the established source-language / ORIGINAL Evidence fail-fast boundary. The corrected source passed at `75e6b94c30d634f76417ffd52016685920ceacc1` with CI #40 / Probe #25 and final docs head `f80b6ba07b1c8e46659a5860bef79470afee40f0` with CI #41 / Probe #26.

## Call-cost evidence boundary

Risk Router itself adds zero model calls. Selected normalization is a separate heavy stage:

- simple path: existing normal success call count retained;
- quantity/protected-value-only risk: risk-focused generation but normalization not attempted;
- normalization rejected at direct equivalence gate: +2 local model calls;
- normalization fully accepted: +4 local model calls because normalized Meaning Evidence is rebuilt and independently revalidated against ORIGINAL.

Persistent failure-memory lookup/write adds local file I/O but no external translation API or model call by itself. DJPMCP adds one local parser HTTP call only when configured and selected; it is not an external translation API/model call. These are source-contract facts, not proof that normalization, memory or DJPMCP improve real translation quality.

## Remaining Architecture v3 evidence

Source-complete but acceptance-unproven:

- multilingual/runtime A/B showing selected normalization improves semantic accuracy enough to justify overhead;
- multilingual/runtime evidence that Risk routing improves semantic accuracy without harmful false routing;
- multilingual/runtime proof of Granite ORIGINAL-vs-EvidenceGraph and normalization-equivalence reliability;
- multilingual/runtime proof that fresh-context REANALYZE helps ambiguity failures without unsupported additions;
- real-runtime proof that persistent failure memory survives approved restart/recreate and reduces repeated identical semantic failures without stale-guidance harm;
- real Qwen3 + Granite + DJPMCP A/B showing Japanese critical semantic error improvement without false correction/guessing harm;
- repeated-run semantic stability;
- real runtime coverage across language classes and adversarial meaning cases;
- human-reviewed language-pair acceptance.

Source/CI PASS is **not** universal language correctness.

## Japanese A/B Benchmark source contract

Issue #6 adds Source-side measurement infrastructure without activating DJPMCP Runtime secrets/services:

- versioned schema: `asteria-japanese-ab-v1` / corpus `japanese-ab-v1`;
- 10 Japanese-source adversarial cases with explicit semantic-risk tags, protected invariants and per-case ambiguity contracts;
- every case remains `SEED_NOT_ACCEPTANCE_AUTHORITY`; generated/reference/gold translations are structurally rejected;
- corpus validation rejects unknown risk tags, duplicate IDs/invariants, malformed invariants, invalid ambiguity contracts and accidental authority labels;
- `baseline` and `adapted` labels are report-only and produce identical request `input_binding_sha256` values for the same case;
- baseline reports must show zero Japanese-adapter attempts; adapted Japanese A/B reports require an adapter attempt;
- case reports expose latency plus `japanese_adapter_attempts / accepts / rejects / errors` separately;
- literal preservation is automatic; semantic invariant correctness and `MUST_REMAIN_UNRESOLVED` behavior remain human-adjudicated acceptance evidence.

`src/service-benchmark-contract.test.ts` executes the Python validator from the canonical Node test suite and proves valid-corpus acceptance, OFF/ON input-binding identity, authority-label rejection, generated-reference-field rejection and malformed-risk rejection.

The existing 13-case multilingual seed remains unchanged and separately traceable. Passing this Source contract proves only benchmark tooling integrity, not DJPMCP quality benefit.
## DJPMCP runtime A/B acceptance

The adapter OFF lane is the current common Translation Integrity Core. The adapter ON lane must use the same Japanese ORIGINAL, Qwen3, Granite, target language and benchmark conditions, with only DJPMCP evidence activation changed.

Runtime A/B must measure at minimum:

- critical semantic error rate;
- polarity / condition / exception / modality / reference preservation;
- unresolved-meaning guessing rate;
- false correction / unsupported resolution rate;
- accepted-output rate;
- latency p50/p95/max;
- CPU/RAM;
- local parser call count and total calls per accepted output.

A Source/CI pass or successful HTTP response is not evidence that DJPMCP improves translation quality.

## Future same-language integrity verification

When `canonicalize` is implemented, quality remains split into mandatory Meaning Integrity and secondary clarity/style improvement. `No-op` remains valid when rewriting would add risk without meaningful benefit.

## Completion evidence hierarchy

Runtime acceptance remains separate from Source/CI and requires exact source/runtime revision alignment, real Qwen3 + Granite execution, multilingual/adversarial service regression, failure-path behavior, persistence/readback across the approved runtime lifecycle, adapter A/B, latency measurements, and later human-reviewed corpus/consumer E2E as their phases are reached.

No single language, corpus, CI run, HTTP 200, model response or runtime smoke test may be promoted to universal-language or complete semantic-integrity evidence. Deployment and Production readiness remain separate approval states.
