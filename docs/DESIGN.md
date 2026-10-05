# asteria Design

## Current Architecture — Language Integrity v3

### Project responsibility
asteria is a semantic-preserving Language Transformation Engine. Its purpose is to accurately read text in any language and transform it into the best expression in the same or another language while preserving material meaning and verifying that preservation before acceptance.

Current implementation priority remains cross-language translation correctness. Same-language canonical rewrite and later style/native-expression transformation are follow-on modes on the same Meaning Integrity Core. asteria does not own consumer UI, billing, history, or application-specific result schemas.

### Authority model
Two distinct layers remain mandatory:

1. **Original Input / Context** — immutable semantic authority.
2. **Meaning Evidence Graph** — structured evidence derived from ORIGINAL; it may constrain generation/verification but never replaces ORIGINAL.

Normalization is also derived evidence/control input. It is never semantic authority. Unknown, ambiguous, conflicting or insufficiently supported meaning remains unresolved rather than guessed.

### Executable processing flow
1. Surface integrity scan protects numbers, dates, money, code, URLs, placeholders and other invariants.
2. Transformation intent contract fixes requested language/mode and preservation constraints.
3. Deterministic Risk Router classifies active input as `simple / complex / high-risk / ambiguous` from explicit surface/context signals. Routing uses no model call and no invented numeric long-text threshold.
4. ORIGINAL meaning acquisition runs first through Qwen semantic recording.
5. Optional declared `source_language` must match detected ORIGINAL language before optional heavy processing.
6. ORIGINAL-derived `MeaningEvidenceGraph` must pass Granite ORIGINAL-vs-EvidenceGraph Integrity before optional normalization or translation generation.
7. Selected normalization is considered only for meaning-structure risks where explicitness may help: negation, condition, exception, modality, reference context, or explicit ambiguity.
   - quantity/protected-value-only risk does not activate normalization;
   - Qwen creates a same-language meaning-preserving candidate;
   - candidate must preserve line/Markdown/protected structure;
   - Granite directly compares ORIGINAL vs normalized candidate;
   - direct non-pass discards normalization and retains already-validated ORIGINAL evidence;
   - after direct PASS, Qwen rebuilds Meaning Evidence from normalized text;
   - that rebuilt evidence must keep the same detected language and pass Granite against ORIGINAL again;
   - only then may normalized evidence replace ORIGINAL-derived evidence as generation guidance.
8. Qwen controlled generation always translates ORIGINAL section bodies. `high-risk / ambiguous` use `risk_focused`; `simple / complex` use the existing document path.
9. Multi-axis verification applies deterministic invariants, candidate semantic record, Granite semantic comparison, requested language validation and unresolved-meaning handling.
10. `ErrorDelta` routing selects `PASS / LOCAL_FIX / FRESH_REGENERATE / REANALYZE / FAIL_CLOSED`.
11. `REANALYZE` uses only ORIGINAL + verifier ErrorDelta in fresh context, excludes the prior candidate, revalidates rebuilt evidence, and allows at most one ORIGINAL-anchored regeneration.
12. Final integrity gate precedes acceptance.

### Current data contracts
- `TransformationRun`
- `MeaningEvidenceGraph`
- `TransformationContract`
- `AttemptRecord`
- `ErrorDelta`
- `RiskProfile`

`TransformationRun` stores deterministic RiskProfile alongside ORIGINAL, contract, source evidence and attempts. Router trace must not become semantic authority.

### Risk Router boundary
Risk classification and heavy-stage selection are intentionally separate. `high-risk` does not automatically mean every expensive stage runs. Risk Router itself is deterministic and zero-model-call; selected normalization is activated only for meaning-structure signals. Mandatory Evidence Integrity, deterministic protection and semantic verification remain common to all paths.

### Normalization boundary
Meaning-preserving normalization is a selected analysis aid, not a summary/simplifier and not the translation source. It must not add/delete meaning, resolve unsupported ambiguity, invent referents/subjects, or change polarity, modality, conditions, exceptions, quantities, temporal relations, comparison, causality or command strength.

The safety ordering is deliberate: ORIGINAL semantic reading, source-language validation and ORIGINAL Evidence Integrity all precede normalization. A rejected or unsafe normalization therefore falls back to already-validated ORIGINAL evidence instead of weakening the request or failing merely because the optional helper was not useful.

Call overhead is observable. Simple and quantity-only paths keep prior call counts. Directly rejected normalization adds two local model calls; fully accepted normalization adds four local calls because normalized Meaning Evidence is rebuilt and independently checked against ORIGINAL. This overhead requires runtime A/B justification.

### Language Intelligence Adapter boundary
The common core remains primary. Language-specific adapters are added only when repeatable evidence shows a language phenomenon is not handled adequately by the common path.

The first reference implementation is Deterministic Japanese Parser MCP. Its MeaningGraph may later map into `MeaningEvidenceGraph` for selected Japanese cases. DJPMCP is not the universal core and is not a translation model.

### Evidence / memory control
Reuse from debugAI and related G-ACE control assets applies at the contract level:

- AI output is not evidence by itself;
- attempts, checkpoints, verifier results and failure reasons are separated;
- failure memory reuses evidence/failure patterns, not an old answer blindly;
- repeated identical failed attempts are not allowed;
- Source/CI/Runtime/Production evidence remain separate;
- Runtime PASS is not AI correctness and Test PASS is not universal language correctness.

### Current model roles
- Qwen3: sole translator/generator, semantic recorder, selected same-language source normalizer, and bounded fresh-context source reanalyst.
- Granite 4.2 8B: independent normalization-equivalence, source-evidence integrity, semantic-equivalence and requested-language judge; never translation fallback.
- AI Core Router: only current model access path.

Model-role changes require separate evidence.

### Security
All supplied text is untrusted data. asteria never uses source text as executable instruction. Service and AI Core bind/access loopback only. Internal API uses bearer authentication. Secrets are environment-only. Prompt injection embedded in source text remains data.

### Product modes
- `translate` — current implementation priority.
- `canonicalize` — adopted follow-on same-language integrity mode, not yet implemented.
- `clarify` — future bounded mode, not yet implemented.
- style/native-expression modes — future surface-only modes; meaning gates remain mandatory.

See `DESIGN_DELTA.md` for the adoption decision, rationale and verification impact.

---

## Previous Migration Baseline — preserved

The following baseline is retained as the pre-v3 translation design and remains traceable.

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
