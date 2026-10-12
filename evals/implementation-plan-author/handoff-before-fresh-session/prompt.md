---
plugins: ["../../../plugins/implementation-plan-author"]
description: Implicit trigger. Before a context reset, the agent writes a handoff that separates verified work from claims, keeps the dirty-tree state, and names one next action with its check.
tags: [trigger, output]
allowed_tools: [Read, Glob, Grep, Skill]
---

I'm nearly out of context and starting a fresh session after this. Write something I can paste in so the new session continues the invoice-rounding fix without re-asking me anything. Where we are:

- Branch `fix/invoice-rounding`, last commit `c71a09e`.
- Changed `src/billing/round.ts` to use banker's rounding. `npm test -- billing` passed after that change, 41 tests.
- `src/billing/round.ts` and `test/billing/round.test.ts` are modified, not committed. `tmp/debug.log` is junk from debugging.
- Priya said in chat that the PDF renderer in `src/pdf/totals.ts` also rounds and "should be fine". Nobody has looked at it.
- Still to do: make `src/pdf/totals.ts` call `roundAmount()` from `src/billing/round.ts` instead of its own `Math.round`, then run `npm test`.
- We decided not to change stored amounts in the database, only display rounding. Don't reopen that.
