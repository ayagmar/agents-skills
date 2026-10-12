---
plugins: ["../../../plugins/engineering-optimization"]
description: Implicit trigger for a decision benchmark. The agent fixes the question and numeric GO / NO-GO / INCONCLUSIVE thresholds before any run, and requires correctness parity between candidates.
tags: [trigger, output]
allowed_tools: [Read, Glob, Grep, Skill]
---

The team is split on switching the values we store in Redis from JSON to MessagePack. One side says it'll cut latency and memory, the other says it's churn for nothing. Before anyone opens a PR I want a way to settle it that both sides will accept. How should we do this?

Context: Node 20 service, about 30k cache reads/s at peak, values are order summaries between 2 and 40 KB.
