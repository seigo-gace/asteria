# Project Tree

```text
.github/workflows/ci.yml             source CI only
src/ai-core.ts                       AI Core transport/model identity
src/quality.ts                       protected literals / deterministic structure / generation strategies
src/risk-router.ts                   deterministic low-cost RiskProfile classification + bounded risk guidance
src/risk-router.test.ts              Risk Router class/signal/threshold-invariant tests
src/semantic.ts                      Qwen semantic record + fresh-context reanalysis + Granite translation verdict
src/semantic-evidence.test.ts        typed source-evidence graph contract tests
src/semantic-reanalysis.test.ts      fresh-context source reanalysis contract test
src/evidence-integrity.ts            Granite ORIGINAL-vs-EvidenceGraph pre-generation integrity gate
src/evidence-integrity.test.ts       direct Evidence Integrity Gate contract tests
src/integrity-control.ts             Architecture v3 typed contracts / RiskProfile attachment / bounded retry+reanalysis
src/integrity-control.test.ts        deterministic integrity-control contract tests
src/engine-risk.test.ts              selective risk-focused vs ordinary generation routing tests
src/engine-integrity.test.ts         engine wiring tests for evidence gate + reanalysis + typed retry routing
src/language.ts                      BCP47 canonicalization/matching
src/engine.ts                        generic orchestration + Risk routing + evidence validation + bounded recovery
src/http.ts                          authenticated internal API
src/main.ts                          runtime entry
src/*.test.ts                        canonical contract tests
scripts/raw-model-benchmark.py       diagnostic raw Qwen benchmark
scripts/service-benchmark.py         full asteria service benchmark
benchmarks/                          non-authoritative seed corpus
docs/                                design/verification/migration/runtime boundaries
```

Architecture v3 source now deterministically classifies active input into `simple / complex / high-risk / ambiguous` before generation. `high-risk` and `ambiguous` select bounded `risk_focused` generation while `simple` and `complex` retain the existing document path; mandatory evidence/deterministic/semantic gates remain common to every route and normal success call count does not increase. The source also independently checks `MeaningEvidenceGraph` against ORIGINAL and can execute one fresh-context source REANALYZE when unresolved/guessed meaning is detected.

Targeted meaning-preserving projection/normalization, Language Intelligence Adapters, persistent Attempt/Checkpoint/Failure Memory, and later same-language/native modes remain separate verified change units.
