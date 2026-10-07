# summarize

Convert a URL or local document into Markdown and optionally summarize it. Privacy: fetches URLs you give it (via `markitdown`) and runs local tools (`uvx markitdown`, and `pi` for the optional summary). Converted content and summaries pass through your agent and model provider.

## Requirements

- Node.js >= 22.19
- `uvx` (from [uv](https://docs.astral.sh/uv/)) to run `markitdown`
- `pi` CLI, only for the optional summary step

## Install

### Pi

```bash
# pinned
pi install npm:@ayagmar/summarize@0.1.0

# unpinned
pi install npm:@ayagmar/summarize

# remove
pi remove npm:@ayagmar/summarize
```

### skills CLI

```bash
npx skills add ayagmar/agents-skills --skill summarize --agent pi
```

Other agent ids: `claude-code`, `codex`, `cursor`.

### Claude Code

```bash
claude plugin marketplace add ayagmar/agents-skills
claude plugin install summarize@ayagmar-skills
```

### Codex

```bash
codex plugin marketplace add ayagmar/agents-skills
codex plugin add summarize@ayagmar-skills
```

## Usage

Prompt example: "Convert https://example.com/report.pdf to Markdown and summarize it." The agent runs the bundled script itself.

Run from the installed skill directory:

```bash
node to-markdown.mjs <url-or-path> --tmp
```

See [SKILL.md](skills/summarize/SKILL.md) for the full option list.

## Credits

Based on summarize from https://github.com/mitsuhiko/agent-stuff (Apache-2.0), modified by Abdeslam Yassine Agmar.

## Links

- Security policy: https://github.com/ayagmar/agents-skills/blob/main/SECURITY.md
- Changelog: https://github.com/ayagmar/agents-skills/blob/main/plugins/summarize/CHANGELOG.md
