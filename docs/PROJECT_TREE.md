# Project Tree

```text
.github/workflows/ci.yml       source CI only
src/ai-core.ts                 AI Core transport/model identity
src/quality.ts                 deterministic protection/structure gates
src/semantic.ts                Qwen semantic record + Granite verdict
src/language.ts                BCP47 canonicalization/matching
src/engine.ts                  generic segment orchestration
src/http.ts                    authenticated internal API
src/main.ts                    runtime entry
src/*.test.ts                  canonical contract tests
scripts/raw-model-benchmark.py diagnostic raw Qwen benchmark
scripts/service-benchmark.py   full AsteriaAI service benchmark
benchmarks/                    non-authoritative seed corpus
docs/                          design/verification/migration/runtime boundaries
```
