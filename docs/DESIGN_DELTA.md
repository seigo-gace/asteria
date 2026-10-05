# Design Delta

## 2026-10-05 — Language Integrity Architecture v3

### Baseline preserved
The migration baseline remains the translation-only architecture recorded in `docs/DESIGN.md` and inherited from Astera App translation work. It is preserved as historical design evidence and is not deleted or rewritten out of history.

### Master decision
The project purpose is expanded from a translation-only engine to a semantic-preserving Language Transformation Engine:

> asteria must accurately read text in any language and transform it into the best expression in the same or another language while preserving meaning, with verification that material meaning was not changed.

The current implementation priority remains cross-language translation correctness. Same-language canonical rewrite and later style/native optimization are follow-on modes on the same integrity core and must not delay the translation-integrity phase.

### Architecture change
The new current design uses two distinct authorities:

- **Original Input** — immutable semantic authority.
- **Meaning Evidence Graph** — structured, reviewable evidence extracted from the original; never a replacement for the original.

The target processing flow is:

```text
Original Input / Context
  -> Surface Integrity Scan
  -> Transformation Intent Contract
  -> Risk Router
  -> Meaning Acquisition
       -> common LLM semantic reading
       -> targeted meaning-preserving projection when justified
       -> optional language intelligence adapter
          -> Japanese reference implementation: Deterministic Japanese Parser MCP
  -> Meaning Evidence Graph
  -> Evidence Integrity Gate
  -> Transformation Planner
  -> Qwen3 Controlled Generation
  -> Deterministic + independent semantic verification
  -> Error Delta Router
       -> PASS
       -> LOCAL_FIX
       -> FRESH_REGENERATE
       -> REANALYZE
       -> FAIL_CLOSED
  -> Final Integrity Gate
```

### Core contracts to add
- `TransformationRun`
- `MeaningEvidenceGraph`
- `TransformationContract`
- `AttemptRecord`
- `ErrorDelta`

`ErrorDelta` must distinguish omission, unsupported addition, contradiction, polarity changes, condition/exception changes, modality-strength changes, entity/reference changes, quantity/time changes, wrong-language output, literal/structure violations, and guessed unresolved meaning.

### Reuse decisions
- Keep the current Qwen3 sole-generator role and Granite independent semantic-verifier role unless later evidence justifies a change.
- Keep deterministic protected-literal/structure gates and ORIGINAL-anchored retry behavior.
- Reuse debugAI principles for evidence/state/attempt/checkpoint/failure-memory control; AI output is not evidence by itself.
- Use Deterministic Japanese Parser MCP as the first language-intelligence adapter and as an A/B measurable reference implementation, not as the universal core.
- Reuse prior G-ACE evidence-first, gated-state, loop-breaker, correction-memory and false-complete prevention patterns as design principles, not by blindly copying old source.

### Meaning-preservation rules
- Meaning and surface form are separate concerns.
- Style/naturalness may never weaken the meaning gate.
- Unknown or ambiguous meaning remains `UNKNOWN`/`AMBIGUOUS`; the system must not silently invent a resolution.
- Same-language transformation allows `no-op` as a correct result when changing the source would add risk without value.
- Memory reuses evidence, failure patterns and checkpoints; it must not blindly reuse an old output as the new answer.
- High-cost analysis is risk-routed. Simple inputs must not always pay for every adapter/retry stage.

### Product boundary
The product-facing long-term concept may be described as **Language Integrity**, but current source work remains focused on making cross-language translation meaning-safe first. Translation, canonical same-language rewrite and later style transformation share one Meaning Integrity Core rather than becoming separate engines.

### Verification impact
The acceptance program expands from generic multilingual translation cases to explicit integrity dimensions:

- critical semantic error rate;
- omission / unsupported addition / contradiction;
- polarity / condition / exception / modality preservation;
- entity / reference / quantity / time preservation;
- unresolved-meaning guessing rate;
- protected-invariant retention;
- repeated-run semantic stability;
- human pairwise adjudication;
- p50/p95/max latency, CPU/RAM and calls per accepted output.

No single language, corpus, CI run or runtime smoke test may be promoted to universal-language completion evidence.

### Scope / compatibility
This delta changes project purpose and architecture documentation only in this change unit. It does not yet implement the v3 source contracts, change public runtime APIs, download models, change providers, merge to main, deploy, or alter Production.
