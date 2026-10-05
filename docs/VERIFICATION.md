# Verification

Canonical source verification is `npm run verify`, which runs strict TypeScript check then the Node contract suite.

CI also syntax-checks both benchmark scripts. Source/CI success proves only repository source behavior. It does not prove Contabo runtime, real AI Core integration, universal language quality, latency under load, Astera App cutover, or Production readiness.

## Safety/correctness completion gate

Before any native-fluency, locale, or style work, the current phase must prove that translation preserves meaning and protected values and fails closed when correctness cannot be established.

Repository/CI gates cover request validation, protected-token/structure validation, source-language mismatch before translation generation, semantic-record validation, semantic retry from ORIGINAL input, target-language rejection, model identity, loopback-only AI Core, and second-failure fail-closed behavior.

Live service acceptance uses `scripts/service-benchmark.py benchmarks/regression-corpus.seed.jsonl` against the real AsteriaAI service backed by Qwen3 + Granite. The current 13-case seed covers multilingual/adversarial meaning risks including negation, prohibitions, conditions, exceptions, quantities, deadlines, ordering, permissions, low-resource Swahili, RTL/CJK scripts, and embedded prompt-injection text.

The service benchmark is a fail-closed execution gate: any HTTP/contract failure, empty translation, required protected-literal loss, or non-zero `external_api_calls` produces `gate=FAIL` and process exit 1. A benchmark PASS still does not promote the corpus to human-reviewed language-pair authority; every seed row remains `SEED_NOT_ACCEPTANCE_AUTHORITY` until separately reviewed.

Runtime acceptance requires separate live evidence for exact source/runtime revision alignment, Qwen3 + Granite execution, the multilingual/adversarial service benchmark, failure-path behavior, latency measurements, and later human-reviewed corpus/consumer E2E as their phases are reached. Deployment and Production readiness remain separate approval states.
