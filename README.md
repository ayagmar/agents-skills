# agents-skills

Versioned, cross-agent [Agent Skills](https://agentskills.io/specification) for Pi, Claude Code, Codex, and Cursor, with selective per-skill installation.

> **Status**: the `ayagmar/agents-skills` repository is currently **private** and no package has been published to npm yet. The first release will be `0.1.0` via [Changesets](https://github.com/changesets/changesets). All install commands below apply once the repository is public and the packages are published.

## What's here

Each skill lives in its own plugin workspace under `plugins/` and ships as an independent npm package, so you install only the skill you want, not the whole collection.

## Security and privacy

Both skills read local coding-agent session stores read-only (`~/.codex`, `~/.pi/agent/sessions`, `~/.claude/projects`, `~/.claude/history.jsonl`) and make **no network requests**. `session-memory-search` may shell out to a local `rg` (ripgrep) process for faster prefiltering; it does not talk to the network either.

The scripts themselves make no network calls, but their output is returned to the invoking agent like any other tool output, so it reaches that agent's model provider: `session-memory-search` returns redacted conversation snippets, session paths, and project names; `session-cost-forensics` returns session paths and usage metadata. Use `--project`/`--since` to keep other projects' sessions out of scope.

Raw session transcripts, credentials, and any other private data read by these skills must never be committed to this repository or published in a package. See [SECURITY.md](SECURITY.md) for the full trust model and reporting process.

## Skills

| Skill | npm package | Version | Runtime | Purpose |
|---|---|---|---|---|
| [session-memory-search](plugins/session-memory-search/README.md) | `@ayagmar/session-memory-search` | [![npm](https://img.shields.io/npm/v/@ayagmar/session-memory-search)](https://www.npmjs.com/package/@ayagmar/session-memory-search) | Node.js >= 22.19, `rg` optional | Search local Codex, Pi, and Claude Code session history to recover prior decisions, feedback, prompts, TODOs, and conversation snippets. |
| [session-cost-forensics](plugins/session-cost-forensics/README.md) | `@ayagmar/session-cost-forensics` | [![npm](https://img.shields.io/npm/v/@ayagmar/session-cost-forensics)](https://www.npmjs.com/package/@ayagmar/session-cost-forensics) | Node.js >= 22.19 | Analyze local Codex, Pi, and Claude Code session logs for cost, token waste, cache misses, retries, duplicate sessions, and orchestration inefficiency. |

## Install

Pick one skill and one agent. The marketplace name is `ayagmar-skills`.

### skills CLI

```bash
npx skills add ayagmar/agents-skills --skill session-memory-search --agent pi
```

Always pass `--agent`. Without it, `--yes` installs into every agent the CLI detects plus the shared `.agents/skills` directory (or every known agent directory if none is detected), and a non-interactive shell without `--yes` exits without installing. Agent ids this repository targets: `pi`, `claude-code`, `codex`, `cursor`. Pass `--agent` more than once to install for several agents at once:

```bash
npx skills add ayagmar/agents-skills --skill session-memory-search --agent pi --agent claude-code
```

Add `-g` (`--global`) to install at the user level instead of the current project:

```bash
npx skills add ayagmar/agents-skills --skill session-memory-search --agent pi -g
```

### Pi (npm)

Install an exact version directly from npm:

```bash
pi install npm:@ayagmar/session-memory-search@0.1.0
```

**Do not** `pi install` the repository root or its git URL (for example `pi install git:github.com/ayagmar/agents-skills`). The repo root has no Pi extension manifest, so Pi treats it as a broken extension and fails to start. One npm package equals one skill — always install the plugin package you want by name.

### Claude Code

```bash
claude plugin marketplace add ayagmar/agents-skills
claude plugin install session-memory-search@ayagmar-skills
```

### Codex

```bash
codex plugin marketplace add ayagmar/agents-skills
codex plugin add session-memory-search@ayagmar-skills
```

### Cursor and other `skills`-supported agents

This repository has no Cursor marketplace catalog; install for Cursor with the `skills` CLI and `--agent cursor`:

```bash
npx skills add ayagmar/agents-skills --skill session-memory-search --agent cursor
```

The same command works for any agent id the `skills` CLI supports, project- or user-scoped, and accepts multiple `--agent` flags in one run:

```bash
npx skills add ayagmar/agents-skills --skill session-memory-search --agent cursor --agent codex -g
```

## Update and uninstall

| Installer | Update | Uninstall |
|---|---|---|
| skills CLI | `npx skills update` (or `npx skills update session-memory-search`) | `npx skills remove session-memory-search` (add `-g` if you installed with `-g`) |
| Pi | Pinned: `pi install npm:@ayagmar/session-memory-search@<new-version>`. Unpinned (`pi install npm:@ayagmar/session-memory-search`): `pi update npm:@ayagmar/session-memory-search` | `pi remove npm:@ayagmar/session-memory-search` (the `npm:` prefix is required — `pi remove @ayagmar/session-memory-search` is parsed as a local path and fails) |
| Claude Code | `claude plugin marketplace update ayagmar-skills`, then `claude plugin update session-memory-search@ayagmar-skills` | `claude plugin uninstall session-memory-search@ayagmar-skills`, then `claude plugin marketplace remove ayagmar-skills` if you no longer need the marketplace |
| Codex | `codex plugin marketplace upgrade ayagmar-skills`, then re-run `codex plugin add session-memory-search@ayagmar-skills` to pick up a new version | `codex plugin remove session-memory-search@ayagmar-skills`, then `codex plugin marketplace remove ayagmar-skills` if you no longer need the marketplace |

## Versioning and compatibility

Each skill package is versioned independently with SemVer:

- **Patch**: documentation, ranking correction, parsing bug, redaction improvement, or a compatible packaging fix.
- **Minor**: new CLI option, provider support, new documented output field, or a compatible workflow capability.
- **Major**: skill rename, removed/renamed option, incompatible output/schema, changed privacy boundary, or a new required external service.

Every changed workspace is covered by a [Changeset](https://github.com/changesets/changesets), and every version published by the release workflow has npm provenance and a matching Git tag / GitHub release (the first publish of each package is a one-time manual bootstrap — see [CONTRIBUTING.md](CONTRIBUTING.md)).

How each installer tracks versions:

- Claude and Codex plugin manifest versions (`plugin.json`) identify the installed component version and follow the npm package version.
- Both marketplace catalogs (`.claude-plugin/marketplace.json`, `.agents/plugins/marketplace.json`) follow the repository's default branch — installing "latest" from a marketplace means "latest on the default branch", not necessarily the newest npm release.
- The `skills` CLI installs from Git and tracks source revisions through its own lock file — `skills-lock.json` in the project; `.skill-lock.json` under `$XDG_STATE_HOME/skills/` or `~/.agents/` for `-g` installs. It is not the npm version authority. Use the Pi npm installer when you need to pin an exact release.

## Development

```bash
npm ci && npm run validate
```

Use Node 24 (`.nvmrc`); the pinned dev tooling installs only on Node ^22.20, 24, or >=26 (`engine-strict`).

`validate` runs nine stages in order: `layout`, `versions`, `links`, `syntax`, `schema`, `skills`, `claude`, `packages`, `smoke`. Run a single stage with `node scripts/validate.mjs <stage>`. The `skills` stage requires [GitHub CLI](https://cli.github.com) >= 2.90 on `PATH` (`gh skill publish --dry-run`); every other host CLI comes pinned from `devDependencies`. All smoke installs run against throwaway `HOME`/config directories, never your real ones.

Repository layout:

```
agents-skills/
├── plugins/          # one directory per plugin, one skill per plugin
├── schemas/          # vendored Agent Plugins JSON Schema (schema stage)
├── scripts/          # validation, sync, and smoke-install tooling
├── .claude-plugin/    # Claude marketplace catalog
├── .agents/           # Codex marketplace catalog
└── .github/           # PR template, CODEOWNERS, workflows
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to add or change a skill, and [SECURITY.md](SECURITY.md) for the trust model and how to report a vulnerability.
