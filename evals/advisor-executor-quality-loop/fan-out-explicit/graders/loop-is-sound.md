---
type: llm
---

PASS if all of these hold:
- Tasks 1 and 2 are not run in parallel with each other, because both write `src/http/client.ts`: they are ordered, or merged into one task.
- Each worker brief states its own verification (for example `npm test -- http`) and a done criterion.
- The advisor says it will check each result itself, by reading the actual diff and rerunning the tests or checking for out-of-scope file changes, rather than accepting the worker's report.
- No worker is told to commit or push.

FAIL if any of these is violated.
