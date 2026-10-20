---
plugins: ["../../../plugins/llm-usage-metrics", "../../../plugins/session-cost-forensics"]
description: Routing. Diagnosing why sessions burn tokens through compactions, retries, and cache misses belongs to session-cost-forensics, not llm-usage-metrics, even though both report cost.
tags: [trigger, negative, routing]
allowed_tools: [Read, Glob, Grep, Skill]
---

My Claude Code sessions in the billing-api repo keep compacting, and I suspect the agent re-sends the same prompt after it loses context. I want to find which sessions waste the most tokens that way and what to change in how I work.
