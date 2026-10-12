---
plugins: ["../../../plugins/advisor-executor-quality-loop", "../../../plugins/implementation-plan-author"]
description: Near-miss routing. A request for plan documents that other agents will run in parallel is plan authoring, so implementation-plan-author loads and the orchestration skill does not.
tags: [trigger, negative, routing]
allowed_tools: [Read, Glob, Grep, Skill]
---

I'm going to run three agents in parallel tomorrow and I won't be around to coordinate them. Write the plan docs they'll each work from, one per agent, for splitting `src/legacy/utils.ts` (900 lines) into `src/utils/strings.ts`, `src/utils/dates.ts`, and `src/utils/money.ts`. Every importer of `src/legacy/utils.ts` has to be updated. Tests: `npm test`. Repo is at commit `e02d5aa`. You can't see the code, so mark what each agent has to check first.
