# session-memory-search

Search local Codex, Pi, and Claude Code session history to recover prior decisions, feedback, prompts, TODOs, and conversation snippets. Privacy: reads local session stores (`~/.codex`, `~/.pi/agent/sessions`, `~/.claude/projects`) read-only and makes no network requests.

## Requirements

- Node.js >= 22.19
- `rg` (ripgrep) — optional, used for faster prefiltering

## Install

### Pi

```bash
# pinned
pi install npm:@ayagmar/session-memory-search@0.1.0

# unpinned
pi install npm:@ayagmar/session-memory-search

# remove
pi remove npm:@ayagmar/session-memory-search
```

### skills CLI

```bash
npx skills add ayagmar/agents-skills --skill session-memory-search --agent pi
```

Other agent ids: `claude-code`, `codex`, `cursor`.

### Claude Code

```bash
claude plugin marketplace add ayagmar/agents-skills
claude plugin install session-memory-search@ayagmar-skills
```

### Codex

```bash
codex plugin marketplace add ayagmar/agents-skills
codex plugin add session-memory-search@ayagmar-skills
```

## Usage

Prompt example: "What did we decide about the retry policy last week? Search past sessions for it." The agent runs the bundled script itself.

Run from the installed skill directory:

```bash
node scripts/search_sessions.mjs --since 2026-09-01 --phrase "retry policy"
```

See [SKILL.md](skills/session-memory-search/SKILL.md) for the full option list.

## Links

- Security policy: https://github.com/ayagmar/agents-skills/blob/main/SECURITY.md
- Changelog: https://github.com/ayagmar/agents-skills/blob/main/plugins/session-memory-search/CHANGELOG.md
