---
plugins: ["../../../plugins/adversarial-plan-approval", "../../../plugins/implementation-plan-author"]
description: Routing. With both plan skills loaded, a request to vet an existing plan before work starts loads adversarial-plan-approval, not implementation-plan-author.
tags: [trigger, routing]
allowed_tools: [Read, Glob, Grep, Skill]
---

Before I let anyone start on this, can you go over it? Repo isn't available to you, so judge it on what's here.

```markdown
# Plan: Move session storage from memory to Redis

## Steps
1. Add `ioredis` to package.json and create `src/session/redisStore.ts` implementing the `SessionStore` interface from `src/session/store.ts`.
2. Switch `src/server.ts` to use `RedisStore` when `REDIS_URL` is set, otherwise keep `MemoryStore`.
3. Delete `MemoryStore` since we're on Redis now.
4. Run `npm test` → exit 0.
5. Push to main and tag a release.
```
