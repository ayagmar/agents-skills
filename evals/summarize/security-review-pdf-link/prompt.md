---
plugins: ["../../../plugins/summarize"]
description: Implicit trigger. Handed only a PDF link and a question about its contents, the agent loads the skill to get the document as text.
tags: [trigger]
allowed_tools: [Read, Glob, Grep, Skill]
---

Go through our vendor's SOC 2 bridge letter at https://trust.example-vendor.com/docs/soc2-bridge-letter-2026.pdf and pull out the coverage dates, any auditor exceptions, and the complementary controls we're expected to run. I'm doing the security review.
