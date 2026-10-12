---
name: engineering-optimization
description: Make slow or heavy code faster or lighter by measuring before and after and proving the output is unchanged; also profiling, decision benchmarks between competing designs, and re-verifying past optimizations. Use when a job, endpoint, build, or query is too slow, regressed, or misses its time or memory budget and the user wants it back under budget; when asked where the time goes; when a team must choose between designs, libraries, or formats on performance grounds and wants a fair way to decide; or to check an optimization still holds. Not for speculative refactors, readability cleanups, generic audits (improve), or feature work.
license: MIT
---

# Engineering Optimization

Optimize by measurement and equivalence, never by intuition. No change ships without a before/after measurement and proof the observable behavior is unchanged (or the drift is explicitly approved).

## Modes

Pick the mode from the request: a slow or heavy thing to fix → `optimize`; "where does the time go" → `profile`; choosing between candidates → `decision-benchmark`; re-checking a past win → `verify`.

- `profile` — establish where cost actually goes; no code changes.
- `optimize` — implement the smallest high-value change against a measured baseline.
- `decision-benchmark` — compare architectures/candidates and issue GO / NO-GO / INCONCLUSIVE.
- `verify` — confirm an existing optimization still holds: rerun measurements and equivalence checks.

## Workflow

1. **Baseline.** Build a representative workload (realistic size/shape, not toy input). Record environment: hardware, runtime version, dataset identity. Repeat runs until variance is known; report median + spread, never a single run.
2. **De-noise the harness.** Remove benchmark asymmetry: identical warmup, identical launcher overhead per candidate, no shared caches between candidates unless the cache is the thing measured. Measure the harness's own floor.
3. **Attribute cost by stage** (parse, transform, IO, render…). Use the platform's profiler or targeted instrumentation; don't guess from code reading.
4. **Name the dominant constraint** (CPU, allocation, IO, algorithmic complexity, startup). Optimizing anything else is waste.
5. **Define invariants before changing code**: exact outputs that must not change, ordering guarantees, error behavior. Capture them as executable checks (golden output diff, equivalence test).
6. **Smallest high-value change.** Prototype if the approach is uncertain; implement directly if proven. One change at a time — stacked changes make attribution impossible.
7. **Measure after**, same harness, same environment. Report absolute and relative change with variance.
8. **Lock it in**: add a regression/equivalence test so the win survives future edits; where feasible, an automated performance check with a tolerance.
9. **Determinism check**: outputs byte-identical across runs, or every difference approved and documented.
10. **Record** the conclusion and the rejected alternatives with one-line reasons, in the location the project keeps such notes.

## Decision benchmarks

Read [references/decision-benchmark.md](references/decision-benchmark.md) before designing a comparative benchmark. Non-negotiables: fresh process per candidate/scenario where state can contaminate, pinned environment/config, scratch data (never destructive use of real data), explicit GO/NO-GO/INCONCLUSIVE thresholds set *before* running, and every outcome mapped to a valid next action.

## Boundaries

- No profiling → no optimizing, unless the defect is already proven (e.g. a known O(n²) with failing-scale evidence).
- When you cannot run the workload yourself, do not quote estimated speedups as results. Hand the user the exact baseline, after-measurement, and equivalence commands, and mark the win unproven until they report back. Before and after must run on the same input and machine: timing the old code on a sample and the new code on the full data compares nothing.
- "Clean code" refactors without a measured or evidenced benefit are out of scope — decline or route to `improve`.
- Do not broaden into a general audit; report incidental findings in one line and move on.
- Simplicity/maintainability improvements qualify only with observable evidence (deleted code counts, dependency removal, measured build/CI time).
