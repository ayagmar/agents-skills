---
plugins: ["../../../plugins/summarize"]
description: Near-miss negative. Asking for a short summary of a concept, with no URL or file to convert, must not load the skill.
tags: [trigger, negative]
allowed_tools: [Read, Glob, Grep, Skill]
---

Can you summarize the difference between the OAuth 2.0 authorization code flow and the implicit flow in one short paragraph? It's for a slide.
