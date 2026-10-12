---
type: llm
---

PASS if all of these hold in the final answer:
- It proposes replacing the per-order linear scan with a precomputed lookup (or an equivalent join).
- It says how to measure the job before and after the change on a realistic workload (the real data size or a copy of it), with the same harness both times.
- It gives a concrete equivalence check that the new report output matches the old one (for example, run both versions on the same input and diff the rows).
- It addresses duplicate customer ids: a plain `{c.id: c}` dict keeps the last duplicate while `next(...)` takes the first, so the answer either preserves first-match behavior or says the duplicates must be checked before switching.

FAIL if any of these is violated, or if it presents the rewrite as done with no measurement or equivalence check.
