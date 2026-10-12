---
plugins: ["../../../plugins/no-slop"]
description: Near-miss negative. A request for code that strips em dashes from Markdown is a scripting task, not prose to write or edit, so the skill must not load.
tags: [trigger, negative]
allowed_tools: [Read, Glob, Grep, Skill]
---

Write me a small Node script that walks a docs/ folder and replaces every em dash in .md files with a comma, but skips fenced code blocks. Just the code, no need to explain.
