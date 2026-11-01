# @ayagmar/session-cost-forensics

## 1.0.0

### Major Changes

- dfb035f: Take per-session tokens, cost, and models from `llm-usage session --json` (the latest llm-usage-metrics release, run through `npx`) instead of the script's own parsers. Codex and Claude Code sessions now get estimated costs from LiteLLM prices; Pi keeps its logged cost.
  
  Breaking: the skill now makes network requests, the `npx` package download and the LiteLLM price refresh (skip the latter with the new `--pricing-offline`). The JSON output gains `session_id`, `other_paths`, `subagent_transcripts`, `usage_events`, `tokens.reasoning`, `cost_incomplete`, and `usage_source`, and drops `bytes` and `assistant_messages`. Claude Code subagent tokens are always counted in their parent session; `--include-subagents` now adds the subagent transcripts' prompts, compactions, and tool results to that session instead of listing them as separate sessions. `--since`/`--until` count only the usage inside the window. Claude Code compactions are now counted. The script now honors `CODEX_HOME` and a comma-separated `CLAUDE_CONFIG_DIR`, reads the same directories llm-usage-metrics reads by default (adding `~/.omp/agent/sessions` and Claude `transcripts/`), and passes them to it explicitly, so the llm-usage-metrics `sourceDirs` config no longer applies. Older top-level Claude `agent-<id>.jsonl` transcripts count as subagents. Forked Claude subagents, Pi forks, and Codex forks no longer re-count the parent entries they copy, and Pi sessions without a recorded id match llm-usage-metrics by file name. Compressed Codex rollouts (`.jsonl.zst`) are read too, and a rollout present both compressed and plain counts once.

## 0.1.2

### Patch Changes

- 14acea2: Say that the script path is relative to the skill directory, and require full session paths for every finding.

## 0.1.1

### Patch Changes

- f950cf7: README: give every skill a real prompt example and pin installs with `@<version>`.

## 0.1.0

### Minor Changes

- bf2fe90: Initial release.
