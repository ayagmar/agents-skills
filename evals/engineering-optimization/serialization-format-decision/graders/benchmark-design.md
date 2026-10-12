---
type: llm
---

PASS if all of these hold in the final answer:
- It sets numeric thresholds for adopting MessagePack, keeping JSON, and an inconclusive result, and says they are fixed before running the benchmark.
- It requires both candidates to round-trip the same values to equivalent output, checked automatically, before speed counts.
- It controls at least one source of benchmark bias: interleaved run order, a fresh process per candidate, or identical warmup.
- It uses copied or synthetic data, not the production Redis.

FAIL if any of these is violated, or if it recommends a winner without running anything.
