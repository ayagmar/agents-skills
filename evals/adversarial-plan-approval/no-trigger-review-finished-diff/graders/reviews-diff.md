---
type: llm
---

PASS if the answer reviews the diff and says `Math.max` is wrong for clamping (it forces every size to at least 100) and that `Math.min` is needed.
FAIL if it misses that bug, or if it responds with ACCEPT / MODIFY / REJECT plan verdicts instead of reviewing the code.
