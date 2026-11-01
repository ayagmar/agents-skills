# draft-coach

Coach the author of a blog post or note draft in a static-site repo: check its frontmatter against the repo's own rules, rank what the body is missing, flag padded lines, and end with a publish verdict. Privacy: instruction-only skill; ships no scripts and makes no network requests. It may offer to run the repo's own dev server or build command, and only runs it if you agree.

## Requirements

- None beyond a coding agent that supports Agent Skills
- Optional: the [no-slop](https://github.com/ayagmar/agents-skills/tree/main/plugins/no-slop) skill, whose pattern list it uses for line-level findings when installed

## Install

### Pi

```bash
# pinned (versions are listed in the changelog linked below)
pi install npm:@ayagmar/draft-coach@<version>

# unpinned
pi install npm:@ayagmar/draft-coach

# remove
pi remove npm:@ayagmar/draft-coach
```

### skills CLI

```bash
npx skills add ayagmar/agents-skills --skill draft-coach --agent pi
```

Other agent ids: `claude-code`, `codex`, `cursor`.

### Claude Code

```bash
claude plugin marketplace add ayagmar/agents-skills
claude plugin install draft-coach@ayagmar-skills
```

### Codex

```bash
codex plugin marketplace add ayagmar/agents-skills
codex plugin add draft-coach@ayagmar-skills
```

## Usage

Prompt examples: "Review my draft at src/content/blog/cache-misses.md.", "Is the sqlite-backups post ready?", or "What should I add to this note?" Run it from the site's repository so it can read the content schema, the contributing guide, and your published posts.

It reports, highest impact first:

- Frontmatter checked against the repo's own schema and posts: a title that fits a 1200x630 card, a one-sentence summary, tags reused from existing posts, series or project links and cover art when the repo has them
- Gaps in the body: the point stated late, a missing example, number, command, or code, a section that should be a list or diagram, no next step for the reader, unsourced claims, and length against your other posts
- Padded or AI-sounding lines, each quoted with a shorter alternative, never a rewritten paragraph

It ends with one verdict line: "ready to publish" or "needs" and what blocks it. It can preview the page with the repo's dev server or build and try a few cover variants, when you ask. It edits the draft only when you ask for a specific change. See [SKILL.md](skills/draft-coach/SKILL.md) for the workflow.

## Links

- Security policy: https://github.com/ayagmar/agents-skills/blob/main/SECURITY.md
- Changelog: https://github.com/ayagmar/agents-skills/blob/main/plugins/draft-coach/CHANGELOG.md
