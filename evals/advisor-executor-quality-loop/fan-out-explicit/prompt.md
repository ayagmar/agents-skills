---
plugins: ["../../../plugins/advisor-executor-quality-loop"]
description: Explicit delegation request. The agent serializes tasks that write the same file, gives each brief its own verification, and verifies executor output itself instead of trusting reports.
tags: [delegation, trigger, output]
allowed_tools: [Read, Glob, Grep, Skill]
---

Hand these out to worker agents and check what comes back before you tell me anything is done. Don't dispatch yet: first show me how you'd split it, what each worker gets, and how you'll check their work.

1. Add exponential-backoff retries to `request()` in `src/http/client.ts`.
2. Add a per-request `timeoutMs` option to `request()` in `src/http/client.ts`.
3. Document both options in `docs/http.md`.

Tests run with `npm test -- http`. Nobody commits or pushes; I'll review and merge myself.
