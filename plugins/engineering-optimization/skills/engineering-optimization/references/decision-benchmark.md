# Decision Benchmark Design

For comparing architectures, libraries, or algorithms where the result drives a GO/NO-GO decision.

## Design checklist

1. **Question first.** One sentence: "Is candidate B at least X% better than A on metric M for workload W?" If X, M, and W are not fixed before running, the benchmark is theater.
2. **Thresholds before data.** Define GO (adopt B), NO-GO (keep A), and INCONCLUSIVE (spread overlaps threshold) numerically, in advance.
3. **Isolation.**
   - Fresh process per candidate *and* per scenario when caches, JIT state, connection pools, or memory fragmentation could contaminate results.
   - Pin environment: runtime version, CPU governor where possible, dataset snapshot, config files. Record all of it in the results.
   - Identical warmup policy per candidate; either both warm or both cold, matching the production reality being decided.
4. **Data.**
   - Scratch copies only — never run candidates destructively against real data stores.
   - Representative scale: the size where the decision matters, not where both candidates are trivially fast.
   - **Hostile opposite-value injection** where useful: seed inputs specifically shaped to favor the candidate you are biased *against*, so a win is trustworthy.
5. **Runs.** Enough repetitions to see variance; interleave candidate order (ABAB, not AABB) when the machine's thermal/cache state drifts over time.
6. **Correctness parity.** Both candidates must produce equivalent output on the benchmark workload, checked automatically. A faster wrong answer is a NO-GO.

## Outcome mapping

Every possible outcome must have a pre-agreed next action:

| Outcome | Next action |
|---|---|
| GO | Adoption plan (or implementation, if authorized) with the migration boundary named |
| NO-GO | Keep incumbent; record the evidence so the question is not relitigated |
| INCONCLUSIVE | Named follow-up: bigger workload, better isolation, or accept incumbent by default |

## Durable evidence

Persist alongside the decision record: exact commands, environment pins, raw numbers (not only summaries), threshold definitions, and the verdict. Someone re-running it in a year must be able to reproduce the setup.
