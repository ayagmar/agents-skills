---
plugins: ["../../../plugins/commit"]
description: Logical commit stack over a mixed tree. The agent keeps unrelated user files out, stages by path, and pairs the test with the change it proves.
tags: [trigger, output]
allowed_tools: [Read, Glob, Grep, Skill]
---

I can't give you shell access right now, so just tell me the exact git commands to run. Split my rate limiter work into reviewable commits. Here is the tree:

```
$ git status --short
 M src/middleware/rateLimit.ts
 M src/middleware/rateLimit.test.ts
 M src/config/schema.ts
 M docs/configuration.md
?? notes/scratch-ideas.md
?? .env.local
```

- `src/config/schema.ts` adds a `rateLimit.burst` option. `rateLimit.ts` reads it, and `rateLimit.test.ts` covers burst handling. Neither compiles without the schema change.
- `docs/configuration.md` documents the new option.
- `notes/scratch-ideas.md` and `.env.local` are mine and have nothing to do with this.
