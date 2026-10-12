---
plugins: ["../../../plugins/session-cost-forensics"]
description: Implicit trigger. Asked why plan limits run out early, the agent loads the skill and scopes the report by provider, project, and date window instead of aggregating all history.
tags: [trigger, output]
allowed_tools: [Read, Glob, Grep, Skill]
---

I keep hitting my Claude Code limits way earlier this month than in August, and almost all of my work has been in the billing-api repo. I want to find out what's eating it. You can't run anything here, so tell me exactly what to run and I'll paste the output back.
