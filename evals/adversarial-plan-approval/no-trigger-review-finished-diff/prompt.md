---
plugins: ["../../../plugins/adversarial-plan-approval"]
description: Near-miss negative. Reviewing code already written against a plan is a code review, not plan approval, so the skill must not load.
tags: [trigger, negative]
allowed_tools: [Read, Glob, Grep, Skill]
---

Finished step 2 of the plan we agreed on (clamp page size to 100). Here's my diff, does it look right?

```diff
--- a/src/api/list.ts
+++ b/src/api/list.ts
@@ -12,7 +12,7 @@ export function parsePaging(query: Record<string, string>) {
   const page = Number(query.page ?? 1);
-  const size = Number(query.size ?? 20);
+  const size = Math.max(Number(query.size ?? 20), 100);
   return { page, size };
 }
```
