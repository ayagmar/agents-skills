---
name: session-memory-search
description: Search local Codex, Pi, and Claude Code session history to recover prior decisions, feedback, prompts, TODOs, and conversation snippets from `~/.codex`, `~/.pi/agent/sessions`, and `~/.claude/projects`. Use when the user asks what was discussed or decided before, which session contained a topic, what feedback was given, or wants past sessions mined for repeated workflows or skill candidates. Not for cost/token analysis (session-cost-forensics).
license: MIT
compatibility: Requires Node.js 22.19+; ripgrep (rg) is optional for faster search. Reads local Codex (~/.codex), Pi (~/.pi/agent/sessions), and Claude Code (~/.claude/projects) session stores.
---

# Session Memory Search

Turn local session stores into a memory layer: search with the bundled script, verify the winning session by targeted reads, answer with exact paths and dates.

## Workflow

1. Start with 2–5 concrete keywords; add `--phrase` when wording/filenames are exact.
2. Run `scripts/search_sessions.mjs` with the narrowest useful filters:
   ```bash
   node scripts/search_sessions.mjs [--provider all|codex|pi|claude] \
     [--since YYYY-MM-DD] [--until YYYY-MM-DD] [--project SUBSTR] \
     [--include-subagents] [--authored] [--include-tool-output] \
     [--group-by-project] [--phrase|--any-term|--regex] \
     [--limit N] [--json] [--stats] "<query>"
   ```
   Fast by design: date pruning plus a ripgrep file prefilter narrows candidates, then JSONL is streamed with bounded line memory. Regex or non-ASCII queries fall back to a streamed full scan automatically; `--no-prefilter` forces it; `--stats` prints pruning/scan counters to stderr.
3. Verify the top hit by opening the session file with `rg`/`sed -n` on the matched region — never load a whole multi-MB session when the snippet plus a targeted read answers the question.
4. Answer with the winning session path, date, and the relevant memory. Distinguish what the user said from what the assistant concluded.

## Behavior you get from the script

- Providers: `codex` (history.jsonl + session files), `pi`, `claude` (`~/.claude/projects/`); `all` combines them. Results are identical with or without the fast path — the prefilter only skips files/lines that cannot match.
- Claude primary sessions are searched by default; `subagents/` sessions only with `--include-subagents`. `--authored` enables them automatically and links hits back to the resumable parent session.
- `--project` matches the starting project and project references inside the session, so sessions that move across repositories remain discoverable.
- Generated noise is filtered: `<command-name>`/local-command stdout/caveat blocks, system reminders, hook output.
- Raw tool-result text is not exposed by default; matching tool results contribute only an opaque hit. Use `--include-tool-output` only when the output itself is necessary. Returned snippets are always redacted for common credentials, authorization headers, JWTs, and opaque encoded values.
- Continued-session summaries ("This session is being continued…") are counted once with low weight, so continuation copies don't outrank originals.
- Session files modified in the last 15 minutes are suppressed to avoid live-session self-noise; `--include-latest` re-enables them, and `--exclude-path` hides exact files (repeatable).
- Ranking: user asks and assistant conclusions outweigh incidental output; multi-keyword coverage raises score. `--authored` prioritizes matching edit/tool actions and implementation conclusions.
- Results carry project matches, parent/subagent identity, touched paths when available, timestamps, redacted snippets, and a provider-specific resume command.
- `--group-by-project` groups output; `--json` for machine use.

## Search strategy

- `--provider X` when the user names the tool; `all` otherwise.
- `--since`/`--until` when the user gives a time frame ("last week", "in July").
- `--project` when the question is about one repo — much faster and cleaner.
- `--authored` for “which session created/changed this file or feature?” queries; prefer exact filenames, branch names, or commit hashes.
- Codex `history.jsonl` narrows candidates; the session file is the source of truth.
- For "what workflows do I repeat" / skill-candidate mining: run several thematic queries (e.g. "audit", "spec", "handoff", "port commit") with `--group-by-project --json`, look for the same shape of request appearing across projects/providers, and cite one exemplar session per recurring workflow.

## Result triage

Prefer sessions with multiple hits, snippets containing the user ask or the assistant conclusion, and exact filenames/repo/tool names. For efficiency/cost questions rather than content recall, hand off to `session-cost-forensics`.
