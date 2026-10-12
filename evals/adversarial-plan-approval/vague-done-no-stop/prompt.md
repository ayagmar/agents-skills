---
plugins: ["../../../plugins/adversarial-plan-approval"]
description: Implicit trigger. A pasted two-task plan with a vague done criterion, no STOP conditions, and a same-file parallel claim gets per-task ACCEPT/MODIFY/REJECT verdicts that catch each defect.
tags: [trigger, output]
allowed_tools: [Read, Glob, Grep, Skill]
---

My teammate wrote this for the coding agent to run overnight. I don't have the repo checked out here, so go off what's below. Will it hold up, or will I wake up to a mess?

```markdown
# Program: CSV export

Written against commit `9f3c2e1`.

## Task 1: Add `--delimiter` option to the export command
- Files: `src/export/csv.ts`, `src/cli/export.ts`
- Add a `delimiter` option (default `,`) to `src/cli/export.ts` and pass it to `writeCsv()` in `src/export/csv.ts`.
- Verify: `npm test -- export` → all export tests pass, including a new `writeCsv uses custom delimiter` test.

## Task 2: Quote fields that contain newlines
- Files: `src/export/csv.ts`
- Update `escapeField()` so fields with `\n` are wrapped in double quotes.
- Done when: the export works correctly and handles newlines properly.

## Execution
Tasks 1 and 2 are independent and can run in parallel on separate agents.
```
