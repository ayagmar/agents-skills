---
"@ayagmar/session-cost-forensics": major
---

Take per-session tokens, cost, and models from `llm-usage session --json` (the latest llm-usage-metrics release, run through `npx`) instead of the script's own parsers. Codex and Claude Code sessions now get estimated costs from LiteLLM prices; Pi keeps its logged cost.

Breaking: the skill now makes network requests, the `npx` package download and the LiteLLM price refresh (skip the latter with the new `--pricing-offline`). The JSON output gains `session_id`, `other_paths`, `subagent_transcripts`, `usage_events`, `tokens.reasoning`, `cost_incomplete`, and `usage_source`, and drops `bytes` and `assistant_messages`. Claude Code subagent tokens are always counted in their parent session; `--include-subagents` now adds the subagent transcripts' prompts, compactions, and tool results to that session instead of listing them as separate sessions. `--since`/`--until` count only the usage inside the window. Claude Code compactions are now counted.
