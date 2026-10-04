# TGserver ZERO Development Evidence — AsteriaAI

## Source/Test/Build/Verify
CHAT reads AsteriaAI GitHub Actions Job Log and Development Probe Artifact. The probe may run only repository-owned fixed `npm run verify`; Issue text never becomes shell input.

## Runtime/Server Log
Runtime evidence is produced by the AsteriaAI P007 sink and retrieved only through the central Reader in `seigo-gace/TGserver`. AsteriaAI never stores Cloudflare Access Reader secrets and never calls TGserver `/search` directly.

Current TGserver ZERO integration line:

- TGserver Draft PR #19 current observed head: `610de9627bd065ff51ad1faf6f09cccb8e0498d1`
- repository: `seigo-gace/asteria`
- stream: `default`
- project_id: `P007`
- P007 severity topics: live-provisioned 5/5 in the verified 65/65 topic result
- TGserver PR #19: OPEN / DRAFT / UNMERGED

Project-side producer Source:

- `src/tgserver-log.ts`
- `src/main.ts`
- `src/http.ts`
- fixed ZERO `POST /ingest/bulk` + `logs[]`
- bounded fail-open queue
- no per-producer TGserver log secret/header
- only fixed lifecycle/translation metadata; translation content and arbitrary exception text are excluded

Current exact Project state:

```text
P007_PRODUCER_SOURCE=PASS
P007_CI=PASS
P007_TOPICS=PASS
P007_RUNTIME_SEND=NOT_VERIFIED
P007_TELEGRAM_RAW=NOT_VERIFIED
P007_INDEX_SEARCH=NOT_EXECUTED
P007_CENTRAL_READER=NOT_EXECUTED
```

AsteriaAI CI #4 / run `37203248542` is SUCCESS on producer head `d933a95f0dbff97665dc9e95e3df31d566e178d4`.

TGserver vNext is not used.
