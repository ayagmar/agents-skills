# implementation-plan-author

Author self-contained implementation plans, programs, or handoffs. Privacy: instruction-only skill; ships no scripts, reads no session stores, and makes no network requests of its own.

## Requirements

- None beyond a coding agent that supports Agent Skills

## Install

### Pi

```bash
# pinned (versions are listed in the changelog linked below)
pi install npm:@ayagmar/implementation-plan-author@<version>

# unpinned
pi install npm:@ayagmar/implementation-plan-author

# remove
pi remove npm:@ayagmar/implementation-plan-author
```

### skills CLI

```bash
npx skills add ayagmar/agents-skills --skill implementation-plan-author --agent pi
```

Other agent ids: `claude-code`, `codex`, `cursor`.

### Claude Code

```bash
claude plugin marketplace add ayagmar/agents-skills
claude plugin install implementation-plan-author@ayagmar-skills
```

### Codex

```bash
codex plugin marketplace add ayagmar/agents-skills
codex plugin add implementation-plan-author@ayagmar-skills
```

## Usage

Prompt example: "Write a plan for adding rate limiting to the API that a fresh agent could execute." The agent loads the skill when your request matches its description. See [SKILL.md](skills/implementation-plan-author/SKILL.md) for the full workflow.

## Links

- Security policy: https://github.com/ayagmar/agents-skills/blob/main/SECURITY.md
- Changelog: https://github.com/ayagmar/agents-skills/blob/main/plugins/implementation-plan-author/CHANGELOG.md
