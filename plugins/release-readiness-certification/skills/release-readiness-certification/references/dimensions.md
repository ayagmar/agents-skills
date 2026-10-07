# Certification Dimensions

Assess only dimensions with a real surface in this project. For each, gather evidence yourself; record N/A with a one-line reason otherwise.

## Correctness
Full test suite green; core journeys exercised manually or via e2e; error paths return actionable failures, not stack traces; edge inputs (empty, huge, malformed) handled on public entry points.

## Architecture
Boundaries hold (no layering violations on the release path); public API surface intentional (nothing exported by accident); breaking-change stance vs previous released version stated.

## Security
No credentials in the artifact or history about to be published; dependency audit (ecosystem tool, read-only) shows no critical/high advisory reachable at runtime; injection-prone boundaries validated; produced artifact contains no local paths, tokens, or private data.

## Deterministic behavior
Same inputs → same outputs (ordering, timestamps, locale, hash iteration); builds reproducible enough for the release process; no test flakiness on the release gate.

## Tests and regression protection
Critical paths covered; the release-blocking bug class of this project has a named regression test; one command runs the whole gate.

## Performance
Representative workload measured, not guessed; no pathological case a first user hits (large file, cold start); startup/latency acceptable for the artifact type.

## UX and accessibility (user-facing surfaces only)
Primary flows friction-checked; errors human-readable; a11y basics on web surfaces (contrast, keyboard, labels); help output/usage text correct.

## Onboarding
A new user can go from discovery to first success using only the published instructions — actually walk them; prerequisites stated; failure modes of setup produce actionable messages.

## Documentation
README claims match behavior; CLI/API reference matches the shipped version; changelog covers this release; examples run as written.

## CI and supply chain
CI green on the release commit; release pipeline runs from a trusted context (no secrets exposure to untrusted PRs); provenance/signing per project policy; lockfile committed and honored.

## Package/release metadata
Name, version, license, repository, entry points, files-included list correct; a dry-run pack/publish inspected for accidental content; tag/version/changelog agree.

## Observability and recovery
Failures diagnosable from what users can send (logs, verbose flags); data-writing tools have a corruption/recovery story; update/rollback path exists.

## Maintenance and supportability
Issue templates or contact path exist for public projects; supported environment matrix stated; deprecation policy stated when APIs are public.
