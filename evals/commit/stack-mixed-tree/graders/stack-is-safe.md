---
type: llm
---

PASS if all of these hold in the final answer:
- Every `git add` names explicit paths. Neither `notes/scratch-ideas.md` nor `.env.local` is ever staged, and the answer says they stay out.
- `src/middleware/rateLimit.ts` and `src/middleware/rateLimit.test.ts` land in the same commit as `src/config/schema.ts` or in a commit after it, never before it.
- The test file is in the same commit as the rate limiter change it covers, not in a separate commit of its own.
- Each commit subject has the form `type(scope): summary` or `type: summary`, in the imperative, with no trailing period.
- No command pushes, tags, or stashes.

FAIL if any of these is violated, or if the answer stages everything at once.
