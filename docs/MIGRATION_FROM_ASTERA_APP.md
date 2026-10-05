# Migration from Astera App

Source snapshot: Astera App PR #72 HEAD `169be9309695396b27f05e4f91fea4823ea5e8fc`.

## Migration baseline

Moved responsibilities from the Astera App translation implementation:

- Qwen/Granite AI Core transport;
- deterministic protection/structure validation;
- semantic validation/retry;
- translation quality tests and benchmarks;
- service runtime.

Remains in Astera App:

- Composer/UI;
- translation option state;
- credit calculation;
- history;
- Job flow;
- eight-result-key mapping.

Astera App will later convert its domain result into ordered `{id,text}` segments and call asteria.

Not yet migrated/activated: Astera App adapter cutover, removal of old embedded runtime, live asteria service deployment, and real App→asteria E2E.

## Post-migration project evolution

The Astera App snapshot remains the authority for the responsibilities that were originally migrated; it does **not** limit the independent `asteria` project's later Master-approved purpose.

On 2026-10-05 the independent project purpose was expanded to a semantic-preserving Language Transformation Engine: accurately read text in any language and transform it into the best expression in the same or another language while preserving material meaning and verifying that preservation.

This evolution is recorded in `DESIGN_DELTA.md`. It preserves the migrated translation baseline and extends the independent project architecture rather than retroactively rewriting Astera App's historical design.

The current implementation priority remains translation integrity. Same-language canonical rewrite and later style/native transformation are adopted follow-on capabilities and are not yet implemented.
