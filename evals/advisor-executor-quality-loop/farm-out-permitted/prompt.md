---
plugins: ["../../../plugins/advisor-executor-quality-loop"]
description: Implicit trigger. The user permits parallel helpers for a large, separable job, without naming orchestration, and the skill loads.
tags: [delegation, trigger]
allowed_tools: [Read, Glob, Grep, Skill]
---

Five packages in our monorepo need the logger swapped from `winston` to `pino`: `packages/api`, `packages/worker`, `packages/billing`, `packages/notify`, `packages/admin`. They don't share any files. Run them side by side if that's faster, I'm fine with that, but don't take anyone's word that a package is finished: I want each one actually checked. Before doing anything, tell me how you'll organize it.
