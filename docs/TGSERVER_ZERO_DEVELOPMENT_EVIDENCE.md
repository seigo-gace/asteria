# TGserver ZERO Development Evidence — asteria

## Source/Test/Build/Verify
CHAT reads GitHub Actions CI/Development Probe evidence for repository-owned verification. Issue text never becomes shell input.

## Runtime/Server Log
Runtime evidence uses the central Reader in `seigo-gace/TGserver`; asteria never stores Cloudflare Access Reader secrets and never calls TGserver `/search` directly.

Current project mapping:

```text
repository=seigo-gace/asteria
stream=default
project_id=P007
server_project=/home/admin1/projects/asteria
```

Current central Reader evidence already proven from CHAT:

```text
COMPLETE=true
SEARCH_COMPLETENESS=FULL_COMPLETE
INDEX_HEALTH=HEALTHY
PRODUCER_VERIFIED=true
PRODUCER_VERIFICATION_BASIS=INDEXED_NEW_SCHEMA_INGEST_EVIDENCE
TELEGRAM_RAW_CORRELATION=ALL_RETURNED_HITS_CORRELATED
```

The current translation-safety branch now contains the P007 producer implementation reused from Draft PR #2:

- `src/tgserver-log.ts`
- `src/tgserver-log.test.ts`
- `src/main.ts`
- `src/http.ts`
- fixed lifecycle events: `asteria_started`, `translate_succeeded`, `translate_failed`
- canonical `POST /ingest/bulk` + `logs[]`
- bounded fail-open queue
- accepted/duplicate receipts count as success
- no per-producer TGserver secret/header
- no translation text, request body, bearer token, AI Core key, arbitrary exception text, or model/provider response body in runtime log payloads

Evidence states remain separated:

```text
P007_REGISTERED=PASS
P007_CENTRAL_READER_PATH=PASS
P007_TELEGRAM_RAW_PATH=PASS
P007_CURRENT_BRANCH_PRODUCER_SOURCE=IMPLEMENTED
P007_CURRENT_BRANCH_CI=PENDING_UNTIL_EXACT_HEAD_SUCCESS
P007_CURRENT_SERVER_RUNTIME_SEND=NOT_VERIFIED_UNTIL_EXACT_HEAD_SYNC_AND_RESTART
P007_CURRENT_SERVER_TRANSLATION_EVENTS=NOT_VERIFIED
```

TGserver vNext is not used for this path.
