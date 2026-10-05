# asteria

`asteria` is the semantic-preserving Language Transformation project for the G-ACE workspace. The runtime service name remains `asteria-ai`.

## Purpose

asteria exists to accurately read text in any language and transform it into the best expression in the same or another language **without changing material meaning**, with explicit verification before output is accepted.

The completed product is intended to use one shared Meaning Integrity Core for:

- cross-language translation;
- same-language canonical rewrite;
- later controlled style/native-expression transformation.

The current implementation priority remains **cross-language translation correctness first**. Same-language rewrite and style/native optimization are follow-on modes and must not delay completion of the Translation Integrity Core.

asteria owns language-transformation AI execution, deterministic preservation, semantic evidence/verification, benchmarking, runtime boundaries, and its TGserver ZERO P007 runtime producer. Product applications keep their own UI/domain mapping and send generic ordered segments.

Migration source authority: Astera App Draft PR #72, source snapshot `169be9309695396b27f05e4f91fea4823ea5e8fc`.

## Current source contract

Current implemented behavior is the translation baseline with the first Architecture v3 control and evidence path wired into runtime orchestration:

- Qwen3 is the sole translator/generator.
- Qwen3 independently records original/candidate meaning and performs bounded fresh-context source reanalysis when required.
- Granite independently checks source evidence against ORIGINAL, then judges translation semantic equivalence and requested target language.
- AI Core Router is the only model path; loopback HTTP only.
- external translation API fallback = 0.
- protected tokens, section order, Markdown shape, line shape and information volume are deterministic gates.
- embedded instructions are treated as untrusted data.
- `target_language` is required BCP47; `source_language` is optional BCP47 and fails closed on detected mismatch before translation generation.
- invalid semantic-recorder `detected_language` values fail closed.
- non-empty `glossary_id` is reserved but currently returns `TRANSLATION_GLOSSARY_NOT_IMPLEMENTED`.
- language capability is `NOT_VERIFIED` until measured; source/CI PASS is not universal-language correctness.
- each source semantic record is normalized into a typed `MeaningEvidenceGraph` while ORIGINAL text remains the semantic authority.
- graph construction reuses the existing semantic-recorder call; it does **not** add another Qwen call.
- before translation generation, an independent Evidence Integrity Gate compares raw ORIGINAL with the source graph and rejects unsupported additions, contradictions, or invented ambiguity resolution.
- the initial Evidence Integrity Gate adds one local Granite validation call for every eligible non-empty request and is reported as `evidence_validations`.
- semantic failures are converted to typed critical `ErrorDelta` values and routed through bounded Architecture v3 correction control.
- ordinary semantic differences route to one ORIGINAL-anchored `FRESH_REGENERATE` attempt.
- unresolved/guessed ambiguity routes to one bounded `REANALYZE`: Qwen3 re-reads **ORIGINAL + verifier ErrorDelta only** in fresh context, never the prior candidate translation; the rebuilt graph must pass Evidence Integrity again before regeneration is permitted.
- accepted reanalysis evidence is supplied as guidance to one ORIGINAL-anchored semantic retry and becomes the source record used by the final Granite comparison.
- source reanalysis is bounded to one attempt and reported as `source_reanalyses`; a bad reanalysis graph fails closed before another translation generation.
- a second semantic failure routes to `FAIL_CLOSED`.

`src/integrity-control.ts` defines typed control contracts and one-shot regeneration/reanalysis budgets. `src/semantic.ts` materializes source evidence and performs fresh-context reanalysis. `src/evidence-integrity.ts` independently validates source graphs against ORIGINAL. `src/engine.ts` orchestrates accepted evidence, bounded reanalysis, ORIGINAL-anchored regeneration, and typed failure routing without changing the translation request contract.

## Current completion phase

The current phase is intentionally limited to **Translation Integrity Core**: meaning preservation, safety, correctness and reproducible evidence before same-language canonical rewrite or native/style optimization.

Source-side completion gates currently include:

- deterministic protected-value and structure validation;
- semantic equivalence and requested-language verification;
- retry from ORIGINAL input only;
- fail-closed source-language mismatch and invalid semantic-language detection;
- typed Architecture v3 integrity-control contracts and deterministic error-delta routing;
- typed source `MeaningEvidenceGraph` construction without an additional Qwen call;
- independent ORIGINAL-vs-EvidenceGraph validation before translation generation;
- fail-closed rejection of unsupported evidence, evidence contradictions, and invented ambiguity resolution;
- one bounded fresh-context source reanalysis path for unresolved/guessed meaning, followed by Evidence Integrity revalidation and ORIGINAL-anchored regeneration;
- no previous candidate translation is supplied to source reanalysis;
- a 13-case multilingual/adversarial regression seed covering negation, prohibitions, conditions, exceptions, quantities, deadlines, ordering, permissions, mixed scripts, low-resource Swahili, and embedded prompt-injection text;
- a service benchmark that exits non-zero on HTTP/contract failure, empty translation, protected-literal loss, or any external translation API call;
- a bounded fail-open TGserver ZERO P007 runtime producer for `asteria_started`, `translate_succeeded`, and `translate_failed`.

These are repository/CI capabilities only until the same branch is exercised against the real Qwen3 + Granite runtime. Evidence Integrity and REANALYZE both require multilingual runtime/human evidence before they can be treated as universal source-understanding proof. The regression seed remains `SEED_NOT_ACCEPTANCE_AUTHORITY` until reviewed and live evidence is captured.

## Architecture

Current adopted design direction:

```text
Original Input / Context (Authority)
  -> Surface Integrity Scan
  -> Transformation Intent Contract
  -> Risk Router
  -> Meaning Acquisition
       -> common semantic reading
       -> targeted meaning-preserving projection when justified
       -> optional Language Intelligence Adapter
          -> Japanese reference: Deterministic Japanese Parser MCP
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

The **Original Input remains the semantic authority**. `MeaningEvidenceGraph` is evidence extracted from the original and must never silently replace or override it. Unknown or ambiguous meaning is preserved as unresolved rather than guessed.

The executable `/internal/v1/translate` path now uses typed source evidence, a pre-generation Evidence Integrity Gate, bounded fresh-context REANALYZE, and typed failure routing. Risk routing, Language Intelligence Adapters, same-language canonicalization, and persistent Attempt/Checkpoint/Failure Memory remain later source units. See [`docs/DESIGN.md`](docs/DESIGN.md) and [`docs/DESIGN_DELTA.md`](docs/DESIGN_DELTA.md).

asteria does not know Astera App's eight result keys.

## Internal API

All routes require `Authorization: Bearer <ASTERIA_INTERNAL_TOKEN>`.

- `GET /internal/v1/health`
- `GET /internal/v1/capabilities`
- `POST /internal/v1/translate`

Translate request uses `request_id`, `profile_version`, BCP47 `target_language`, optional `source_language`, reserved `glossary_id`, and ordered `{id,text}` segments. Translation usage reports total model `calls` and separate `evidence_validations`, `semantic_validations`, `semantic_retries`, and `source_reanalyses` counters so added integrity work is observable.

Same-language transformation endpoints/modes are part of the adopted product architecture but are **not yet implemented** and must not be inferred from the current API.

## TGserver ZERO runtime logging

Project identity is `P007` / stream `default`. The producer sends only bounded lifecycle metadata through canonical `POST /ingest/bulk` and never sends translation text, request bodies, bearer tokens, AI Core keys, arbitrary exception messages, or model/provider response bodies. TGserver unavailability is fail-open and does not change translation API semantics.

```text
TGSERVER_LOG_URL=http://127.0.0.1:3000
TGSERVER_LOG_TIMEOUT_MS=1500
```

The central Reader path for `seigo-gace/asteria` / P007 is already proven from CHAT through TGserver ZERO. Runtime events from the current translation branch still require exact-head deployment/readback before being marked current-runtime PASS.

## Development

Node `>=22.12 <23`.

```bash
npm install --no-fund --no-audit
npm run verify
python3 -m py_compile scripts/raw-model-benchmark.py scripts/service-benchmark.py
```

## Runtime boundary

No main merge, new model download, external provider change, production public cutover, or unrelated secret/provider mutation is part of the current Translation Integrity phase.

The existing server project is `/home/admin1/projects/asteria`; runtime/source synchronization and live verification are separate evidence gates from repository CI.

## Documentation

- [`docs/DESIGN.md`](docs/DESIGN.md) — current architecture plus preserved migration baseline
- [`docs/DESIGN_DELTA.md`](docs/DESIGN_DELTA.md) — adopted Language Integrity Architecture v3 decision and rationale
- [`docs/LANGUAGE_CAPABILITY.md`](docs/LANGUAGE_CAPABILITY.md) — evidence boundary for language support
- [`docs/VERIFICATION.md`](docs/VERIFICATION.md) — source/runtime/integrity acceptance gates
- [`docs/MIGRATION_FROM_ASTERA_APP.md`](docs/MIGRATION_FROM_ASTERA_APP.md) — migration ownership boundary
- [`docs/PROJECT_TREE.md`](docs/PROJECT_TREE.md) — navigation index
- [`docs/TGSERVER_ZERO_DEVELOPMENT_EVIDENCE.md`](docs/TGSERVER_ZERO_DEVELOPMENT_EVIDENCE.md) — runtime logging evidence
