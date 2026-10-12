---
plugins: ["../../../plugins/implementation-plan-author"]
description: Near-miss negative. The user already has a plan and wants step 3 implemented now, so the plan-authoring skill must not load.
tags: [trigger, negative]
allowed_tools: [Read, Glob, Grep, Skill]
---

We already planned this out, no more planning please. Step 3 of the plan is "make `slugify` keep accented letters as their plain form (`café` → `cafe`) instead of dropping them". Just give me the updated function:

```ts
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
```
