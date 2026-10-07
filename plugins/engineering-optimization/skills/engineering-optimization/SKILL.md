---
name: engineering-optimization
description: Improve performance, resource use, determinism, or simplicity through measurement and proven equivalence — profiling, targeted optimization, architecture decision benchmarks, and regression verification. Use when asked to make something faster/lighter, profile a workload, benchmark competing designs, or verify an optimization. Not for speculative refactors, generic audits (improve), or feature work.
license: MIT
---

# Engineering Optimization

Optimize by measurement and equivalence, never by intuition. No change ships without a before/after measurement and proof the observable behavior is unchanged (or the drift is explicitly approved).

## Modes

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
- "Clean code" refactors without a measured or evidenced benefit are out of scope — decline or route to `improve`.
- Do not broaden into a general audit; report incidental findings in one line and move on.
- Simplicity/maintainability improvements qualify only with observable evidence (deleted code counts, dependency removal, measured build/CI time).
