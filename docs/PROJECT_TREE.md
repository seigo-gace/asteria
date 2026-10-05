# Project Tree

```text
.github/workflows/ci.yml             source CI only
src/ai-core.ts                       AI Core transport/model identity
src/quality.ts                       protected literals / deterministic structure / generation strategies / bounded control guidance
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
src/translation-memory.ts            exact-binding/evidence persistent failure-memory store and safe reuse policy
src/translation-memory.test.ts       reuse/no-reuse/reopen/raw-data/malformed-memory tests
src/engine-risk.test.ts              risk-focused routing + selected normalization/fallback tests
src/engine-integrity.test.ts         safety ordering / evidence gate / reanalysis / typed retry wiring tests
src/language.ts                      BCP47 canonicalization/matching
src/engine.ts                        generic orchestration + Risk routing + normalization + evidence validation + failure memory + recovery
src/http.ts                          authenticated internal API + memory injection
src/config.ts                        loopback/runtime settings + persistent memory path
src/main.ts                          runtime entry + TGserver + translation-memory construction
src/*.test.ts                        canonical contract tests
Dockerfile                           Node runtime + non-root writable /app/data
compose.yml                          host-network service + named translation-memory volume
.env.example                         runtime config including ASTERIA_MEMORY_FILE
scripts/raw-model-benchmark.py       diagnostic raw Qwen benchmark
scripts/service-benchmark.py         full asteria service benchmark
benchmarks/                          non-authoritative seed corpus
docs/                                design/verification/migration/runtime boundaries
```

Architecture v3 preserves the established fail-fast order: ORIGINAL meaning acquisition -> source-language validation -> ORIGINAL Evidence Integrity. Only after those gates may selected meaning-structure risks use same-language normalization. The normalized candidate must pass direct Granite equivalence; rebuilt normalized Meaning Evidence must then pass ORIGINAL Evidence Integrity again before adoption. Any non-pass falls back to already-validated ORIGINAL evidence. Translation generation still uses ORIGINAL section bodies.

Persistent Translation Failure Memory is now a separate control layer after accepted source evidence is established. It hashes the exact input/model/language binding and the accepted evidence graph, reuses only fixed failure classes for the same binding+evidence, treats changed evidence as reopened history, and never caches/replays translation prose. Malformed records are ignored. Memory I/O failure does not weaken mandatory Translation Integrity gates.

Risk classification itself remains deterministic and zero-model-call. Quantity/protected-value-only risk can use `risk_focused` generation without normalization overhead. Meaning-structure normalization, when selected, has separately observable attempt/accept/reject/validation counters. Failure memory has separate hit/reopened/write/error counters.

The Docker/Compose source defines `/app/data/translation-memory.jsonl` on a named `asteria_translation_memory` volume, but actual persistence across restart/recreate is not yet Runtime evidence.

Language Intelligence Adapters, real multilingual A/B acceptance, runtime persistence verification, and later same-language/native modes remain separate verified change units.
