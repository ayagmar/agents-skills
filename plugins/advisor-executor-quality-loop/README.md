# advisor-executor-quality-loop

Orchestrate multi-task work with delegated execution and independent verification. Privacy: instruction-only skill; ships no scripts, reads no session stores, and makes no network requests of its own.

## Requirements

- None beyond a coding agent that supports Agent Skills

## Install

### Pi

```bash
# pinned (versions are listed in the changelog linked below)
pi install npm:@ayagmar/advisor-executor-quality-loop@<version>

# unpinned
pi install npm:@ayagmar/advisor-executor-quality-loop

# remove
pi remove npm:@ayagmar/advisor-executor-quality-loop
```

### skills CLI

```bash
npx skills add ayagmar/agents-skills --skill advisor-executor-quality-loop --agent pi
```

Other agent ids: `claude-code`, `codex`, `cursor`.

### Claude Code

```bash
claude plugin marketplace add ayagmar/agents-skills
claude plugin install advisor-executor-quality-loop@ayagmar-skills
```

### Codex

```bash
codex plugin marketplace add ayagmar/agents-skills
codex plugin add advisor-executor-quality-loop@ayagmar-skills
```

## Usage

Prompt example: "Split this migration into tasks, hand them to subagents, and check each one yourself before calling it done." The agent loads the skill when your request matches its description. See [SKILL.md](skills/advisor-executor-quality-loop/SKILL.md) for the full workflow.

## Links

- Security policy: https://github.com/ayagmar/agents-skills/blob/main/SECURITY.md
- Changelog: https://github.com/ayagmar/agents-skills/blob/main/plugins/advisor-executor-quality-loop/CHANGELOG.md
