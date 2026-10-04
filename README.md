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

## TGserver ZERO runtime logging

AsteriaAI is assigned TGserver ZERO project `P007` / stream `default`. The live Telegram topic set for P007 is provisioned, while TGserver registry Source remains on the unmerged ZERO integration line until the owner-side change is approved and deployed.

The Project-side producer is implemented as a bounded fail-open queue:

- fixed `project_id=P007`;
- canonical `POST /ingest/bulk` + `logs[]` contract;
- events are limited to `asteria_started`, `translate_succeeded`, and `translate_failed`;
- payload contains only fixed event name, bounded internal error code, HTTP status, and event timestamp;
- translation text, request body, bearer token, AI Core key, arbitrary exception message, and model response body are not forwarded;
- no per-producer TGserver log secret/header is introduced;
- accepted and duplicate receipts are treated as success; rejected/malformed/mismatched receipts are requeued within the bounded queue;
- TGserver unavailability never blocks translation responses.

Runtime configuration:

```text
TGSERVER_LOG_URL=http://127.0.0.1:3000
TGSERVER_LOG_TIMEOUT_MS=1500
```

Source implementation and Topic existence do not prove runtime delivery. Real P007 acceptance, Telegram raw persistence, index visibility, and central Reader retrieval remain separate evidence gates until deployment is approved and executed.

## Development

Node `>=22.12 <23`.

```bash
npm install --no-fund --no-audit
npm run verify
python3 -m py_compile scripts/raw-model-benchmark.py scripts/service-benchmark.py
```

## Runtime boundary

No main merge, deploy, new model download, external provider, production switch, secret mutation, or provider mutation is performed by the current source work.

TGserver ZERO runtime state is intentionally split:

```text
P007_PROJECT_ID=SOURCE_ASSIGNED
P007_TOPIC_PROVISIONED=PASS
P007_PRODUCER_SOURCE=IMPLEMENTED_ON_PROJECT_BRANCH
P007_PRODUCER_RUNTIME=NOT_VERIFIED
P007_TELEGRAM_RAW=NOT_VERIFIED
P007_INDEX_SEARCH=NOT_EXECUTED
P007_CENTRAL_READER=NOT_EXECUTED
```

See `docs/` for design, migration, verification, language capability, and TGserver ZERO usage.
