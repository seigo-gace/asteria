# asteria Design

## Current Architecture — Language Integrity v3

### Project responsibility
asteria is a semantic-preserving Language Transformation Engine. Its project purpose is to accurately read text in any language and transform it into the best expression in the same or another language while preserving material meaning and verifying that preservation before acceptance.

The current implementation priority is still cross-language translation correctness. Same-language canonical rewrite and later style/native-expression transformation are follow-on modes on the same Meaning Integrity Core.

asteria does not own consumer UI, billing, history, or application-specific result schemas.

### Authority model
Two distinct layers are mandatory:

1. **Original Input / Context** — immutable semantic authority.
2. **Meaning Evidence Graph** — structured evidence extracted from the original; it may constrain generation and verification but never silently replaces the original.

Unknown, ambiguous, conflicting or insufficiently supported meaning remains unresolved rather than being guessed.

### Target processing flow
1. Surface integrity scan: language/script, numbers, dates, money, code, URLs, placeholders and other protected invariants.
2. Transformation intent contract: target language/mode and what may or may not change.
3. Risk router: simple, complex, high-risk or ambiguous path.
4. Meaning acquisition:
   - common LLM semantic reading;
   - targeted meaning-preserving projection only when needed;
   - optional language-intelligence adapter when evidence shows the common core is insufficient.
5. Build `MeaningEvidenceGraph` for entities, predicates, arguments, polarity, modality, conditions, exceptions, causality, comparison, quantities, temporal relations, references, discourse and unresolved items.
6. Evidence integrity gate rejects unsupported additions, contradictions and invented resolution.
7. Transformation planner selects the minimum evidence required for the requested output.
8. Qwen3 controlled generation from Original + selected evidence + transformation contract.
9. Multi-axis verification:
   - deterministic invariant gate;
   - candidate semantic record;
   - Granite independent semantic comparison;
   - requested language/structure validation;
   - unresolved-meaning handling validation.
10. `ErrorDelta` routing:
   - `PASS`;
   - `LOCAL_FIX` for bounded local repair;
   - `FRESH_REGENERATE` from Original;
   - `REANALYZE` when source understanding is the problem;
   - `FAIL_CLOSED` when correctness cannot be established.
11. Final integrity gate before output acceptance.

### Core data contracts planned for source implementation
- `TransformationRun`
- `MeaningEvidenceGraph`
- `TransformationContract`
- `AttemptRecord`
- `ErrorDelta`

The architecture keeps meaning and surface-form/style evaluation separate. Style or naturalness may never weaken the semantic-preservation gate. Same-language transformation must allow `no-op` when rewriting would add risk without meaningful benefit.

### Language Intelligence Adapter boundary
The common core is primary. Language-specific adapters are added only when repeatable evidence proves a language phenomenon is not handled adequately by the common path.

The first reference implementation is Deterministic Japanese Parser MCP. Its MeaningGraph evidence may be mapped into `MeaningEvidenceGraph` for high-risk Japanese inputs and for Japanese-output verification. DJPMCP is not the universal core and is not a translation model.

### Evidence / memory control
Reuse from debugAI and related G-ACE control assets applies at the contract level:

- AI output is not evidence by itself;
- attempts, checkpoints, verifier results and failure reasons are stored separately;
- failure memory reuses evidence and failure patterns, not an old answer blindly;
- repeated identical failed attempts are not allowed;
- source/CI/runtime/production evidence remain separate;
- runtime PASS is not AI correctness and test PASS is not universal language correctness.

### Current model roles
- Qwen3: sole current translator/generator and semantic recorder.
- Granite 4.2 8B: independent semantic-equivalence / requested-language verdict; never translation fallback.
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
