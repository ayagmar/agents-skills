# release-readiness-certification

Certify a release with an evidence-based READY / NOT READY verdict. Privacy: instruction-only skill; ships no scripts, reads no session stores, and makes no network requests of its own.

## Requirements

- None beyond a coding agent that supports Agent Skills

## Install

### Pi

```bash
# pinned
pi install npm:@ayagmar/release-readiness-certification@0.1.0

# unpinned
pi install npm:@ayagmar/release-readiness-certification

# remove
pi remove npm:@ayagmar/release-readiness-certification
```

### skills CLI

```bash
npx skills add ayagmar/agents-skills --skill release-readiness-certification --agent pi
```

Other agent ids: `claude-code`, `codex`, `cursor`.

### Claude Code

```bash
claude plugin marketplace add ayagmar/agents-skills
claude plugin install release-readiness-certification@ayagmar-skills
```

### Codex

```bash
codex plugin marketplace add ayagmar/agents-skills
codex plugin add release-readiness-certification@ayagmar-skills
```

## Usage

Prompt example: "Use release-readiness-certification to ...". The agent loads the skill when your request matches its description. See [SKILL.md](skills/release-readiness-certification/SKILL.md) for the full workflow.

## Links

- Security policy: https://github.com/ayagmar/agents-skills/blob/main/SECURITY.md
- Changelog: https://github.com/ayagmar/agents-skills/blob/main/plugins/release-readiness-certification/CHANGELOG.md
