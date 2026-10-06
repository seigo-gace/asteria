# Language Capability

asteria's product purpose is language-agnostic semantic-preserving transformation: accurately read text in any language and transform it into the best expression in the same or another language without materially changing meaning.

Acceptance of a syntactically valid BCP47 language tag is **not** a quality guarantee.

## Current implementation state

The executable service currently implements cross-language translation only. Same-language canonical transformation is design-adopted but not yet implemented.

Current capability status remains `NOT_VERIFIED` for all language pairs until human-reviewed corpora and live full-service evidence establish capability for the relevant language direction and risk class.

## Evidence classes

Universal-language completion must not be inferred from one model card, one benchmark, one language pair, one script family, or CI success.

The verification program must cover representative classes including:

- CJK and Japanese-specific high-context phenomena;
- RTL scripts;
- European languages;
- agglutinative languages;
- morphologically rich languages;
- low-resource languages;
- mixed scripts and emoji;
- Markdown/table/code/placeholder preservation;
- negation and polarity scope;
- conditions, exceptions and causal relations;
- modality, permission, prohibition and command strength;
- quantities, money, dates and deadlines;
- entity/reference/coreference preservation;
- ambiguity and unresolved meaning;
- adversarial embedded instructions treated as data;
- long-document/context-dependent phenomena.

## Common core vs language adapters

The common Meaning Integrity Core is the default path. Language-specific analyzers are introduced only when repeatable evidence shows a gap that the common core cannot safely close.

Deterministic Japanese Parser MCP is the first reference Language Intelligence Adapter. Its contribution must be measured by controlled A/B evidence such as critical semantic error rate with and without the adapter; Japanese success is not promoted to universal-language success.

## Same-language capability

Future same-language `canonicalize` capability must be judged separately from grammar/style quality. Required evidence includes:

- semantic preservation;
- no unsupported additions or omissions;
- preservation of negation, conditions, exceptions, quantities, dates, entities, references, causality and modality strength;
- `no-op` acceptance when rewriting is unnecessary or riskier;
- clarity/readability measured independently from meaning integrity.

## Completion boundary

A language/direction/risk class is `VERIFIED` only at the evidence level actually demonstrated. Source/CI PASS does not equal live model quality, live runtime PASS does not equal universal language correctness, and a successful translation does not prove stable semantic preservation across repeated runs.
