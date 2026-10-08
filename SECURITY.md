# Security Policy

## Supported versions

Each package under `plugins/` (published as `@ayagmar/<name>`) is versioned and supported independently. Only the latest release of each package receives fixes. While a package is on a `0.x` line, only the latest `0.x` minor receives fixes; there is no backport policy across `0.x` minors.

## Reporting a vulnerability

Use GitHub's private vulnerability reporting instead of a public issue: https://github.com/ayagmar/agents-skills/security/advisories/new

Do not report vulnerabilities to a public email address; none is published for this project.

## Trust model

Skills and their bundled scripts run with the installing user's own permissions. No installer (Pi, Claude Code, Codex, Cursor, or the `skills` CLI) sandboxes skill scripts. Installing a skill means trusting its scripts to the same degree you'd trust any other code you run locally. Review a skill's `scripts/` before installing it if you don't already trust the source.

## What each skill accesses

The session skills (`session-memory-search` and `session-cost-forensics`) open local session stores read-only:

- `~/.codex` (Codex session logs)
- `~/.pi/agent/sessions` (Pi session logs)
- `~/.claude/projects` (Claude Code session logs)
- `~/.claude/history.jsonl` (Claude Code prompt index; named by `session-cost-forensics` as a reference source)

Neither session skill writes to these directories. `session-memory-search` may additionally spawn a local `rg` (ripgrep) subprocess to prefilter files faster; it reads the same local paths and performs no network I/O.

The scripts make no network calls. Their output goes back to the invoking agent like any other tool output, so it reaches that agent's model provider. `session-memory-search` returns redacted conversation snippets, session paths, and project names; `session-cost-forensics` returns session paths and usage metadata. Use `--project`/`--since` to keep other projects' sessions out of scope.

## Other skills

`summarize` fetches URLs you give it and runs local tools (`uvx markitdown`, and `pi` for the optional summary); its output reaches your agent's model provider. The remaining skills (`adversarial-plan-approval`, `advisor-executor-quality-loop`, `commit`, `engineering-optimization`, `implementation-plan-author`, `improve`, `product-spec-foundry`, `release-readiness-certification`) are instruction-only and ship no scripts.

## No-network guarantee

The two session skills make no network requests. This guarantee covers only those two skills. It is enforced by human review of every script change (the PR template checkbox and CODEOWNERS require it); there is no automated gate. A quick first check:

```bash
rg -n "fetch\(|https?:|node:(net|http|https|dgram|tls)" plugins/*/skills/*/scripts
```

This is a heuristic and can miss some patterns (bare `"https"`/`"net"`/`"dns"` imports, `require(...)`, `WebSocket`, spawned tools like `curl`), so it does not replace review.

## What maintainers verify before release

Every release must pass `npm run validate`, which runs:

- `layout`: plugin directory structure, one skill per plugin, exact catalog coverage.
- `versions`: manifest versions match `package.json` versions.
- `links`: relative Markdown links resolve inside their allowed boundary.
- `syntax`: `node --check` on every bundled script.
- `schema`: portable plugin manifests validate against the Agent Plugins JSON Schema.
- `skills`: `gh skill publish --dry-run` (requires GitHub CLI >= 2.90).
- `claude`: `claude plugin validate --strict` against the repo root and each plugin.
- `packages`: each workspace's `npm pack --dry-run` tarball must contain exactly `package.json`, `plugin.json`, `.claude-plugin/plugin.json`, `README.md`, `LICENSE`, and the files under that plugin's own `skills/<name>/` directory, and nothing else; every packed file is checked against a sensitive-file denylist (`.env`, JSONL/NDJSON, logs, source maps, `.npmrc`, keys, credentials, `auth.json`, caches, `node_modules`) and text files are scanned for hard-coded user paths (`/home/<user>`, `/Users/<user>`, `C:\Users\...`). Files inside the skill directory are not individually allowlisted, so review any new file added there.
- `smoke`: install smoke tests run against isolated `HOME`/config directories.
- `secret scan`: CI runs TruffleHog over pushed commits and pull requests.

Every version the release workflow publishes has npm provenance, a matching Git tag, and a GitHub release, per the [version and release contract](README.md#versioning-and-compatibility). The first publish of each new package is done once by hand; see [CONTRIBUTING.md](CONTRIBUTING.md).
