# adversarial-plan-approval

Review, challenge, or approve an implementation plan before work starts. Privacy: instruction-only skill; ships no scripts, reads no session stores, and makes no network requests of its own.

## Requirements

- None beyond a coding agent that supports Agent Skills

## Install

### Pi

```bash
# pinned
pi install npm:@ayagmar/adversarial-plan-approval@0.1.0

# unpinned
pi install npm:@ayagmar/adversarial-plan-approval

# remove
pi remove npm:@ayagmar/adversarial-plan-approval
```

### skills CLI

```bash
npx skills add ayagmar/agents-skills --skill adversarial-plan-approval --agent pi
```

Other agent ids: `claude-code`, `codex`, `cursor`.

### Claude Code

```bash
claude plugin marketplace add ayagmar/agents-skills
claude plugin install adversarial-plan-approval@ayagmar-skills
```

### Codex

```bash
codex plugin marketplace add ayagmar/agents-skills
codex plugin add adversarial-plan-approval@ayagmar-skills
```

## Usage

Prompt example: "Use adversarial-plan-approval to ...". The agent loads the skill when your request matches its description. See [SKILL.md](skills/adversarial-plan-approval/SKILL.md) for the full workflow.

## Links

- Security policy: https://github.com/ayagmar/agents-skills/blob/main/SECURITY.md
- Changelog: https://github.com/ayagmar/agents-skills/blob/main/plugins/adversarial-plan-approval/CHANGELOG.md
