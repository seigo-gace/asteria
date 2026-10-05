# asteria

`asteria` is the semantic-preserving Language Transformation project for the G-ACE workspace. The runtime service name remains `asteria-ai`.

## Purpose

asteria exists to accurately read text in any language and transform it into the best expression in the same or another language **without changing material meaning**, with explicit verification before output is accepted.

The completed product is intended to use one shared Meaning Integrity Core for cross-language translation, same-language canonical rewrite, and later controlled style/native-expression transformation. The current implementation priority remains **cross-language translation correctness first**; same-language rewrite and style/native optimization must not delay the Translation Integrity Core.

asteria owns language-transformation AI execution, deterministic preservation, semantic evidence/verification, bounded failure memory, benchmarking, runtime boundaries, and its TGserver ZERO P007 runtime producer. Product applications keep their own UI/domain mapping and send generic ordered segments.

Migration source authority: Astera App Draft PR #72, source snapshot `169be9309695396b27f05e4f91fea4823ea5e8fc`.

## Current source contract

Current implemented behavior is the translation baseline with executable Language Integrity Architecture v3 control slices:

- Qwen3 is the sole translator/generator and semantic recorder; it also performs bounded fresh-context source reanalysis and selected same-language source normalization.
- Granite independently checks source evidence against ORIGINAL, judges selected normalization against ORIGINAL, and judges translation semantic equivalence/requested target language. Granite is never a translation fallback.
- AI Core Router is the only model path; loopback HTTP only; external translation API fallback = 0.
- protected tokens, section order, Markdown shape, line shape and information volume are deterministic gates.
- embedded instructions are treated as untrusted data.
- `target_language` is required BCP47; optional `source_language` fails closed on detected mismatch before optional normalization or translation generation.
- invalid semantic-recorder `detected_language` values fail closed; non-empty `glossary_id` is reserved and fails closed as not implemented.
- language capability remains `NOT_VERIFIED` until measured; Source/CI PASS is not universal-language correctness.
- ORIGINAL remains semantic authority. Every accepted `MeaningEvidenceGraph` must be grounded against raw ORIGINAL.
- semantic failures become typed critical `ErrorDelta` values and route through bounded `PASS / LOCAL_FIX / FRESH_REGENERATE / REANALYZE / FAIL_CLOSED` control.
- unresolved/guessed ambiguity may trigger one bounded `REANALYZE` from ORIGINAL + verifier ErrorDelta only; the prior candidate is excluded and rebuilt evidence must pass Evidence Integrity again.
- a second semantic failure routes to `FAIL_CLOSED`.

### Deterministic Risk Router

- active input is classified as `simple / complex / high-risk / ambiguous` from deterministic surface/context signals.
- signals include script mix, segment/context shape, negation, conditions/exceptions, modality, protected quantities/values, reference context and explicit ambiguity.
- no arbitrary text-length threshold is used; code-point length remains trace only until Benchmark Evidence supports a threshold.
- `high-risk` and `ambiguous` use `risk_focused` first-generation instructions; `simple` and `complex` retain the existing `document` path.
- Risk routing itself adds no AI call and never bypasses mandatory integrity gates.

### Selected meaning-preserving source normalization

Optional normalization is **not** an all-request preprocessing step.

1. ORIGINAL is read first through the existing semantic recorder.
2. requested `source_language` mismatch fails before optional normalization.
3. ORIGINAL-derived Meaning Evidence must pass the existing Granite Evidence Integrity Gate first.
4. normalization is attempted only when the RiskProfile includes meaning-structure signals where explicitness may help: negation, condition, exception, modality, reference context, or explicit ambiguity.
5. quantity/protected-value-only risk remains `risk_focused` but does not pay normalization overhead.
6. Qwen produces a same-language normalization candidate that may only make already-present meaning easier to analyze; it may not translate, summarize, add/delete facts, resolve unsupported ambiguity, or change polarity/modality/conditions/quantities/etc.
7. Granite directly checks ORIGINAL vs normalized candidate. A failed candidate is discarded and the already-validated ORIGINAL evidence remains active.
8. after direct normalization equivalence PASS, Qwen rebuilds Meaning Evidence from the normalized candidate and Granite checks that evidence against ORIGINAL again.
9. only when detected language remains consistent and this second Evidence Integrity check passes is normalized evidence adopted.
10. translation generation always uses the ORIGINAL section bodies; normalization never replaces the translation authority.

Source usage exposes `normalization_attempts`, `normalization_accepts`, `normalization_rejects`, and `normalization_validations`. A simple or quantity-only successful path keeps the prior call count. A normalization candidate rejected at the direct equivalence gate adds two local model calls; a fully accepted normalization path adds four local calls because normalized evidence is independently rebuilt and revalidated. Runtime A/B must justify that extra cost before benefit is claimed.

### Persistent Translation Failure Memory

`asteria` now has a translation-specific persistent failure-memory source contract derived from proven debugAI continuation/history rules.

- memory identity is bound to a SHA-256 digest of profile version, source/target language binding, model identities and ORIGINAL input;
- accepted source Meaning Evidence is separately hashed and used to decide whether a prior failure is still applicable;
- only fixed `ErrorDelta` classes and bounded route/attempt metadata can be reused as guidance;
- prior candidate translation prose, raw ORIGINAL text, prompts, conversations, private reasoning and secrets are not persisted in memory records;
- a changed input binding does not reuse another source's history;
- changed accepted evidence marks prior failures as reopened rather than blindly applying stale guidance;
- prior PASS translation text is never returned as a cache hit; every request is regenerated from ORIGINAL and reverified;
- malformed/untrusted JSONL records are ignored and cannot inject arbitrary guidance;
- memory read/write failure increments observability counters but does not bypass or weaken the existing fail-closed Translation Integrity gates.

Source usage exposes `memory_hits`, `memory_reopened`, `memory_writes`, and `memory_errors`. The default source path is `/app/data/translation-memory.jsonl`; Docker creates a writable `/app/data` directory and Compose defines a named volume. **Source/CI proves only the contract and wiring. Actual persistence across restart/recreate remains Runtime-unverified until the approved runtime gate is executed.**

## Current completion phase

The current phase is intentionally limited to **Translation Integrity Core**: meaning preservation, safety, correctness and reproducible evidence before same-language canonical rewrite or native/style optimization.

Source-side completion gates now include deterministic protected-value/structure validation, semantic equivalence/requested-language verification, ORIGINAL-anchored retry, fail-closed language/evidence handling, deterministic Risk Router classification, selective meaning-preserving normalization with direct equivalence and second ORIGINAL evidence validation, bounded fresh-context reanalysis, bounded persistent failure-memory reuse, and second-failure fail closed.

The 13-case multilingual/adversarial regression seed covers negation, prohibitions, conditions, exceptions, quantities, deadlines, ordering, permissions, mixed scripts, low-resource Swahili, and embedded prompt-injection text. The seed remains `SEED_NOT_ACCEPTANCE_AUTHORITY` until separately reviewed and exercised live.

These are repository/CI capabilities only. Risk routing, normalization, Evidence Integrity, REANALYZE and persistent failure memory require real Qwen3 + Granite multilingual A/B and human evidence before translation-quality benefit or universal correctness can be claimed.

## Architecture

```text
Original Input / Context (Authority)
  -> Surface Integrity Scan
  -> Transformation Intent Contract
  -> Deterministic Risk Router
  -> ORIGINAL Meaning Acquisition
  -> Source-language Gate
  -> ORIGINAL Meaning Evidence Graph
  -> ORIGINAL Evidence Integrity Gate
  -> selected high-meaning-risk path only:
       -> same-language Normalization Candidate
       -> ORIGINAL-vs-Normalized Equivalence Gate
       -> Normalized Meaning Evidence
       -> ORIGINAL-vs-Normalized-Evidence Gate
       -> reject to ORIGINAL evidence on any non-pass
  -> exact Binding + Evidence failure-memory lookup
       -> same binding + same evidence: bounded rejected-error guidance only
       -> changed binding/evidence: no blind reuse
  -> Qwen3 Controlled Generation from ORIGINAL
  -> deterministic + Granite independent verification
  -> Error Delta Router
       -> PASS / LOCAL_FIX / FRESH_REGENERATE / REANALYZE / FAIL_CLOSED
  -> bounded failure/accepted checkpoint write
  -> Final Integrity Gate
  -> accepted output
```

The **Original Input remains semantic authority**. Meaning Evidence, normalization and memory are derived evidence/control aids and never silently replace ORIGINAL. Unknown or ambiguous meaning remains unresolved rather than guessed.

Deterministic Japanese Parser MCP remains the first Language Intelligence Adapter reference implementation and is not yet integrated. Same-language canonicalization and native/style modes remain later verified units.

asteria does not know Astera App's eight result keys.

## Internal API

All routes require `Authorization: Bearer <ASTERIA_INTERNAL_TOKEN>`.

- `GET /internal/v1/health`
- `GET /internal/v1/capabilities`
- `POST /internal/v1/translate`

Translate request uses `request_id`, `profile_version`, BCP47 `target_language`, optional `source_language`, reserved `glossary_id`, and ordered `{id,text}` segments.

## TGserver ZERO runtime logging

Project identity is `P007` / stream `default`. The producer sends only bounded lifecycle metadata through canonical `POST /ingest/bulk` and never sends translation text, request bodies, bearer tokens, AI Core keys, arbitrary exception messages, or provider response bodies. TGserver unavailability is fail-open and does not change translation API semantics.

```text
TGSERVER_LOG_URL=http://127.0.0.1:3000
TGSERVER_LOG_TIMEOUT_MS=1500
```

The central Reader path for `seigo-gace/asteria` / P007 is already proven from CHAT through TGserver ZERO. Current-branch runtime events still require exact-head runtime readback before current-runtime PASS.

## Development

Node `>=22.12 <23`.

```bash
npm install --no-fund --no-audit
npm run verify
python3 -m py_compile scripts/raw-model-benchmark.py scripts/service-benchmark.py
```

## Runtime boundary

No main merge, new model download, external provider change, production public cutover, or unrelated secret/provider mutation is part of the current Translation Integrity source unit. Existing server project is `/home/admin1/projects/asteria`; runtime/source synchronization, named-volume activation and live persistence verification are separate evidence gates.

## Documentation

- [`docs/DESIGN.md`](docs/DESIGN.md) — current architecture plus preserved migration baseline
- [`docs/DESIGN_DELTA.md`](docs/DESIGN_DELTA.md) — adopted Language Integrity Architecture v3 decision and rationale
- [`docs/LANGUAGE_CAPABILITY.md`](docs/LANGUAGE_CAPABILITY.md) — evidence boundary for language support
- [`docs/VERIFICATION.md`](docs/VERIFICATION.md) — source/runtime/integrity acceptance gates
- [`docs/MIGRATION_FROM_ASTERA_APP.md`](docs/MIGRATION_FROM_ASTERA_APP.md) — migration ownership boundary
- [`docs/PROJECT_TREE.md`](docs/PROJECT_TREE.md) — navigation index
- [`docs/TGSERVER_ZERO_DEVELOPMENT_EVIDENCE.md`](docs/TGSERVER_ZERO_DEVELOPMENT_EVIDENCE.md) — runtime logging evidence
