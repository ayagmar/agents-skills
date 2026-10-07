# commit

Create Conventional Commits without mixing or losing user work. Privacy: instruction-only skill; runs local `git` commands through your agent and makes no network requests of its own. It never pushes unless you ask.

## Requirements

- None beyond a coding agent that supports Agent Skills

## Install

### Pi

```bash
# pinned
pi install npm:@ayagmar/commit@0.1.0

# unpinned
pi install npm:@ayagmar/commit

# remove
pi remove npm:@ayagmar/commit
```

### skills CLI

```bash
npx skills add ayagmar/agents-skills --skill commit --agent pi
```

Other agent ids: `claude-code`, `codex`, `cursor`.

### Claude Code

```bash
claude plugin marketplace add ayagmar/agents-skills
claude plugin install commit@ayagmar-skills
```

### Codex

```bash
codex plugin marketplace add ayagmar/agents-skills
codex plugin add commit@ayagmar-skills
```

## Usage

Prompt example: "Use commit to ...". The agent loads the skill when your request matches its description. See [SKILL.md](skills/commit/SKILL.md) for the full workflow.

## Credits

Based on commit from https://github.com/mitsuhiko/agent-stuff (Apache-2.0), modified by Abdeslam Yassine Agmar.

## Links

- Security policy: https://github.com/ayagmar/agents-skills/blob/main/SECURITY.md
- Changelog: https://github.com/ayagmar/agents-skills/blob/main/plugins/commit/CHANGELOG.md
