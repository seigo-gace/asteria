# Project Tree

```text
.github/workflows/ci.yml       source CI only
src/ai-core.ts                 AI Core transport/model identity
src/quality.ts                 deterministic protection/structure gates
src/semantic.ts                Qwen semantic record + Granite verdict
src/language.ts                BCP47 canonicalization/matching
src/engine.ts                  current generic translation orchestration
src/http.ts                    authenticated internal API
src/main.ts                    runtime entry
src/*.test.ts                  canonical contract tests
scripts/raw-model-benchmark.py diagnostic raw Qwen benchmark
scripts/service-benchmark.py   current full asteria translation benchmark
benchmarks/                    non-authoritative regression seed corpus
docs/DESIGN.md                 current Language Integrity architecture + preserved migration baseline
docs/DESIGN_DELTA.md           2026-10-05 adopted purpose/architecture delta
docs/LANGUAGE_CAPABILITY.md    language/direction/risk-class evidence boundary
docs/VERIFICATION.md           source/runtime/integrity acceptance gates
docs/MIGRATION_FROM_ASTERA_APP.md migration ownership and post-migration evolution
docs/TGSERVER_ZERO_DEVELOPMENT_EVIDENCE.md runtime logging evidence
```

## Planned v3 source responsibilities

Architecture v3 is adopted in design but not yet fully implemented. The planned source responsibilities are expected to cover:

- surface integrity scan;
- transformation intent contract;
- risk routing;
- Meaning Evidence Graph construction;
- evidence integrity gate;
- transformation planning;
- bounded correction/ErrorDelta routing;
- run/attempt/checkpoint evidence memory;
- optional Language Intelligence Adapter boundary, beginning with Deterministic Japanese Parser MCP for Japanese high-risk cases.

Paths for these planned responsibilities are intentionally **not** invented here before source implementation establishes their actual files/modules.
