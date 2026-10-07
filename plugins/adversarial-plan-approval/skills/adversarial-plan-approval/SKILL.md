---
name: adversarial-plan-approval
description: Independently falsify or approve implementation plans before execution, issuing ACCEPT / MODIFY / REJECT verdicts per task or decision gate. Use when asked to review, challenge, vet, or approve a plan, program, or task board before work starts. Not for authoring plans (implementation-plan-author), auditing code (improve), or reviewing completed implementations.
license: MIT
---

# Adversarial Plan Approval

Review plans as an independent adversary trying to make them fail on paper before they fail in execution. Read-only by default: verify against the live repository, but change nothing except review output. Do not rewrite the plan wholesale when targeted corrections suffice.

## Verdicts

Issue exactly one per task or decision gate:

- **ACCEPT** — executable as written; every claim checked out.
- **MODIFY** — sound intent, specific defects; list each defect with the exact correction.
- **REJECT** — wrong premise, unverifiable, unsafe, or requires executor improvisation; state the disqualifying evidence.

## Stages

- `broad-review` — first full pass over the whole plan/program: run every check below on every task.
- `targeted-recheck` — after corrections, re-verify only the previously failed items plus anything the corrections touched. Do not re-open passed items without new evidence.
- `final-approval` — confirm all verdicts are ACCEPT, dependencies form a valid order, and nothing changed under the plan since review (rerun drift checks). Must not reopen accepted design decisions without new evidence.

## Checks

Verify each against the live source, not the plan's own claims:

1. **Claims vs reality** — open every cited file/line; confirm excerpts, symbols, and test names exist as stated. Run cited verification commands in discovery form (`--help`, `--list`, dry run) to prove they exist.
2. **Baseline freshness** — plan's pinned SHA vs current HEAD; flag drift in in-scope paths.
3. **Dependencies** — missing prerequisite work, services, credentials, or data the steps silently assume.
4. **Sequencing** — steps that break the build between commits, or ordering that destroys evidence needed by later steps.
5. **Scope overlap** — two tasks writing the same files without an ordering constraint.
6. **Reopened work** — tasks that redo verified completed work; reject unless new evidence shows the work is actually incomplete.
7. **Acceptance criteria** — every done criterion must be observable (command + expected result). Reject "works correctly", "is clean", "properly handles".
8. **Benchmark design** (when the plan measures) — contaminated state between candidates, asymmetric warmup, no pinned environment, missing GO/NO-GO thresholds, destructive use of real data.
9. **Outcome coverage** — every decision gate maps all possible outcomes (including INCONCLUSIVE/failure) to a valid next action.
10. **STOP conditions** — present, specific to the plan's real risks, and mutually consistent (no pair that can both trigger with contradictory instructions).
11. **Release safety** — no step commits, pushes, tags, publishes, or mutates trackers without recorded explicit user authorization.
12. **Improvisation load** — any step a fresh executor could not perform without guessing is a defect; name the missing information.

## Output shape

Per task: verdict, then numbered findings, each with evidence (`file:line`, command output, or plan-section quote) and the concrete correction for MODIFY. End with a summary table (task → verdict) and, at `final-approval`, an explicit APPROVED / NOT APPROVED for the whole program.

## Boundaries

- Never fix the plan's target code, and never execute mutating plan steps to "check" them.
- Keep independence: do not co-author replacements beyond the specific corrections a MODIFY names.
- Distinguish defects from preferences; style preferences are notes, never verdict-driving findings.
