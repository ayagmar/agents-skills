# Contributing

## Adding a new skill/plugin

Every skill is its own plugin workspace under `plugins/<name>/` with exactly this layout (enforced by `node scripts/check-layout.mjs`):

```
plugins/<name>/
├── package.json                 # npm package @ayagmar/<name>
├── plugin.json                  # portable Agent Plugins manifest
├── .claude-plugin/
│   └── plugin.json              # Claude plugin manifest (only file allowed in .claude-plugin/)
├── skills/
│   └── <name>/                  # exactly one skill dir, name == plugin dir name
│       └── SKILL.md             # plus scripts/, references/, agents/, etc.
├── README.md
├── LICENSE
└── CHANGELOG.md                 # added by the first Changeset release, not by hand
```

`plugins/<name>/` may only contain the entries above (`package.json`, `plugin.json`, `.claude-plugin`, `skills`, `README.md`, `LICENSE`, `CHANGELOG.md`) — Codex copies the whole plugin directory when it installs, so anything else ships to users. `plugins/<name>/skills/` must contain exactly one directory, and its name must equal `<name>`: Pi loads every loose file with a `description` frontmatter as an extra skill, and one plugin exposing more than one skill is a layout error.

`plugins/<name>/plugin.json` must declare `"$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json"` exactly — without it, Codex silently falls back to `.claude-plugin/plugin.json` and drift goes unnoticed. Both `plugin.json` and `.claude-plugin/plugin.json` must have `name` equal to `<name>`, and `package.json`'s `name` must be `@ayagmar/<name>`.

### Register the plugin in both catalogs

Add one entry to each marketplace catalog, keyed by the plugin directory name:

- `.claude-plugin/marketplace.json`: entry `source` must be exactly `./plugins/<name>` and must not declare a `version` (the plugin manifest owns the version).
- `.agents/plugins/marketplace.json`: entry `source` must be exactly `{"source": "local", "path": "./plugins/<name>"}`.

Each plugin must appear exactly once in each catalog; `scripts/check-layout.mjs` fails otherwise.

## SKILL.md frontmatter rules

Agent Skills frontmatter only allows these keys: `name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools`. Any other key (including `version` or `metadata.version`) is rejected — `package.json` is the only source of truth for version numbers. Provider-only metadata (for example something Codex-specific) goes in `agents/openai.yaml` next to the skill, not in the frontmatter.

- `name`: lowercase letters, digits, and single hyphens only (`^[a-z0-9]+(-[a-z0-9]+)*$`), at most 64 characters, and equal to the skill directory name.
- `description`: non-empty, at most 1024 characters.
- `compatibility`: optional, at most 500 characters.

## Link rules

`node scripts/check-relative-links.mjs` enforces that relative Markdown links don't escape their file's boundary:

- Links inside `plugins/<name>/skills/<name>/**` (i.e. `SKILL.md` and anything under it) must resolve inside that skill directory, because installers copy only that directory.
- Links inside other files under `plugins/<name>/` (its `README.md`, etc.) must resolve inside the plugin directory.
- Links everywhere else must resolve inside the repository root.

## One skill per plugin, one npm package per Pi package

Each plugin ships exactly one skill and exactly one npm package. This keeps Pi's `pi install npm:@ayagmar/<name>` installing exactly one skill (Pi has no way to install a subset of an npm package or a subdirectory of a Git repo), keeps Claude/Codex plugin installs mapping 1:1 to a skill, and keeps `skills CLI --skill <name>` unambiguous. Do not add a second skill directory to an existing plugin, and do not put unrelated functionality behind flags in one skill's scripts.

## Changesets

Add a changeset for every changed workspace:

```bash
npx changeset
```

Select every `plugins/*` package you changed and pick the bump per the contract:

- **Patch**: documentation, ranking correction, parsing bug, redaction improvement, or a compatible packaging fix.
- **Minor**: new CLI option, provider support, new documented output field, or a compatible workflow capability.
- **Major**: skill rename, removed/renamed option, incompatible output/schema, changed privacy boundary, or a new required external service.

Every changed workspace must be listed in a Changeset. One Changeset file may list several packages when they share the same change (for example the initial release); unrelated changes get separate Changesets.

## Local validation

Before opening a PR, run:

```bash
npm ci && npm run validate
```

This runs, in order: `layout`, `versions`, `links`, `syntax`, `schema`, `skills`, `claude`, `packages`, `smoke`. You can run a single stage with `node scripts/validate.mjs <stage>`. The `skills` stage needs [GitHub CLI](https://cli.github.com) >= 2.90 on `PATH` for `gh skill publish --dry-run`.

## No real session data

Never commit or reference, even as a test fixture:

- Real session logs or transcripts from `~/.codex`, `~/.pi/agent/sessions`, or `~/.claude/projects`.
- Credentials, API keys, tokens, or auth files.
- Customer data of any kind.
- Copied excerpts of private transcripts, even redacted ones.

Use synthetic, hand-written fixtures for tests and examples instead.

## Review expectations for executable scripts

Scripts under `plugins/<name>/skills/<name>/scripts/` are reviewed with extra care because they run with the installing user's permissions:

- Prefer Node.js built-ins; a new runtime dependency needs a clear justification in the PR description.
- No network access: scripts read local session stores only. `rg -n "fetch\(|https?:|node:(net|http|https|dgram|tls)"` over the script should return nothing.
- Read-only access to session stores — scripts must not write to `~/.codex`, `~/.pi/agent/sessions`, or `~/.claude/projects`.
- No hard-coded user paths (`/home/<user>`, `/Users/<user>`, `C:\Users\...`); resolve paths from `os.homedir()` or environment variables.
- `node --check <script>` must be clean; this is also enforced by the `syntax` validate stage.
