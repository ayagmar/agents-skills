---
type: llm
---

PASS if all of these hold in the final answer:
- Each task gets exactly one verdict from ACCEPT, MODIFY, or REJECT, and Task 2 is not ACCEPT.
- It names "works correctly" / "handles newlines properly" as a done criterion that cannot be observed, and its correction is a command with an expected result (for example a named test that must pass).
- It points out that the plan has no STOP conditions (when the executor should stop and report instead of improvising).
- It flags that Tasks 1 and 2 both modify `src/export/csv.ts` yet are marked parallel, and says they need an explicit order.

FAIL if any of these is missing, or if the answer replaces the plan with a full rewrite instead of naming specific corrections.
