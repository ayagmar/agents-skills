# no-slop

Write, edit, or audit READMEs, docs, landing pages, and other prose so it reads like a person wrote it, without AI-writing patterns. Privacy: instruction-only skill; ships no scripts and makes no network requests.

## Requirements

- None beyond a coding agent that supports Agent Skills

## Install

### Pi

```bash
# pinned (versions are listed in the changelog linked below)
pi install npm:@ayagmar/no-slop@<version>

# unpinned
pi install npm:@ayagmar/no-slop

# remove
pi remove npm:@ayagmar/no-slop
```

### skills CLI

```bash
npx skills add ayagmar/agents-skills --skill no-slop --agent pi
```

Other agent ids: `claude-code`, `codex`, `cursor`.

### Claude Code

```bash
claude plugin marketplace add ayagmar/agents-skills
claude plugin install no-slop@ayagmar-skills
```

### Codex

```bash
codex plugin marketplace add ayagmar/agents-skills
codex plugin add no-slop@ayagmar-skills
```

## Usage

Prompt examples: "Write a README for this repo.", "Tighten the copy on this landing page.", or "Does this PR description read as AI?" The agent loads the skill whenever it writes or edits prose people will read, including READMEs, docs, changelogs, PR descriptions, and commit messages, not only when you ask for an edit. See [SKILL.md](skills/no-slop/SKILL.md) for the workflow, [references/patterns.md](skills/no-slop/references/patterns.md) for the 29 patterns it removes, and [references/eval.md](skills/no-slop/references/eval.md) for the final check.

The skill has five jobs: Edit a draft, Write new prose, Detect patterns without rewriting, fix a named File, or produce text Embedded in another task.

## Credits

Adapted from [razakiau/no-slop](https://github.com/razakiau/no-slop), which merges [blader/humanizer](https://github.com/blader/humanizer) 3.1.0 and [petergyang/no-ai-slop](https://github.com/petergyang/no-ai-slop). All three are MIT; see [LICENSE](LICENSE). This version adds the Write job for READMEs, docs, and landing pages.

## Links

- Security policy: https://github.com/ayagmar/agents-skills/blob/main/SECURITY.md
- Changelog: https://github.com/ayagmar/agents-skills/blob/main/plugins/no-slop/CHANGELOG.md
