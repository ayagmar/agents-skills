---
plugins: ["../../../plugins/summarize"]
description: Implicit trigger. Asked to read facts out of a Word file the agent cannot open as text, the agent loads the skill to convert it.
tags: [trigger]
allowed_tools: [Read, Glob, Grep, Skill]
---

Read ~/Downloads/rfp-final.docx and give me the submission deadline and the evaluation criteria.
