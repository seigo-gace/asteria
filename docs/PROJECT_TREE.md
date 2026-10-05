# Project Tree

```text
.github/workflows/ci.yml             source CI only
src/ai-core.ts                       AI Core transport/model identity
src/quality.ts                       deterministic protection/structure gates
src/semantic.ts                      Qwen semantic record + Granite verdict
src/integrity-control.ts             Architecture v3 typed integrity contracts / ErrorDelta routing
src/integrity-control.test.ts        deterministic integrity-control contract tests
src/language.ts                      BCP47 canonicalization/matching
src/engine.ts                        generic segment orchestration
src/http.ts                          authenticated internal API
src/main.ts                          runtime entry
src/*.test.ts                        canonical contract tests
scripts/raw-model-benchmark.py       diagnostic raw Qwen benchmark
scripts/service-benchmark.py         full asteria service benchmark
benchmarks/                          non-authoritative seed corpus
docs/                                design/verification/migration/runtime boundaries
```

`src/integrity-control.ts` is the first source slice of Language Integrity Architecture v3. It defines the typed control vocabulary without changing the public translation API by itself. Runtime wiring is a separate verified change unit.
