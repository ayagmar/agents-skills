# Closing the Loop — execute, reconcile, issues

This file covers direct execution of a plan (`execute`), keeping the plan backlog current (`reconcile`), and publishing plans as GitHub issues (`--issues`).

**Default behavior follows user intent.** `execute <plan>` means the current agent implements the plan directly in the current repository context. A separate executor, cheaper model, isolated worktree, or delegation flow is used only when the user explicitly asks for it or a higher-level harness policy requires it.

---

## `execute <plan>` — direct execution and review

### Preconditions

- Confirm the plan file exists.
- Confirm dependencies in `plans/README.md` are DONE, or execute them first in dependency order when the user requested end-to-end execution.
- Run the plan's drift check. If in-scope files changed, compare the live files with the plan and refresh the approach before editing; do not blindly follow stale excerpts.
- Read repository instructions and inspect the current working tree. Preserve unrelated user changes.

### Execute in the current context

1. Mark the plan `IN PROGRESS` when a plan index exists.
2. Follow the plan step by step, but use engineering judgment when the live repository differs. Document meaningful deviations rather than stopping for trivial drift.
3. Edit only the intended scope unless a necessary adjacent change is discovered; explain any scope expansion.
4. Run each step's verification and the repository's normal formatter, lint, typecheck, test, and build commands as applicable.
5. Read the final diff yourself. Check correctness, security, tests, scope, and consistency with repository conventions.
6. Update the plan status to `DONE` only when all done criteria pass. Use `BLOCKED (reason)` when a real external or technical blocker remains.
7. Report concrete files changed and verification results. Never claim a command passed when it was skipped or failed.

Do not commit, push, merge, publish, or create/edit GitHub issues unless the user explicitly requested it or repository instructions require it.

### Optional delegated/isolated mode

Use delegation only when the user explicitly asks for a subagent, cheaper executor, worktree isolation, or independent implementation review.

When requested:

- Create an isolated worktree or use the harness's isolation feature.
- Inline the full plan when the executor cannot see uncommitted plan files.
- Require the executor to report steps, verification, files changed, and blockers.
- Independently rerun done criteria, inspect scope, read the full diff, and audit tests.
- Do not choose a weaker/cheaper model unless the user requested one or approved that tradeoff.
- Present the isolated branch/worktree for the user's merge decision; do not merge automatically unless explicitly authorized.

### Review verdict

| Verdict | When | Action |
|---|---|---|
| **DONE** | Done criteria pass and the diff is sound | Mark DONE and report changes plus verification. |
| **REVISE** | Fixable gaps remain | Fix them directly in current-context mode; in delegated mode, return precise feedback. |
| **BLOCKED** | A real STOP condition or external blocker prevents completion | Mark BLOCKED with evidence and explain the minimum decision/action needed. |

---

## `reconcile` — keep `plans/` alive

Read `plans/README.md` and every plan file, then process statuses:

- **DONE** — spot-check that done criteria still hold on current HEAD. Mark verified in the index when useful.
- **BLOCKED** — investigate the blocker. Refresh the plan, implement the missing prerequisite when requested, or mark REJECTED with a concise rationale.
- **IN PROGRESS** — inspect the current working tree/session state and continue directly unless the user asks to stop or delegate.
- **TODO** — run the drift check. If the finding still exists, refresh stale context; if the user requested execution, implement it. If already fixed, mark REJECTED or DONE with the reason.

Finish with a short report: verified done, refreshed, rejected, blocked, and executable next.

---

## `--issues` — publish plans as GitHub issues

Modifier on a planning invocation. The flag is authorization to create issues; never create them without it or an equivalent explicit request.

1. Preflight: `gh auth status` succeeds and the repo has a GitHub remote.
2. Check repository visibility with `gh repo view --json visibility`.
3. If public, warn and get confirmation before publishing security-sensitive or private operational details.
4. Show or state the issue titles being created when interactive.
5. Create each requested issue with `gh issue create --title "<title>" --body-file <plan>`; apply labels only when they already exist or can be safely created.
6. Record issue URLs in the plan/index when those files are the source of truth.

Existing issue updates also require explicit user authorization. Never include secret values in issue bodies or comments.
