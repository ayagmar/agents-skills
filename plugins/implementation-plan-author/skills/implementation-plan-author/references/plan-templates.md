# Plan Templates

Use only applicable sections. Omitted sections are omitted silently — never leave placeholder headings.

## Single plan

```markdown
# Plan: <imperative title — what will be true after execution>

## Objective
One paragraph: the change and why it matters.

## Baseline
- Written against: commit `<short SHA>` (or observable baseline: file hash, version, dataset id)
- Drift check (run first): `git diff --stat <SHA>..HEAD -- <in-scope paths>`
  → on any in-scope change, re-verify "Current state" before proceeding; on mismatch, STOP.

## Current state
Evidence from live reads: relevant files with one-line roles, short excerpts
with `file:line` markers, and the repo conventions to match (name an exemplar file).

## Assumptions and decisions
- Assumption: <X> — verified by <how> / unverified (executor must verify in step N).
- Decision: <chosen approach> over <alternative> because <reason>.

## Dependencies
- Plans/work that must land first, external services, credentials, running infrastructure.

## Scope
**In scope** (only files to modify): ...
**Out of scope** (do not touch, even if related): ... — with one-line reasons.

## Steps
### Step 1: <imperative>
Precise action, exact files/symbols.
**Verify**: `<command>` → <expected result>
(Order steps so the codebase is never broken between steps when possible.)

## Regression expectations
- Existing tests that must keep passing: `<command>`.
- New tests to add: file, cases (happy path, the specific defect, named edges), pattern exemplar.

## Verification
- Focused: `<command per changed surface>` → expected.
- Complete gate: `<repo's full verify command>` → exit 0.

## Done criteria (all must hold, machine-checkable)
- [ ] `<command>` → <result>
- [ ] No files outside in-scope list modified (`git status`)

## STOP conditions
Stop and report (do not improvise) if:
- Current-state excerpts do not match live code.
- A step's verification fails twice after a reasonable fix.
- The fix requires touching an out-of-scope file.
- Assumption "<X>" turns out false.

## Commit boundaries   ← only when the user requested commits
- Commit after step N: `<type>(<scope>): <subject>` covering <files>.
```

## Program index

```markdown
# Program: <name>

Written <date> against commit `<SHA>`.

## Execution order
| Plan | Title | Depends on | File-scope overlap | Status |
|------|-------|------------|--------------------|--------|
| 001  | ...   | —          | none               | TODO   |
| 002  | ...   | 001        | shares src/x with 003 → must precede it | TODO |

Status: TODO | IN PROGRESS | DONE | BLOCKED (reason) | REJECTED (reason)

## Dependency notes
- 002 before 003 because both modify <path>; parallel execution would conflict.

## Decisions considered and rejected
- <approach>: rejected because <one line>.
```

## Handoff

```markdown
# Handoff: <work item>

## State
- Baseline: commit `<SHA>`, branch `<name>`
- Done and verified: <items, each with the command that proved it>
- Claimed but unverified: <items> — verify before trusting.
- Not started: <items>

## Live context the next agent needs
- Working tree state (dirty files and why they are dirty).
- Decisions already made that must not be relitigated: <list with reasons>.
- Known traps discovered so far.

## Next action
The single next step, with its verification command.

## Completion
Done criteria and full gate identical to the original plan (restate; do not reference it).
```
