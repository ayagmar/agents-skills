# improve

Audit a codebase and implement or plan prioritized improvements. Privacy: instruction-only skill; ships no scripts, reads no session stores, and makes no network requests of its own.

## Requirements

- None beyond a coding agent that supports Agent Skills

## Install

### Pi

```bash
# pinned (versions are listed in the changelog linked below)
pi install npm:@ayagmar/improve@<version>

# unpinned
pi install npm:@ayagmar/improve

# remove
pi remove npm:@ayagmar/improve
```

### skills CLI

```bash
npx skills add ayagmar/agents-skills --skill improve --agent pi
```

Other agent ids: `claude-code`, `codex`, `cursor`.

### Claude Code

```bash
claude plugin marketplace add ayagmar/agents-skills
claude plugin install improve@ayagmar-skills
```

### Codex

```bash
codex plugin marketplace add ayagmar/agents-skills
codex plugin add improve@ayagmar-skills
```

## Usage

Prompt example: "Audit this repo and list the highest-value improvements." The agent loads the skill when your request matches its description. See [SKILL.md](skills/improve/SKILL.md) for the full workflow.

## Credits

Based on improve from https://github.com/shadcn/improve (MIT), modified by Abdeslam Yassine Agmar. Upstream version 1.2.0.

## Links

- Security policy: https://github.com/ayagmar/agents-skills/blob/main/SECURITY.md
- Changelog: https://github.com/ayagmar/agents-skills/blob/main/plugins/improve/CHANGELOG.md
