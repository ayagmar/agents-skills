---
plugins: ["../../../plugins/session-memory-search", "../../../plugins/session-cost-forensics"]
description: Routing. A question about why agent usage went up belongs to session-cost-forensics, not session-memory-search, even though both read the same session stores.
tags: [trigger, negative, routing]
allowed_tools: [Read, Glob, Grep, Skill]
---

My Claude Code usage on the billing-api repo roughly doubled last week compared to the week before, and I didn't do noticeably more work. What should I look at to figure out where it went and how to bring it back down?
