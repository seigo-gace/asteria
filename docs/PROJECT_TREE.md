# Project Tree

```text
.github/workflows/ci.yml             source CI only
src/ai-core.ts                       AI Core transport/model identity
src/quality.ts                       protected literals / deterministic structure / generation strategies / bounded untrusted control guidance
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
src/japanese-language-intelligence.ts      loopback DJPMCP /v1/analyze adapter + bounded structural evidence projection
src/japanese-language-intelligence.test.ts DJPMCP transport/schema/original-binding/unresolved-safety tests
src/engine-japanese-adapter.test.ts        Japanese selected-adapter / non-Japanese bypass / unavailable fallback A/B wiring tests
src/translation-memory.ts            exact-binding/evidence persistent failure-memory store and safe reuse policy
src/translation-memory.test.ts       reuse/no-reuse/reopen/raw-data/malformed-memory tests
src/engine-risk.test.ts              risk-focused routing + selected normalization/fallback tests
src/engine-integrity.test.ts         safety ordering / evidence gate / reanalysis / typed retry wiring tests
src/language.ts                      BCP47 canonicalization/matching
src/engine.ts                        orchestration + Risk + DJPMCP guidance + normalization + evidence + memory + recovery
src/http.ts                          authenticated internal API + memory/optional Japanese adapter injection
src/config.ts                        loopback/runtime settings + memory path + optional DJPMCP config
src/main.ts                          runtime entry + TGserver + memory + optional DJPMCP construction
src/*.test.ts                        canonical contract tests
Dockerfile                           Node runtime + non-root writable /app/data
compose.yml                          host-network service + named translation-memory volume
.env.example                         runtime config incl. memory + optional DJPMCP settings
scripts/raw-model-benchmark.py       diagnostic raw Qwen benchmark
scripts/service-benchmark.py         full service benchmark + Japanese A/B schema/run-label/report contract
src/service-benchmark-contract.test.ts Python benchmark contract validation + OFF/ON input-binding identity tests
benchmarks/regression-corpus.seed.jsonl existing 13-case multilingual non-authoritative seed
benchmarks/japanese-ab-corpus.schema.json Japanese A/B v1 machine-readable non-authoritative schema
benchmarks/japanese-ab-corpus.v1.jsonl 10-case Japanese adversarial DJPMCP OFF/ON seed
docs/                                design/verification/migration/runtime boundaries
```

Architecture v3 preserves the fail-fast order: ORIGINAL meaning acquisition -> source-language validation -> ORIGINAL Evidence Integrity. Only after those gates may a configured Japanese adapter contribute bounded structural guidance, and only for focused Japanese source. Adapter output remains untrusted derived evidence, never ORIGINAL authority or a replacement for Asteria Meaning Evidence. Non-Japanese input bypasses DJPMCP; invalid/unavailable adapter output leaves the common Qwen/Granite integrity path unchanged.

Selected meaning-structure risks may then use same-language normalization. The normalized candidate must pass direct Granite equivalence; rebuilt normalized Meaning Evidence must then pass ORIGINAL Evidence Integrity again before adoption. Any non-pass falls back to already-validated ORIGINAL evidence. Translation generation always uses ORIGINAL section bodies.

Persistent Translation Failure Memory is a separate control layer after accepted source evidence is established. It hashes the exact input/model/language binding and accepted evidence, reuses only fixed failure classes for the same binding+evidence, treats changed evidence as reopened history, and never caches/replays translation prose. Malformed records are ignored. Memory I/O failure does not weaken mandatory Translation Integrity gates.

Risk classification remains deterministic and zero-model-call. DJPMCP, when configured and selected, adds one local parser HTTP call. Meaning-structure normalization and persistent memory have separately observable counters. Real DJPMCP quality benefit, real multilingual acceptance and runtime persistence remain separate Runtime evidence gates.
