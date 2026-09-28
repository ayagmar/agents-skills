---
name: session-cost-forensics
description: Analyze local Codex, Pi, and Claude Code session logs for cost, token waste, cache misses, retries, duplicate sessions, and orchestration inefficiency, and recommend workflow changes. Use when asked how much sessions cost, where tokens/context went, why usage is high, or how to make agent workflows cheaper. Not for recalling conversation content (session-memory-search) or live usage dashboards.
license: MIT
compatibility: Requires Node.js 22.19+. Reads local Codex (~/.codex), Pi (~/.pi/agent/sessions), and Claude Code (~/.claude/projects) session stores.
---

# Session Cost Forensics

Measure where agent-session tokens, cost, and context go, then turn measurements into workflow changes. Read-only over the session stores; never modify or delete session files.

Data sources (local defaults):
- `~/.codex/sessions/` (cumulative `token_count` events)
- `~/.pi/agent/sessions/` (per-message usage with real cost)
- `~/.claude/projects/` (per-assistant-message usage; `subagents/` subdirectories hold delegated agents)
- `~/.claude/history.jsonl` (prompt index only — no usage data)

## Workflow

1. Scope first: date window, provider(s), and project filter. Never aggregate the whole history when the question is about one project or week.
2. Run the aggregator:
   ```bash
   node scripts/session_cost_report.mjs --provider all --since YYYY-MM-DD --until YYYY-MM-DD [--project SUBSTR] [--include-subagents] [--top N] [--json]
   ```
   It reports per-session tokens (fresh input / cache read / cache write / output), cost where the provider records it (Pi), cache hit ratios, compaction counts, repeated identical prompts within a session (retry signal), and identical prompts across sessions (duplicate-session signal). Subagent sessions are excluded unless `--include-subagents`.
3. Interpret against the checklist in [references/waste-patterns.md](references/waste-patterns.md) — load it only when producing the findings, not for a raw numbers question.
4. Verify the top findings by targeted inspection of the named session files (`rg`, `sed -n`) — check the shape of the waste, not the transcript content. Quote structure and counts, not sensitive message bodies.
5. Report findings with: exact session path, date, measured numbers, whether the claim is **measured** or **inferred**, and one actionable workflow/configuration change each.

## Rules

- Distinguish measured facts (token counts, cost fields, timestamps) from inference (why the waste happened). Label both.
- Cite exact session paths and timestamps for every finding.
- Never expose secrets or sensitive transcript content; the script emits only metadata, counts, and hashed prompt fingerprints — keep manual inspection to the same standard.
- Pi is the only store with recorded dollar cost; for Codex/Claude report tokens and, only if asked, estimate cost with clearly labeled assumed rates.
- This skill analyzes efficiency. For "what did we discuss/decide", use `session-memory-search` instead.
