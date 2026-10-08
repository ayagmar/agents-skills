# x-post-craft

Write and review X/Twitter posts and threads using the reach mechanics of X's open-source recommendation stack. Privacy: instruction-only skill; ships no scripts and makes no network requests.

## Requirements

- None beyond a coding agent that supports Agent Skills

## Install

### Pi

```bash
# pinned (versions are listed in the changelog linked below)
pi install npm:@ayagmar/x-post-craft@<version>

# unpinned
pi install npm:@ayagmar/x-post-craft

# remove
pi remove npm:@ayagmar/x-post-craft
```

### skills CLI

```bash
npx skills add ayagmar/agents-skills --skill x-post-craft --agent pi
```

Other agent ids: `claude-code`, `codex`, `cursor`.

### Claude Code

```bash
claude plugin marketplace add ayagmar/agents-skills
claude plugin install x-post-craft@ayagmar-skills
```

### Codex

```bash
codex plugin marketplace add ayagmar/agents-skills
codex plugin add x-post-craft@ayagmar-skills
```

## Usage

Prompt examples: "Rewrite this draft for X and tell me what would hurt its reach." or "Write a caption for this video." It works for any subject and tone: jokes, photos and clips, opinions, news, personal updates, or work. The agent loads the skill when your request matches its description. See [SKILL.md](skills/x-post-craft/SKILL.md) for the full workflow and [references/algorithm-notes.md](skills/x-post-craft/references/algorithm-notes.md) for the evidence behind each rule.

## What it optimizes for

- Conversation and depth signals (replies, author-engaged replies, clicks, dwell, profile visits, bookmarks, shares) over vanity likes
- Avoiding the penalties that matter most: negative feedback, spam and toxicity labels, hostile text, burst posting, and "See fewer" feedback fatigue
- Plain, specific writing that fits the kind of post, from a one-line caption to a thread

Algorithm notes are based on the open-source repository [twitter/the-algorithm](https://github.com/twitter/the-algorithm). This skill is not affiliated with or endorsed by X Corp.

## Links

- Security policy: https://github.com/ayagmar/agents-skills/blob/main/SECURITY.md
- Changelog: https://github.com/ayagmar/agents-skills/blob/main/plugins/x-post-craft/CHANGELOG.md
