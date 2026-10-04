# TGserver ZERO Development Evidence — AsteriaAI

## Source/Test/Build/Verify
CHAT reads AsteriaAI GitHub Actions Job Log and Development Probe Artifact. The probe may run only repository-owned fixed `npm run verify`; Issue text never becomes shell input.

## Runtime/Server Log
Runtime evidence must use the central Reader in `seigo-gace/TGserver`; AsteriaAI never stores Cloudflare Access Reader secrets and never calls TGserver search directly.

TGserver ZERO source registration: `P007`, stream `default`, PR #17. Until that PR is merged and Telegram topics/producer/real-log E2E are complete, state is `SOURCE_REGISTERED_BUT_NOT_ACTIVE` and `TGZERO_SEARCH=NOT_VERIFIED`.

TGserver vNext is not used.
