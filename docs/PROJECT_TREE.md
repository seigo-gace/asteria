# Project Tree

```text
.github/workflows/ci.yml             source CI only
src/ai-core.ts                       AI Core transport/model identity
src/quality.ts                       protected literals / deterministic structure / generation strategies
src/risk-router.ts                   deterministic low-cost RiskProfile classification + bounded risk guidance
src/risk-router.test.ts              Risk Router class/signal/threshold-invariant tests
src/normalization.ts                 selected same-language source normalization + Granite equivalence gate
src/semantic.ts                      Qwen semantic record + fresh-context reanalysis + Granite translation verdict
src/semantic-evidence.test.ts        typed source-evidence graph contract tests
src/semantic-reanalysis.test.ts      fresh-context source reanalysis contract test
src/evidence-integrity.ts            Granite ORIGINAL-vs-EvidenceGraph integrity gate
src/evidence-integrity.test.ts       direct Evidence Integrity Gate contract tests
src/integrity-control.ts             Architecture v3 typed contracts / RiskProfile attachment / bounded retry+reanalysis
src/integrity-control.test.ts        deterministic integrity-control contract tests
src/engine-risk.test.ts              risk-focused routing + selected normalization/fallback tests
src/engine-integrity.test.ts         safety ordering / evidence gate / reanalysis / typed retry wiring tests
src/language.ts                      BCP47 canonicalization/matching
src/engine.ts                        generic orchestration + Risk routing + selected normalization + evidence validation + recovery
src/http.ts                          authenticated internal API
src/main.ts                          runtime entry
src/*.test.ts                        canonical contract tests
scripts/raw-model-benchmark.py       diagnostic raw Qwen benchmark
scripts/service-benchmark.py         full asteria service benchmark
benchmarks/                          non-authoritative seed corpus
docs/                                design/verification/migration/runtime boundaries
```

Architecture v3 now preserves the established fail-fast order: ORIGINAL meaning acquisition -> source-language validation -> ORIGINAL Evidence Integrity. Only after those gates may selected meaning-structure risks use same-language normalization. The normalized candidate must pass direct Granite equivalence; rebuilt normalized Meaning Evidence must then pass ORIGINAL Evidence Integrity again before adoption. Any non-pass falls back to already-validated ORIGINAL evidence. Translation generation still uses ORIGINAL section bodies.

Risk classification itself remains deterministic and zero-model-call. Quantity/protected-value-only risk can use `risk_focused` generation without normalization overhead. Meaning-structure normalization, when selected, has separately observable attempt/accept/reject/validation counters.

Language Intelligence Adapters, persistent Attempt/Checkpoint/Failure Memory, real multilingual A/B acceptance, and later same-language/native modes remain separate verified change units.
