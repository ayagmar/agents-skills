# Waste Patterns and What They Mean

Interpretation checklist for `session_cost_report.mjs` output. Each pattern: signal → likely cause → recommended change.

## Repeated context / prompt payloads
Signal: high `repeated_prompt_count` within a session, or the same fingerprint across sessions.
Cause: retry loops, "continue" spam after context loss, or re-pasting the same brief to multiple agents.
Change: persist the brief in a file agents read; fix the failure that forced the retry instead of re-prompting.

## Cache misses
Signal: `cache_hit_ratio` well below ~0.9 on a long session (short sessions are legitimately low).
Cause: system-prompt/tool-list churn between turns, alternating models, or long idle gaps expiring cache TTLs.
Change: stable tool/skill configuration within a session; batch related asks instead of scattered returns to an idle session.

## Idle windows / resume degradation
Signal: large gap between `first_ts`/`last_ts` relative to message count; compactions right after resume.
Cause: resumed sessions replay and re-cache the full history at fresh-input prices.
Change: start a new session with a compact handoff instead of resuming very old ones.

## Duplicate sessions
Signal: `cross_session_duplicate_prompts` — the same opening prompt in 2+ sessions.
Cause: abandoned-and-restarted work, or the same job run through multiple providers.
Change: one canonical session per job; write a handoff before switching providers.

## Executor/reviewer noise
Signal (Claude): `--include-subagents` adds many sessions with high tokens per subagent for small diffs; (any): many tool_results with few user messages.
Cause: over-delegation — dispatching trivial work to fresh-context agents that must re-read the repo each time.
Change: delegate only work that amortizes its context-load cost; batch small tasks into one executor.

## Expensive model misuse
Signal: `models` shows a top-tier model on sessions dominated by mechanical tool loops.
Cause: default model used for work a cheaper tier handles.
Change: tier tasks; keep the expensive model for judgment, not for grep loops.

## Excessively broad task prompts
Signal: single session with very high total tokens, many compactions, and mixed unrelated goals in its prompts.
Cause: "do everything" sessions that grow until compaction thrashes.
Change: split by goal; each compaction on a 100M+ token session is paid re-reading.

## Unnecessary tool/documentation loading
Signal: high fresh-input on turns without matching user asks (visible in per-session token composition); many skill/doc attachments in the transcript structure.
Cause: eager loading of references, giant AGENTS.md files, or skills triggering for requests they don't serve.
Change: progressive disclosure — trim always-loaded instructions; tighten skill descriptions.

## Cost concentration by phase
Signal: a few sessions dominate the window's tokens/cost.
Change: inspect those specific sessions before generalizing; one 100M-token session outweighs every other optimization.
