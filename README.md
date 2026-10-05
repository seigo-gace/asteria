# asteria

`asteria` is the semantic-preserving Language Transformation project for the G-ACE workspace. The runtime service name remains `asteria-ai`.

## Purpose

asteria exists to accurately read text in any language and transform it into the best expression in the same or another language **without changing material meaning**, with explicit verification before output is accepted.

The completed product is intended to use one shared Meaning Integrity Core for cross-language translation, same-language canonical rewrite, and later controlled style/native-expression transformation. The current implementation priority remains **cross-language translation correctness first**; same-language rewrite and style/native optimization must not delay the Translation Integrity Core.

asteria owns language-transformation AI execution, deterministic preservation, semantic evidence/verification, benchmarking, runtime boundaries, and its TGserver ZERO P007 runtime producer. Product applications keep their own UI/domain mapping and send generic ordered segments.

Migration source authority: Astera App Draft PR #72, source snapshot `169be9309695396b27f05e4f91fea4823ea5e8fc`.

## Current source contract

Current implemented behavior is the translation baseline with executable Language Integrity Architecture v3 control slices:

- Qwen3 is the sole translator/generator and semantic recorder; it also performs one bounded fresh-context source reanalysis when required.
- Granite independently checks source evidence against ORIGINAL, then judges translation semantic equivalence and requested target language.
- AI Core Router is the only model path; loopback HTTP only; external translation API fallback = 0.
- protected tokens, section order, Markdown shape, line shape and information volume are deterministic gates.
- embedded instructions are treated as untrusted data.
- `target_language` is required BCP47; optional `source_language` fails closed on detected mismatch before translation generation.
- invalid semantic-recorder `detected_language` values fail closed; non-empty `glossary_id` is reserved and fails closed as not implemented.
- language capability remains `NOT_VERIFIED` until measured; Source/CI PASS is not universal-language correctness.
- each source semantic record is normalized into a typed `MeaningEvidenceGraph` while ORIGINAL remains semantic authority.
- before translation generation, an independent Evidence Integrity Gate compares raw ORIGINAL with the source graph and rejects unsupported additions, contradictions, or invented ambiguity resolution.
- semantic failures become typed critical `ErrorDelta` values and route through bounded `PASS / LOCAL_FIX / FRESH_REGENERATE / REANALYZE / FAIL_CLOSED` control.
- ordinary semantic differences route to one ORIGINAL-anchored `FRESH_REGENERATE` attempt.
- unresolved/guessed ambiguity routes to one bounded `REANALYZE`: Qwen3 re-reads ORIGINAL + verifier ErrorDelta only in fresh context; prior candidate translation is excluded and rebuilt evidence must pass Evidence Integrity again.
- a second semantic failure routes to `FAIL_CLOSED`.
- a deterministic, zero-model-call **Risk Router** classifies active input as `simple / complex / high-risk / ambiguous` from explicit surface signals such as script mix, segment/context shape, negation, condition/exception, modality, protected quantities/values, reference context and explicit ambiguity.
- no arbitrary text-length threshold is used; code-point length is retained only as trace until Benchmark Evidence supports a routing threshold.
- `high-risk` and `ambiguous` inputs use `risk_focused` first-generation instructions and bounded risk guidance; `simple` and `complex` inputs retain the existing `document` path.
- Risk routing does **not** skip Evidence Integrity, semantic validation, protected-value checks or fail-closed behavior, and it adds no AI call on the normal success path.
- response usage exposes bounded Router trace through `risk_class`, `risk_signals`, and `risk_focused_generations` alongside `evidence_validations`, `semantic_validations`, `semantic_retries`, and `source_reanalyses`.

`src/risk-router.ts` performs deterministic routing; `src/integrity-control.ts` stores the RiskProfile on `TransformationRun`; `src/evidence-integrity.ts` validates source evidence; `src/semantic.ts` owns semantic record/reanalysis; `src/engine.ts` orchestrates risk-selected generation, evidence validation, bounded reanalysis/regeneration, and typed failure routing without changing the translation request contract.

## Current completion phase

The current phase is intentionally limited to **Translation Integrity Core**: meaning preservation, safety, correctness and reproducible evidence before same-language canonical rewrite or native/style optimization.

Source-side completion gates currently include deterministic protected-value/structure validation, semantic equivalence/requested-language verification, ORIGINAL-anchored retry, fail-closed language/evidence handling, deterministic Risk Router classification with selective risk-focused first generation, typed source evidence, independent ORIGINAL-vs-EvidenceGraph validation, one bounded fresh-context reanalysis, and second-failure fail closed.

The 13-case multilingual/adversarial regression seed covers negation, prohibitions, conditions, exceptions, quantities, deadlines, ordering, permissions, mixed scripts, low-resource Swahili, and embedded prompt-injection text. The service benchmark fails on HTTP/contract failure, empty translation, required protected-literal loss, or any external translation API call. TGserver ZERO P007 emits only bounded lifecycle metadata.

These remain repository/CI capabilities until the exact branch is exercised against the real Qwen3 + Granite runtime. Risk routing, Evidence Integrity and REANALYZE all require multilingual runtime/human evidence before universal benefit can be claimed. The regression seed remains `SEED_NOT_ACCEPTANCE_AUTHORITY` until reviewed and exercised live.

## Architecture

```text
Original Input / Context (Authority)
  -> Surface Integrity Scan
  -> Transformation Intent Contract
  -> Deterministic Risk Router
       -> simple / complex: existing controlled generation path
       -> high-risk / ambiguous: risk-focused generation path
       -> future: selected projection / Language Intelligence Adapter only when justified
  -> Meaning Acquisition
  -> Meaning Evidence Graph
  -> Evidence Integrity Gate
  -> Transformation Planner
  -> Qwen3 Controlled Generation
  -> deterministic + Granite independent verification
  -> Error Delta Router
       -> PASS / LOCAL_FIX / FRESH_REGENERATE / REANALYZE / FAIL_CLOSED
  -> Final Integrity Gate
  -> accepted output
```

The **Original Input remains semantic authority**. `MeaningEvidenceGraph` is extracted evidence and never silently replaces or overrides ORIGINAL. Unknown or ambiguous meaning remains unresolved rather than guessed.

The executable `/internal/v1/translate` path now uses deterministic Risk routing, typed source evidence, pre-generation Evidence Integrity, bounded fresh-context REANALYZE and typed failure routing. Targeted meaning-preserving projection, Language Intelligence Adapters, same-language canonicalization, and persistent Attempt/Checkpoint/Failure Memory remain later verified source units. See [`docs/DESIGN.md`](docs/DESIGN.md) and [`docs/DESIGN_DELTA.md`](docs/DESIGN_DELTA.md).

asteria does not know Astera App's eight result keys.

## Internal API

All routes require `Authorization: Bearer <ASTERIA_INTERNAL_TOKEN>`.

- `GET /internal/v1/health`
- `GET /internal/v1/capabilities`
- `POST /internal/v1/translate`

Translate request uses `request_id`, `profile_version`, BCP47 `target_language`, optional `source_language`, reserved `glossary_id`, and ordered `{id,text}` segments. Usage reports total calls and separate integrity/retry/router counters. Same-language transformation endpoints/modes are adopted future architecture but are **not yet implemented**.

## TGserver ZERO runtime logging

Project identity is `P007` / stream `default`. The producer sends only bounded lifecycle metadata through canonical `POST /ingest/bulk` and never sends translation text, request bodies, bearer tokens, AI Core keys, arbitrary exception messages, or provider response bodies. TGserver unavailability is fail-open and does not change translation API semantics.

```text
TGSERVER_LOG_URL=http://127.0.0.1:3000
TGSERVER_LOG_TIMEOUT_MS=1500
```

The central Reader path for `seigo-gace/asteria` / P007 is already proven from CHAT through TGserver ZERO. Current-branch runtime events still require exact-head deployment/readback before current-runtime PASS.

## Development

Node `>=22.12 <23`.

```bash
npm install --no-fund --no-audit
npm run verify
python3 -m py_compile scripts/raw-model-benchmark.py scripts/service-benchmark.py
```

## Runtime boundary

No main merge, new model download, external provider change, production public cutover, or unrelated secret/provider mutation is part of the current Translation Integrity source unit. Existing server project is `/home/admin1/projects/asteria`; runtime/source synchronization and live verification are separate evidence gates.

## Documentation

- [`docs/DESIGN.md`](docs/DESIGN.md) — current architecture plus preserved migration baseline
- [`docs/DESIGN_DELTA.md`](docs/DESIGN_DELTA.md) — adopted Language Integrity Architecture v3 decision and rationale
- [`docs/LANGUAGE_CAPABILITY.md`](docs/LANGUAGE_CAPABILITY.md) — evidence boundary for language support
- [`docs/VERIFICATION.md`](docs/VERIFICATION.md) — source/runtime/integrity acceptance gates
- [`docs/MIGRATION_FROM_ASTERA_APP.md`](docs/MIGRATION_FROM_ASTERA_APP.md) — migration ownership boundary
- [`docs/PROJECT_TREE.md`](docs/PROJECT_TREE.md) — navigation index
- [`docs/TGSERVER_ZERO_DEVELOPMENT_EVIDENCE.md`](docs/TGSERVER_ZERO_DEVELOPMENT_EVIDENCE.md) — runtime logging evidence
