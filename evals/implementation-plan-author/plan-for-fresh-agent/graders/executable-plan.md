---
type: llm
---

PASS if the plan document does all of these:
- Records commit `4be81d0` as its baseline and gives a drift check command the executor runs first.
- Every done criterion is a command with an expected result (for example `npx vitest run test/commands/sync.test.ts` → passes) or an observable file or behavior state; none is "works correctly" or similar.
- Lists `src/remote/` (or `src/remote/upload.ts`) as out of scope.
- Includes a new test in `test/commands/sync.test.ts` asserting `upload` is not called with `--dry-run`.
- Reads as standalone: no "as discussed", "see above", or other references to this chat.

FAIL if any of these is missing.
