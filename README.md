# AsteriaAI

AsteriaAI is the independent translation AI system for the G-ACE workspace, named after Asteria, the Greek goddess associated with the stars.

## Purpose

AsteriaAI owns translation-specific AI execution, deterministic preservation, semantic verification, benchmarking, and runtime boundaries. Product applications keep their own UI/domain mapping and send generic ordered segments.

Migration source authority: Astera App Draft PR #72, source snapshot `169be9309695396b27f05e4f91fea4823ea5e8fc`.

## Current source contract

- Qwen3 is the sole translator.
- Qwen3 independently records original/candidate meaning.
- Granite judges semantic equivalence and requested target language.
- AI Core Router is the only model path; loopback HTTP only.
- external translation API fallback = 0.
- protected tokens, section order, Markdown shape, line shape and information volume are deterministic gates.
- semantic retry always restarts from ORIGINAL input.
- embedded instructions are treated as untrusted data.
- `target_language` is required BCP47; `source_language` is optional BCP47 and fails closed on detected mismatch.
- non-empty `glossary_id` is reserved but currently returns `TRANSLATION_GLOSSARY_NOT_IMPLEMENTED`.
- language capability is `NOT_VERIFIED` until measured; source/CI PASS is not universal-language correctness.

## Architecture

```text
Consumer
  -> /internal/v1/translate
  -> request/profile/BCP47 validation
  -> generic ordered {id,text} segments
  -> deterministic protected-token + structure fence
  -> AI Core Router 127.0.0.1:18080
       -> Qwen3 translation
       -> Qwen3 original semantic record
       -> Qwen3 candidate semantic record
       -> Granite independent verdict
  -> semantic/target-language gate
  -> translated segments or fail-closed error
```

AsteriaAI does not know Astera App's eight result keys.

## Internal API

All routes require `Authorization: Bearer <ASTERIA_INTERNAL_TOKEN>`.

- `GET /internal/v1/health`
- `GET /internal/v1/capabilities`
- `POST /internal/v1/translate`

Translate request uses `request_id`, `profile_version`, BCP47 `target_language`, optional `source_language`, reserved `glossary_id`, and ordered `{id,text}` segments.

## Development

Node `>=22.12 <23`.

```bash
npm install --no-fund --no-audit
npm run verify
python3 -m py_compile scripts/raw-model-benchmark.py scripts/service-benchmark.py
```

## Runtime boundary

No merge, deploy, new model download, external provider, production switch, Telegram topic provisioning, or secret mutation is part of the initial source migration.

TGserver ZERO source registration is being handled separately as `P007` / stream `default`; until its registration PR is merged and topics/producer/real-log E2E are complete, Runtime log search is not active.

See `docs/` for design, migration, verification, language capability, and TGserver ZERO usage.
