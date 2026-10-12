---
plugins: ["../../../plugins/product-spec-foundry", "../../../plugins/improve"]
description: Routing near-miss. Auditing a live product's code for inconsistencies belongs to improve, not product-spec-foundry, even though the request talks about specs and consistency.
tags: [trigger, negative, routing]
allowed_tools: [Read, Glob, Grep, Skill]
---

Our invoicing app has been live for eight months and the code no longer matches what the original spec said. Go through the codebase in this folder and tell me what's inconsistent or risky and what we should fix first.
