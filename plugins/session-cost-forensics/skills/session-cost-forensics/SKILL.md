---
name: session-cost-forensics
description: Analyze local Codex, Pi, and Claude Code session logs for cost, token waste, cache misses, retries, duplicate sessions, and orchestration inefficiency, and recommend workflow changes. Use when asked how much sessions cost, where tokens/context went, why usage is high, or how to make agent workflows cheaper. Not for recalling conversation content (session-memory-search) or live usage dashboards.
license: MIT
compatibility: Requires Node.js 22.19+ and npx. Reads local Codex (~/.codex), Pi (~/.pi/agent/sessions), and Claude Code (~/.claude/projects) session stores; fetches llm-usage-metrics through npx and, unless --pricing-offline, LiteLLM model prices.
---

# Session Cost Forensics

Measure where agent-session tokens, cost, and context go, then turn measurements into workflow changes. Read-only over the session stores; never modify or delete session files.

Data sources (local defaults):
- `~/.codex/sessions/`, `~/.pi/agent/sessions/`, `~/.claude/projects/` (Claude `subagents/` subdirectories hold delegated agents)
- `~/.claude/history.jsonl` (prompt index only — no usage data)

Tokens, cost, and models per session come from [llm-usage-metrics](https://github.com/ayagmar/llm-usage-metrics) (`llm-usage session --json`), which the script runs through `npx` at its latest release (`llm-usage-metrics@latest`); it stops if that release reports an unknown JSON `schemaVersion`. The script itself reads the session files only for what that report lacks: compactions, user prompts, and tool results.

## Workflow

1. Scope first: date window, provider(s), and project filter. Never aggregate the whole history when the question is about one project or week.
2. Run the aggregator (`scripts/` is relative to this skill's directory):
   ```bash
   node scripts/session_cost_report.mjs --provider all --since YYYY-MM-DD --until YYYY-MM-DD [--project SUBSTR] [--include-subagents] [--top N] [--pricing-offline] [--json]
   ```
   It reports per-session tokens (fresh input / cache read / cache write / output), cost, cache hit ratios, compaction counts, repeated identical prompts within a session (retry signal), and identical prompts across sessions (duplicate-session signal). `--since`/`--until` count only the usage inside the window. `--pricing-offline` skips the LiteLLM price download and uses cached or bundled prices. Each run asks npm for the latest llm-usage-metrics release, so it needs network access to the registry.
3. Interpret against the checklist in [references/waste-patterns.md](references/waste-patterns.md) — load it only when producing the findings, not for a raw numbers question.
4. Verify the top findings by targeted inspection of the named session files (`rg`, `sed -n`) — check the shape of the waste, not the transcript content. Quote structure and counts, not sensitive message bodies. For one session request by request, `LLM_USAGE_EVENT_STORE=0 LLM_USAGE_SKIP_UPDATE_CHECK=1 npx --yes llm-usage-metrics@latest session --id <session_id> --timeline --machine local --no-sync` lists each request with its running cost.
5. Report findings with: exact session path, date, measured numbers, whether the claim is **measured** or **inferred**, and one actionable workflow/configuration change each.

## Reading the numbers

- Cost: Pi's is the cost Pi logged; Codex and Claude Code costs are estimates from LiteLLM list prices. `~$` (or `cost_incomplete`) means some requests had no known price; `-` means none had one.
- Claude Code subagents: their tokens and cost are always counted in the parent session, because llm-usage-metrics files them under the parent's session id. `--include-subagents` adds the subagent transcripts' prompts, compactions, and tool results to the parent, lists them in `other_paths`, and counts them in `subagent_transcripts`; it cannot split tokens per subagent.
- One session can span several files (subagents, resumed or forked transcripts); `path` is the main file and `other_paths` holds the rest.
- Structure counts (compactions, prompts, tool results) cover whole files, even when the date window cuts a session in half.

## Rules

- Distinguish measured facts (token counts, logged costs, timestamps) from inference (why the waste happened).
- Mark every Codex or Claude Code dollar figure as an estimate where you quote it (for example "$96.12 estimated at list prices"), not only in a closing caveat; it is not what the user was billed, and on a subscription plan it is the API-price equivalent. Do not compare cost per token between Pi's logged costs and estimated ones as if they were the same measure.
- Cite the full session path (not shortened with `...`, so the user can open it) and timestamp for every finding, including the Pi and Codex ones.
- Never expose secrets or sensitive transcript content; the script emits only metadata, counts, and hashed prompt fingerprints — keep manual inspection to the same standard.
- This skill analyzes efficiency. For "what did we discuss/decide", use `session-memory-search` instead.
