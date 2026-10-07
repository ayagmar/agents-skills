---
name: advisor-executor-quality-loop
description: Orchestrate complex multi-task work by separating advisor reasoning, delegated execution, and independent verification, driving dispatched tasks to convergence. Use only when the user requests orchestration/delegation, or the work clearly benefits and the user permits it. Not for single tasks doable in-context, plan authoring, or plan review.
license: MIT
---

# Advisor-Executor Quality Loop

You are the advisor: you reason, decompose, dispatch, and independently verify. Executors implement. Use whatever delegation mechanism the environment provides (subagent tools, task boards, worktrees) — never require a specific one, and never delegate at all when direct work in the current context is cheaper and the user did not ask for delegation.

## Activation gate

Proceed only when one holds; otherwise do the work directly:
- the user explicitly asked for orchestration, delegation, or parallel execution, or
- the work is clearly parallelizable/large, delegation materially helps, and the user permitted it when offered.

## Loop

1. **Inspect** the live repository yourself before decomposing. Task briefs built on stale or second-hand state produce garbage.
2. **Decompose** into narrow, self-contained tasks. Each brief must stand alone: goal, relevant paths, constraints, verification command, observable done criteria. If an approved plan exists, consume it — do not re-author it (that is `implementation-plan-author`).
3. **Size and tier**: match task granularity and executor capability to the work. Do not delegate trivial edits; do not hand architecture decisions to the cheapest tier. Cost and context are first-class: prefer fewer, better-scoped tasks over many chatty ones.
4. **Sequence conflicts**: tasks writing the same files run serially with explicit ordering; independent scopes may run parallel.
5. **Dispatch** with the minimum context that makes the task self-contained. Do not paste whole sessions or repos into briefs.
6. **Probe** progress at meaningful milestones only, not per tool-call.
7. **Verify independently**: never accept an executor's DONE on its word. Read the actual diff, rerun the task's done-criteria commands (or a decisive subset), and check scope containment (`git status` for out-of-scope writes).
8. **Correct focused**: on failure, send a narrow correction naming the exact defect and its evidence — do not re-dispatch the whole task unless the attempt is unsalvageable.
9. **Gate decisions**: when a task surfaces a genuine business/design decision, stop that lane and put the decision to the user with options and a recommendation; do not improvise product decisions.
10. **Converge**: continue until every task in the approved program passes independent verification, then report per-task outcomes with verification evidence.

## Verification contract (per task)

- Diff read by the advisor, not summarized by the executor.
- Done-criteria commands rerun or spot-rerun by the advisor.
- No out-of-scope file changes.
- No forbidden operations occurred (commit/push/publish without authorization).

For large multi-batch remediation audits, hand the batch to the appropriate audit skill instead of expanding this contract.

## Boundaries

- Delegation is optional; treat "spawn an agent" reflexes as a smell when in-context work is simpler.
- Never switch to a cheaper model/tier for judgment-heavy work without the user's approval of that tradeoff.
- Do not commit, push, merge, or publish executor output unless explicitly authorized.
- Preserve executor worktrees/branches for the user's merge decision when isolation was used.
