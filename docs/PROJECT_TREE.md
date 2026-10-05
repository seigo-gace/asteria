# Project Tree

```text
.github/workflows/ci.yml             source CI only
src/ai-core.ts                       AI Core transport/model identity
src/quality.ts                       deterministic protection/structure gates
src/semantic.ts                      Qwen semantic record + typed MeaningEvidenceGraph + Granite verdict
src/semantic-evidence.test.ts        typed source-evidence graph contract tests
src/integrity-control.ts             Architecture v3 typed integrity contracts / ErrorDelta routing
src/integrity-control.test.ts        deterministic integrity-control contract tests
src/engine-integrity.test.ts         engine wiring tests for typed retry/reanalysis routing
src/language.ts                      BCP47 canonicalization/matching
src/engine.ts                        generic segment orchestration + evidence attachment + bounded integrity route execution
src/http.ts                          authenticated internal API
src/main.ts                          runtime entry
src/*.test.ts                        canonical contract tests
scripts/raw-model-benchmark.py       diagnostic raw Qwen benchmark
scripts/service-benchmark.py         full asteria service benchmark
benchmarks/                          non-authoritative seed corpus
docs/                                design/verification/migration/runtime boundaries
```

Architecture v3 source currently materializes the existing semantic record as a typed `MeaningEvidenceGraph`, attaches source evidence to `TransformationRun`, and consumes typed `ErrorDelta` / correction-route decisions for semantic failures. This adds no additional semantic-record AI call. Risk routing, executable REANALYZE, Language Intelligence Adapters, and persistent Attempt/Checkpoint/Failure Memory remain separate verified change units.
