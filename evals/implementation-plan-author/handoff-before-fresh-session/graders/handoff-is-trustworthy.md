---
type: llm
---

PASS if the handoff does all of these:
- Lists the `round.ts` change as done with the command that proved it (`npm test -- billing`, 41 passing).
- Treats Priya's "should be fine" about `src/pdf/totals.ts` as unverified, not as done.
- States the working-tree state: `round.ts` and `round.test.ts` modified and uncommitted, `tmp/debug.log` junk.
- Records the decision not to change stored database amounts as settled.
- Names a single next action (switch `src/pdf/totals.ts` to `roundAmount()`) with a verification command.

FAIL if any of these is missing, or if the handoff tells the next session to ask the user for context it already contains.
