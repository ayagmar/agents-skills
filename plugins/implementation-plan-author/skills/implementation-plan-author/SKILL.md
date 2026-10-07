---
name: implementation-plan-author
description: Author self-contained implementation plans, dependency-aware multi-plan programs, or compact handoffs that a fresh agent can execute without conversational memory. Use when the user asks for a plan, program, or handoff for known work. Not for auditing to discover work (use improve), reviewing plans (use adversarial-plan-approval), or when the user wants immediate implementation.
license: MIT
---

# Implementation Plan Author

Write plans for an executor with zero context: it has not seen this conversation or any prior analysis. If the user asked for immediate implementation and planning adds nothing, say so and do not write a plan.

## Outputs

- **Single plan** — one unit of work, one file.
- **Program** — multiple plans with an index recording execution order and dependencies. Detect overlapping file scopes across plans and sequence conflicting work explicitly; two plans touching the same file must never be marked parallel-safe.
- **Handoff** — a compact resume document for work already in flight: what is done (verified, not claimed), what remains, live state, next action.

Templates for all three are in [references/plan-templates.md](references/plan-templates.md) — read it before writing the first file.

## Authoring procedure

1. Read repository instructions and inspect the live code the plan touches. Every current-state claim in a plan must come from your own reads, not memory or prior reports.
2. Pin the baseline: record the commit (or another observable baseline) the plan was written against, plus a drift check the executor runs first.
3. Confirm verification commands actually exist — run the discovery (not the mutation) yourself: the test runner, lint, typecheck, build commands the plan will cite. A plan citing a nonexistent command is broken.
4. Fill only the applicable sections of the plan contract; omit sections that do not apply rather than padding them.
5. Reject vague done criteria in your own draft: every criterion must be a command with an expected result or an observable file/behavior state — never "works correctly".
6. Specify the *what* and the boundaries; do not prescribe implementation internals (exact private code shape) unless a specific shape is load-bearing.
7. Give every plan STOP conditions specific to its real risks, and make sure no two conditions contradict each other.
8. Include commit boundaries only when the user requested commits.

## Quality gate before delivering

- Could a competent agent that has never seen this repo execute it with only the plan file and the repo?
- Is every verification a command + expected result?
- Are in-scope and out-of-scope files explicit?
- Are dependencies between plans (and on external events) stated?
- Does the drift check cover exactly the in-scope paths?
- No secrets, no session-specific paths, no facts that rot (pin them as baseline data instead).

## Boundaries

- Read-only toward the repository except for the plan files themselves.
- Never commit, push, or publish plan files unless asked.
- Do not silently expand a single-plan request into a program; propose the split and let the user decide.
