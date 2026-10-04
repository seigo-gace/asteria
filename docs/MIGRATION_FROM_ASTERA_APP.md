# Migration from Astera App

Source snapshot: Astera App PR #72 HEAD `169be9309695396b27f05e4f91fea4823ea5e8fc`.

Moved responsibilities: Qwen/Granite AI Core transport, deterministic protection/structure validation, semantic validation/retry, translation quality tests, benchmarks, service runtime.

Remains in Astera App: Composer/UI, translation option state, credit calculation, history, Job flow, eight-result-key mapping. App will later convert its domain result into ordered `{id,text}` segments and call AsteriaAI.

Not yet migrated/activated: Astera App adapter cutover, removal of old embedded runtime, live Asteria service deployment, real App→Asteria E2E.
