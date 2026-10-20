# session-cost-forensics

Analyze local Codex, Pi, and Claude Code session logs for cost, token waste, cache misses, retries, duplicate sessions, and orchestration inefficiency. Tokens and cost come from [llm-usage-metrics](https://github.com/ayagmar/llm-usage-metrics), which the bundled script runs through `npx`; the script adds compactions, retries, duplicate sessions, and subagent counts from the session files.

## What it accesses

- Reads the local session stores `~/.codex`, `~/.pi/agent/sessions`, and `~/.claude/projects`, without writing to them.
- Runs `npx --yes llm-usage-metrics@0.12.1`, which downloads that package from the npm registry into the npm cache on first use.
- llm-usage-metrics downloads model prices from LiteLLM on GitHub (`raw.githubusercontent.com`) when its price cache is older than a day, and caches them under `~/.cache/llm-usage-metrics/`. The request carries no session data. `--pricing-offline` skips it and uses cached or bundled prices.
- The script turns off the llm-usage-metrics event ledger and its update check, and counts only this machine, so it never syncs other machines over ssh.

## Requirements

- Node.js >= 22.19 and `npx`

## Install

### Pi

```bash
# pinned (versions are listed in the changelog linked below)
pi install npm:@ayagmar/session-cost-forensics@<version>

# unpinned
pi install npm:@ayagmar/session-cost-forensics

# remove
pi remove npm:@ayagmar/session-cost-forensics
```

### skills CLI

```bash
npx skills add ayagmar/agents-skills --skill session-cost-forensics --agent pi
```

Other agent ids: `claude-code`, `codex`, `cursor`.

### Claude Code

```bash
claude plugin marketplace add ayagmar/agents-skills
claude plugin install session-cost-forensics@ayagmar-skills
```

### Codex

```bash
codex plugin marketplace add ayagmar/agents-skills
codex plugin add session-cost-forensics@ayagmar-skills
```

## Usage

Prompt example: "Why did my agent sessions get so expensive this week? Break down token and cache usage." The agent runs the bundled script itself.

Run from the installed skill directory:

```bash
node scripts/session_cost_report.mjs --provider all --since 2026-09-01 --until 2026-09-28 --top 10
```

See [SKILL.md](skills/session-cost-forensics/SKILL.md) for the full option list.

## Links

- Security policy: https://github.com/ayagmar/agents-skills/blob/main/SECURITY.md
- Changelog: https://github.com/ayagmar/agents-skills/blob/main/plugins/session-cost-forensics/CHANGELOG.md
