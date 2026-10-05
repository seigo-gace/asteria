# asteria Design

## Current Architecture — Language Integrity v3

### Project responsibility
asteria is a semantic-preserving Language Transformation Engine. Its purpose is to accurately read text in any language and transform it into the best expression in the same or another language while preserving material meaning and verifying that preservation before acceptance.

Current implementation priority remains cross-language translation correctness. Same-language canonical rewrite and later style/native-expression transformation are follow-on modes on the same Meaning Integrity Core. asteria does not own consumer UI, billing, history, or application-specific result schemas.

### Authority model
Two distinct layers are mandatory:

1. **Original Input / Context** — immutable semantic authority.
2. **Meaning Evidence Graph** — structured evidence extracted from ORIGINAL; it constrains generation/verification but never silently replaces ORIGINAL.

Unknown, ambiguous, conflicting or insufficiently supported meaning remains unresolved rather than guessed.

### Executable processing flow
1. Surface integrity scan protects numbers, dates, money, code, URLs, placeholders and other invariants.
2. Transformation intent contract fixes requested mode/language and preservation constraints.
3. Deterministic low-cost Risk Router classifies active input as `simple / complex / high-risk / ambiguous` using explicit surface signals.
   - Trace inputs include segment/context shape, script mix, negation, conditions/exceptions, modality, protected quantities/values, reference context, explicit ambiguity and code-point length.
   - No AI call is used for routing.
   - No numeric long-text threshold is invented without Benchmark Evidence; length is currently trace only.
   - `high-risk` / `ambiguous` select `risk_focused` first generation.
   - `simple` / `complex` preserve the existing controlled document generation path.
   - Mandatory Evidence Integrity, deterministic preservation and semantic verification are never bypassed by a lower risk class.
4. Meaning acquisition uses the common Qwen semantic record. Targeted projection/normalization and Language Intelligence Adapters remain later selective stages.
5. Build `MeaningEvidenceGraph` for detected language, claims, constraints, conditions, entities, quantities and uncertainties.
6. Evidence Integrity Gate independently rejects unsupported additions, contradictions and invented ambiguity resolution against raw ORIGINAL.
7. Qwen3 controlled generation follows the Risk Router-selected strategy.
8. Multi-axis verification applies deterministic invariants, candidate semantic record, Granite semantic comparison, requested language validation and unresolved-meaning handling.
9. `ErrorDelta` routing selects `PASS / LOCAL_FIX / FRESH_REGENERATE / REANALYZE / FAIL_CLOSED`.
10. `REANALYZE` uses only ORIGINAL + verifier ErrorDelta in fresh context, excludes the prior candidate, revalidates rebuilt evidence, and allows at most one ORIGINAL-anchored regeneration.
11. Final integrity gate precedes acceptance.

### Current data contracts
- `TransformationRun`
- `MeaningEvidenceGraph`
- `TransformationContract`
- `AttemptRecord`
- `ErrorDelta`
- `RiskProfile`

`TransformationRun` stores its deterministic RiskProfile alongside ORIGINAL, contract, source evidence and attempts. Router trace must not become semantic authority; risk labels and signals are attention/routing metadata only.

### Risk Router boundary
The Router is deliberately conservative and deterministic. Current source-complete effect is selective generation control without added model calls: meaning-sensitive inputs receive stronger preservation instructions while ordinary inputs retain the lighter existing path. The Router does **not** yet claim source normalization, parser selection, language-specific adapter routing, or proven quality benefit across languages. Those require separate source units and A/B evidence.

The architecture keeps meaning and surface-form/style evaluation separate. Style/naturalness may never weaken semantic-preservation gates. Same-language transformation must allow `no-op` when rewriting would add risk without meaningful benefit.

### Language Intelligence Adapter boundary
The common core is primary. Language-specific adapters are added only when repeatable evidence proves a language phenomenon is not handled adequately by the common path.

The first reference implementation is Deterministic Japanese Parser MCP. Its MeaningGraph may later map into `MeaningEvidenceGraph` for selected high-risk Japanese inputs/output verification. DJPMCP is not the universal core and is not a translation model.

### Evidence / memory control
Reuse from debugAI and related G-ACE control assets applies at the contract level:

- AI output is not evidence by itself;
- attempts, checkpoints, verifier results and failure reasons are separated;
- failure memory reuses evidence/failure patterns, not an old answer blindly;
- repeated identical failed attempts are not allowed;
- Source/CI/Runtime/Production evidence remain separate;
- Runtime PASS is not AI correctness and Test PASS is not universal language correctness.

### Current model roles
- Qwen3: sole current translator/generator, semantic recorder and bounded source reanalyst.
- Granite 4.2 8B: independent source-evidence integrity and semantic-equivalence/requested-language judge; never translation fallback.
- AI Core Router: only current model access path.

Model-role changes require separate evidence and are not implied by this design update.

### Security
All supplied text is untrusted data. asteria never uses source text as executable instruction. Service and AI Core bind/access loopback only. Internal API uses bearer authentication. Secrets are environment-only. Prompt injection embedded in source text remains data.

### Product modes
- `translate` — current implementation priority.
- `canonicalize` — adopted follow-on same-language integrity mode, not yet implemented.
- `clarify` — future bounded mode, not yet implemented.
- style/native-expression modes — future surface-only transformation modes; meaning gate remains unchanged.

See `DESIGN_DELTA.md` for the adoption decision, rationale and verification impact.

---

## Previous Migration Baseline — preserved

The following baseline is retained as the pre-v3 translation design and must remain traceable.

### Responsibility
AsteriaAI translates generic ordered text segments and verifies that translation did not materially change meaning or requested target language. It does not own consumer UI, billing, history, or application-specific result schemas.

### Model roles
- Qwen3: only translator and independent semantic recorder.
- Granite 4.2 8B: semantic-equivalence / target-language verdict only; never translation fallback.
- AI Core Router: only model access path.

### Quality path
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

### Security baseline
All supplied text is untrusted data. AsteriaAI never uses source text as executable instruction. Service and AI Core bind/access loopback only. Internal API uses bearer authentication. Secrets are environment-only.
