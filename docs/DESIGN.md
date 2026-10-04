# AsteriaAI Design

## Responsibility
AsteriaAI translates generic ordered text segments and verifies that translation did not materially change meaning or requested target language. It does not own consumer UI, billing, history, or application-specific result schemas.

## Model roles
- Qwen3: only translator and independent semantic recorder.
- Granite 4.2 8B: semantic-equivalence / target-language verdict only; never translation fallback.
- AI Core Router: only model access path.

## Quality path
1. Validate request/profile/BCP47 and fail closed on unsupported glossary.
2. Protect URLs, code, email, placeholders, UUIDs, versions, dates, money, percentages, and numbers.
3. Batch non-empty ordered segments with immutable markers.
4. Translate with Qwen3 at temperature 0 and thinking disabled.
5. Validate exact marker/token restoration and structural shape.
6. If deterministic validation fails, retry once from ORIGINAL using line-preserving mode.
7. Qwen3 records ORIGINAL meaning and detected source language.
8. Optional requested source language must match detected source language by language family/tag alias.
9. Qwen3 independently records candidate meaning.
10. Granite compares records and requested target language; pass requires equivalent=true, score>=0.98, target-language match, no critical differences.
11. One semantic retry from ORIGINAL is allowed; second failure is fail-closed.

## Security
All supplied text is untrusted data. AsteriaAI never uses source text as executable instruction. Service and AI Core bind/access loopback only. Internal API uses bearer authentication. Secrets are environment-only.
