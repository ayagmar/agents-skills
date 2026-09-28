# Security Policy

## Supported versions

Each skill package (`@ayagmar/session-memory-search`, `@ayagmar/session-cost-forensics`) is versioned and supported independently. Only the latest release of each package receives fixes. While a package is on a `0.x` line, only the latest `0.x` minor receives fixes; there is no backport policy across `0.x` minors.

## Reporting a vulnerability

While this repository is **private**, report security issues through its issue tracker — visible only to collaborators with access to the repository.

Once the repository is public, use GitHub's private vulnerability reporting instead of a public issue: https://github.com/ayagmar/agents-skills/security/advisories/new

Do not report vulnerabilities to a public email address; none is published for this project.

## Trust model

Skills and their bundled scripts run with the installing user's own permissions — an installer (Pi, Claude Code, Codex, Cursor, or the `skills` CLI) does not sandbox skill scripts. Installing a skill means trusting its scripts to the same degree you'd trust any other code you run locally. Review a skill's `scripts/` before installing it if you don't already trust the source.

## What each skill accesses

Both skills open local session stores **read-only**:

- `~/.codex` (Codex session logs)
- `~/.pi/agent/sessions` (Pi session logs)
- `~/.claude/projects` (Claude Code session logs)

Neither skill writes to these directories. `session-memory-search` may additionally spawn a local `rg` (ripgrep) subprocess to prefilter files faster; it reads the same local paths and performs no network I/O.

## No-network guarantee

The initial versions of both skills make no network requests. This is verified as part of code review by grepping every script for network primitives:

```bash
rg -n "fetch\(|https?:|node:(net|http|https|dgram|tls)" plugins/*/skills/*/scripts
```

An empty result is required before a release.

## What maintainers verify before release

Every release must pass `npm run validate`, which runs:

- `layout` — plugin directory structure, one skill per plugin, exact catalog coverage.
- `versions` — manifest versions match `package.json` versions.
- `links` — relative Markdown links resolve inside their allowed boundary.
- `syntax` — `node --check` on every bundled script.
- `schema` — portable plugin manifests validate against the Agent Plugins JSON Schema.
- `skills` — `gh skill publish --dry-run` (requires GitHub CLI >= 2.90).
- `claude` — `claude plugin validate --strict` against the repo root and each plugin.
- `packages` — each workspace's `npm pack --dry-run` tarball is checked against an exact allowlist of expected files, scanned for sensitive-file patterns (`.env`, credentials, private keys, logs, `node_modules`, etc.) and hard-coded user paths (`/home/<user>`, `/Users/<user>`, `C:\Users\...`).
- `smoke` — install smoke tests run against isolated `HOME`/config directories.

Once the repository is public, published npm artifacts additionally carry npm provenance and a matching Git tag / GitHub release, per the [version and release contract](README.md#versioning-and-compatibility).
