---
plugins: ["../../../plugins/no-slop"]
description: Detect trigger. Asked whether a draft reads as AI, the agent names patterns with quoted lines and short fixes, and gives no rewrite, no score, and no verdict on authorship.
tags: [trigger, output]
allowed_tools: [Read, Glob, Grep, Skill]
---

My coworker wrote this for our team update. Honest question: does it read like a bot wrote it? Which parts give it away?

> In today's fast-paced world, our team has embarked on a transformative journey. This quarter, we didn't just ship features — we redefined what's possible. We migrated the billing service to Postgres 16, cut p95 checkout latency from 840 ms to 310 ms, and onboarded two new engineers. It's worth noting that this was a true testament to our collaboration, innovation, and grit. The future looks bright.
