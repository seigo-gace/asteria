# Project Tree

```text
.github/workflows/ci.yml             source CI only
src/ai-core.ts                       AI Core transport/model identity
src/quality.ts                       deterministic protection/structure gates
src/semantic.ts                      Qwen semantic record + fresh-context reanalysis + Granite translation verdict
src/semantic-evidence.test.ts        typed source-evidence graph contract tests
src/semantic-reanalysis.test.ts      fresh-context source reanalysis contract test
src/evidence-integrity.ts            Granite ORIGINAL-vs-EvidenceGraph pre-generation integrity gate
src/evidence-integrity.test.ts       direct Evidence Integrity Gate contract tests
src/integrity-control.ts             Architecture v3 typed integrity contracts / bounded retry+reanalysis / ErrorDelta routing
src/integrity-control.test.ts        deterministic integrity-control contract tests
src/engine-integrity.test.ts         engine wiring tests for evidence gate + reanalysis + typed retry routing
src/language.ts                      BCP47 canonicalization/matching
src/engine.ts                        generic segment orchestration + evidence validation + bounded reanalysis/regeneration
src/http.ts                          authenticated internal API
src/main.ts                          runtime entry
src/*.test.ts                        canonical contract tests
scripts/raw-model-benchmark.py       diagnostic raw Qwen benchmark
scripts/service-benchmark.py         full asteria service benchmark
benchmarks/                          non-authoritative seed corpus
docs/                                design/verification/migration/runtime boundaries
```

Architecture v3 source currently materializes the source `MeaningEvidenceGraph`, independently checks it against ORIGINAL before generation, consumes typed `ErrorDelta` routes, and can execute one fresh-context source REANALYZE when unresolved/guessed meaning is detected. REANALYZE uses ORIGINAL + verifier concern only, must pass Evidence Integrity again, and then permits only one ORIGINAL-anchored regeneration. Risk routing, Language Intelligence Adapters, persistent Attempt/Checkpoint/Failure Memory, and later same-language/native modes remain separate verified change units.
