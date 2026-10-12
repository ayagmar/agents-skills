---
plugins: ["../../../plugins/summarize"]
description: Near-miss negative. Text already pasted into the chat needs no conversion, so summarizing it must not load the skill.
tags: [trigger, negative]
allowed_tools: [Read, Glob, Grep, Skill]
---

tl;dr this for me in two bullets:

> We are moving the nightly invoice export from 02:00 to 04:00 UTC starting 1 November, because the upstream ledger sync now finishes later than it used to and the 02:00 export was occasionally picking up a half-synced ledger. Consumers that poll the export bucket before 04:30 UTC should move their schedule; the file name and format do not change. If you cannot move your schedule before 1 November, tell the billing platform team and we will keep a 02:00 copy running for you until 1 December.
