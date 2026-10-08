# engineering-optimization

Optimize by measurement: profile, benchmark, and verify equivalence. Privacy: instruction-only skill; ships no scripts, reads no session stores, and makes no network requests of its own.

## Requirements

- None beyond a coding agent that supports Agent Skills

## Install

### Pi

```bash
# pinned (versions are listed in the changelog linked below)
pi install npm:@ayagmar/engineering-optimization@<version>

# unpinned
pi install npm:@ayagmar/engineering-optimization

# remove
pi remove npm:@ayagmar/engineering-optimization
```

### skills CLI

```bash
npx skills add ayagmar/agents-skills --skill engineering-optimization --agent pi
```

Other agent ids: `claude-code`, `codex`, `cursor`.

### Claude Code

```bash
claude plugin marketplace add ayagmar/agents-skills
claude plugin install engineering-optimization@ayagmar-skills
```

### Codex

```bash
codex plugin marketplace add ayagmar/agents-skills
codex plugin add engineering-optimization@ayagmar-skills
```

## Usage

Prompt example: "Profile the CSV import and make it faster without changing its output." The agent loads the skill when your request matches its description. See [SKILL.md](skills/engineering-optimization/SKILL.md) for the full workflow.

## Links

- Security policy: https://github.com/ayagmar/agents-skills/blob/main/SECURITY.md
- Changelog: https://github.com/ayagmar/agents-skills/blob/main/plugins/engineering-optimization/CHANGELOG.md
