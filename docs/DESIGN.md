# asteria Design

## Current Architecture — Language Integrity v3

### Project responsibility
asteria is a semantic-preserving Language Transformation Engine. Its purpose is to accurately read text in any language and transform it into the best expression in the same or another language while preserving material meaning and verifying that preservation before acceptance.

Current implementation priority remains cross-language translation correctness. Same-language canonical rewrite and later style/native-expression transformation are follow-on modes on the same Meaning Integrity Core. asteria does not own consumer UI, billing, history, or application-specific result schemas.

### Authority model
Two distinct layers remain mandatory:

1. **Original Input / Context** — immutable semantic authority.
2. **Meaning Evidence Graph** — structured evidence derived from ORIGINAL; it may constrain generation/verification but never replaces ORIGINAL.

Normalization, DJPMCP guidance, and persistent failure memory are derived evidence/control inputs. None is semantic authority. Unknown, ambiguous, conflicting or insufficiently supported meaning remains unresolved rather than guessed.

### Executable processing flow
1. Surface integrity scan protects numbers, dates, money, code, URLs, placeholders and other invariants.
2. Transformation intent contract fixes requested language/mode and preservation constraints.
3. Deterministic Risk Router classifies active input as `simple / complex / high-risk / ambiguous` from explicit surface/context signals. Routing uses no model call and no invented numeric long-text threshold.
4. ORIGINAL meaning acquisition runs first through Qwen semantic recording.
5. Optional declared `source_language` must match detected ORIGINAL language before optional heavy processing.
6. ORIGINAL-derived `MeaningEvidenceGraph` must pass Granite ORIGINAL-vs-EvidenceGraph Integrity before optional adapter/normalization/translation generation.
7. If configured, focused Japanese source may call the DJPMCP Language Intelligence Adapter through the verified loopback HTTP `POST /v1/analyze` contract.
   - it runs only after Asteria's ORIGINAL evidence gate;
   - non-Japanese input bypasses it;
   - current integration consumes only verified current `AnalyzeResponse` / `meaning_graph` fields;
   - unverified `InterpretationMeaningGraph` transport fields are not assumed;
   - output is reduced to bounded structural guidance (for example polarity, deontic force, argument role/status, scope relation and unresolved counts);
   - raw source prose is not copied into adapter guidance;
   - `PARTIAL` preserves unresolved state; `FAILED` or invalid output produces no guidance;
   - unavailable/invalid adapter output never disables common Asteria integrity gates;
   - parser-derived guidance remains untrusted evidence data and cannot become executable instruction;
   - DJPMCP never replaces ORIGINAL or Asteria's Meaning Evidence Graph.
8. Selected normalization is considered only for meaning-structure risks where explicitness may help: negation, condition, exception, modality, reference context, or explicit ambiguity.
   - quantity/protected-value-only risk does not activate normalization;
   - Qwen creates a same-language meaning-preserving candidate;
   - candidate must preserve line/Markdown/protected structure;
   - Granite directly compares ORIGINAL vs normalized candidate;
   - direct non-pass discards normalization and retains already-validated ORIGINAL evidence;
   - after direct PASS, Qwen rebuilds Meaning Evidence from normalized text;
   - that rebuilt evidence must keep the same detected language and pass Granite against ORIGINAL again;
   - only then may normalized evidence replace ORIGINAL-derived evidence as generation guidance.
9. Build an exact translation-memory input binding digest from profile version, language binding, model identities and ORIGINAL input. Hash the accepted source evidence separately.
10. Read bounded prior rejected-attempt memory for the same input binding. Only records with the same accepted evidence may become failure-avoidance guidance; changed evidence reopens rather than blindly reapplies the old rejection.
11. Qwen controlled generation always translates ORIGINAL section bodies. `high-risk / ambiguous` use `risk_focused`; `simple / complex` use the existing document path. Prior candidate prose is never replayed from memory.
12. Multi-axis verification applies deterministic invariants, candidate semantic record, Granite semantic comparison, requested language validation and unresolved-meaning handling.
13. `ErrorDelta` routing selects `PASS / LOCAL_FIX / FRESH_REGENERATE / REANALYZE / FAIL_CLOSED`.
14. `REANALYZE` uses only ORIGINAL + verifier ErrorDelta in fresh context, excludes the prior candidate, revalidates rebuilt evidence, and allows at most one ORIGINAL-anchored regeneration.
15. Rejected attempts append bounded failure metadata; accepted runs append an accepted checkpoint. No raw source/candidate prose, full prompt, conversation, private reasoning or secret is stored in translation memory.
16. Final integrity gate precedes acceptance.

### Current data contracts
- `TransformationRun`
- `MeaningEvidenceGraph`
- `TransformationContract`
- `AttemptRecord`
- `ErrorDelta`
- `RiskProfile`
- `TranslationMemoryRecord`
- `TranslationMemoryContext`
- `JapaneseLanguageIntelligence`
- `JapaneseLanguageIntelligenceResult`

`TransformationRun` stores deterministic RiskProfile alongside ORIGINAL, contract, source evidence and attempts. Router trace, parser guidance, and memory history must not become semantic authority.

### Risk Router boundary
Risk classification and heavy-stage selection are intentionally separate. `high-risk` does not automatically mean every expensive stage runs. Risk Router itself is deterministic and zero-model-call; selected normalization is activated only for meaning-structure signals. Mandatory Evidence Integrity, deterministic protection and semantic verification remain common to all paths.

### Normalization boundary
Meaning-preserving normalization is a selected analysis aid, not a summary/simplifier and not the translation source. It must not add/delete meaning, resolve unsupported ambiguity, invent referents/subjects, or change polarity, modality, conditions, exceptions, quantities, temporal relations, comparison, causality or command strength.

The safety ordering is deliberate: ORIGINAL semantic reading, source-language validation and ORIGINAL Evidence Integrity all precede normalization. A rejected or unsafe normalization therefore falls back to already-validated ORIGINAL evidence instead of weakening the request or failing merely because the optional helper was not useful.

Call overhead is observable. Simple and quantity-only paths keep prior call counts. Directly rejected normalization adds two local model calls; fully accepted normalization adds four local calls because normalized Meaning Evidence is rebuilt and independently checked against ORIGINAL. This overhead requires runtime A/B justification.

### Persistent failure-memory boundary
The translation memory reuses debugAI's durable-control principles at a translation-specific scale rather than copying the full debug workflow engine.

- append-only JSONL is used as the source storage contract;
- identity uses SHA-256 binding/evidence digests rather than raw source text;
- only fixed `ErrorDeltaKind` / correction-route enums are consumable as guidance;
- malformed/untrusted records are ignored and cannot inject arbitrary prompt text;
- exact input binding is required for reuse;
- same binding + changed accepted evidence is treated as reopened history, not reusable failure guidance;
- prior accepted translation prose is never cached or returned;
- each request regenerates from ORIGINAL and passes current deterministic + semantic verification again;
- memory read/write failure is fail-open only for the memory helper and is counted in `memory_errors`; it never disables the fail-closed Translation Integrity gates;
- default source path is `/app/data/translation-memory.jsonl`; Docker/Compose define a writable persistent-data contract, but restart/recreate survival is Runtime-unverified until separately exercised.

### Language Intelligence Adapter boundary
The common core remains primary. Language-specific adapters are added only when repeatable evidence shows a language phenomenon may benefit from specialized deterministic evidence.

The first Source/CI implementation is Deterministic Japanese Parser MCP through its current loopback HTTP API. The verified HTTP endpoint returns the current full `AnalyzeResponse`, including `meaning_graph`; Asteria does not assume extension fields merely because helper classes exist in DJPMCP source. Adapter configuration is optional and A/B-friendly: adapter OFF is the common-core baseline, adapter ON is the Japanese evidence lane.

`DJPMCP_BASE_URL` and `DJPMCP_API_KEY` must be configured together, and the URL must be loopback HTTP. Actual secret values remain runtime-only. Source/CI implementation is not evidence that DJPMCP improves translation quality; that requires real Qwen3 + Granite + DJPMCP A/B.

### Evidence / memory control
Reuse from debugAI and related G-ACE control assets applies at the contract level:

- AI output is not evidence by itself;
- attempts, checkpoints, verifier results and failure reasons are separated;
- failure memory reuses evidence/failure patterns, not an old answer blindly;
- repeated identical failed attempts are not allowed to become unconstrained replay;
- changed input/evidence invalidates blind reuse;
- parser-derived evidence remains data, not executable instruction or semantic authority;
- Source/CI/Runtime/Production evidence remain separate;
- Runtime PASS is not AI correctness and Test PASS is not universal language correctness.

### Current model/tool roles
- Qwen3: sole translator/generator, semantic recorder, selected same-language source normalizer, and bounded fresh-context source reanalyst.
- Granite 4.2 8B: independent normalization-equivalence, source-evidence integrity, semantic-equivalence and requested-language judge; never translation fallback.
- Deterministic Japanese Parser MCP: optional Japanese Language Intelligence evidence source; not a translator and not universal meaning authority.
- AI Core Router: only current model access path.

Role changes require separate evidence.

### Security
All supplied text is untrusted data. asteria never uses source text or parser-derived data as executable instruction. Service, AI Core and configured DJPMCP access remain loopback-only. Internal API uses bearer authentication. Secrets are environment-only. Prompt injection embedded in source or adapter output remains data. Persistent memory stores only validated bounded metadata, never raw source/candidate text or secret-bearing prompt material.

### Product modes
- `translate` — current implementation priority.
- `canonicalize` — adopted follow-on same-language integrity mode, not yet implemented.
- `clarify` — future bounded mode, not yet implemented.
- style/native-expression modes — future surface-only modes; meaning gates remain mandatory.

See `DESIGN_DELTA.md` for the adopted Language Integrity architecture rationale.

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
