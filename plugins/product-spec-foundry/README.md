# product-spec-foundry

Turn a product idea or loose PRD into an implementation-ready spec package. Privacy: instruction-only skill; ships no scripts, reads no session stores, and makes no network requests of its own.

## Requirements

- None beyond a coding agent that supports Agent Skills

## Install

### Pi

```bash
# pinned (versions are listed in the changelog linked below)
pi install npm:@ayagmar/product-spec-foundry@<version>

# unpinned
pi install npm:@ayagmar/product-spec-foundry

# remove
pi remove npm:@ayagmar/product-spec-foundry
```

### skills CLI

```bash
npx skills add ayagmar/agents-skills --skill product-spec-foundry --agent pi
```

Other agent ids: `claude-code`, `codex`, `cursor`.

### Claude Code

```bash
claude plugin marketplace add ayagmar/agents-skills
claude plugin install product-spec-foundry@ayagmar-skills
```

### Codex

```bash
codex plugin marketplace add ayagmar/agents-skills
codex plugin add product-spec-foundry@ayagmar-skills
```

## Usage

Prompt example: "Turn this PRD draft into an implementation-ready spec with user journeys, acceptance criteria, and an API contract." The agent loads the skill when your request matches its description. See [SKILL.md](skills/product-spec-foundry/SKILL.md) for the full workflow.

## Links

- Security policy: https://github.com/ayagmar/agents-skills/blob/main/SECURITY.md
- Changelog: https://github.com/ayagmar/agents-skills/blob/main/plugins/product-spec-foundry/CHANGELOG.md
