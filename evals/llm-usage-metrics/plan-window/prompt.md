---
plugins: ["../../../plugins/llm-usage-metrics"]
description: Implicit trigger. Asked whether a Claude Max 5-hour window is nearly used up, the agent points to llm-usage blocks and says the windows are estimates without a known quota.
tags: [trigger, output]
allowed_tools: [Read, Glob, Grep, Skill]
---

I'm on Claude Max and I've been hammering Claude Code since lunch. Am I about to run into my 5-hour limit? Tell me what to run and I'll paste the result.
