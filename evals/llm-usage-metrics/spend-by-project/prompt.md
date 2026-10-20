---
plugins: ["../../../plugins/llm-usage-metrics"]
description: Implicit trigger. Asked for this month's spend across two tools and the costliest repo, the agent loads the skill and gives llm-usage commands scoped by source and window, with real flags only.
tags: [trigger, output]
allowed_tools: [Read, Glob, Grep, Skill]
---

How much have I spent on Claude Code and Codex so far this month, and which of my repos is eating most of it? You can't run anything here, so tell me exactly what to run and I'll paste the output back.
