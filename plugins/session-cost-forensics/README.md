# session-cost-forensics

Analyze local Codex, Pi, and Claude Code session logs for cost, token waste, cache misses, retries, duplicate sessions, and orchestration inefficiency. Privacy: reads local session stores (`~/.codex`, `~/.pi/agent/sessions`, `~/.claude/projects`) read-only and makes no network requests.

## Requirements

- Node.js >= 22.19

## Install

### Pi

```bash
# pinned
pi install npm:@ayagmar/session-cost-forensics@0.1.0

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
