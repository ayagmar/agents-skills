# llm-usage-metrics

Teaches an agent to answer spend and usage questions about AI coding tools with the [`llm-usage`](https://github.com/ayagmar/llm-usage-metrics) CLI: cost and tokens by day, model, project, or session, estimated 5-hour plan windows, subscription value, tool-call errors, status lines, and share reports.

## What it accesses

The skill is instructions only; it ships no scripts. The commands it suggests run `llm-usage-metrics`, which:

- reads the local session logs of the coding tools it supports, without changing them;
- stores normalized usage events (no message content) in `~/.local/share/llm-usage-metrics/events.db` and caches prices under `~/.cache/llm-usage-metrics/`;
- downloads LiteLLM model prices when that cache is older than a day, unless you pass `--pricing-offline`, and is downloaded from npm when run through `npx`;
- connects over ssh only to machines you added with `llm-usage machine add`.

See the llm-usage-metrics [privacy page](https://ayagmar.github.io/llm-usage-metrics/privacy/) for the full list.

## Requirements

- Node.js 22.16+ (not 23) or 24+, with `npx` or `npm install -g llm-usage-metrics`

## Install

### Pi

```bash
# pinned (versions are listed in the changelog linked below)
pi install npm:@ayagmar/llm-usage-metrics@<version>

# unpinned
pi install npm:@ayagmar/llm-usage-metrics

# remove
pi remove npm:@ayagmar/llm-usage-metrics
```

### skills CLI

```bash
npx skills add ayagmar/agents-skills --skill llm-usage-metrics --agent pi
```

Other agent ids: `claude-code`, `codex`, `cursor`.

### Claude Code

```bash
claude plugin marketplace add ayagmar/agents-skills
claude plugin install llm-usage-metrics@ayagmar-skills
```

### Codex

```bash
codex plugin marketplace add ayagmar/agents-skills
codex plugin add llm-usage-metrics@ayagmar-skills
```

## Usage

Prompt example: "How much did I spend on Claude Code this month, and which project cost the most?" The agent picks the report, runs it with `--json`, and answers with the window and filters it used.

See [SKILL.md](skills/llm-usage-metrics/SKILL.md) for the command table.

## Links

- Security policy: https://github.com/ayagmar/agents-skills/blob/main/SECURITY.md
- Changelog: https://github.com/ayagmar/agents-skills/blob/main/plugins/llm-usage-metrics/CHANGELOG.md
