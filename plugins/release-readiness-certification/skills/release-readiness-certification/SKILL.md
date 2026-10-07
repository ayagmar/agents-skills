---
name: release-readiness-certification
description: Produce a strict evidence-based release verdict (READY / READY WITH ACCEPTED RISKS / NOT READY) for a public or operational release, with severity-ranked findings, blockers, a pre-release work batch, and a deferred backlog. Use when asked to certify, score, or gate a release or publish decision. Not for general code audits (improve), pre-build spec readiness (product-spec-foundry), or implementing fixes.
license: MIT
---

# Release Readiness Certification

Certify whether this artifact should ship, based only on evidence you gathered yourself. Read-only: never fix findings, commit, tag, publish, or release unless explicitly asked afterward.

## Procedure

1. Establish what "release" means here: npm publish, tagged GitHub release, deploy, first public exposure. The bar differs; state the assumed bar.
2. Run the project's own gates first (build, full test suite, lint/typecheck, package dry-run) and record exact results. A red gate is an automatic blocker.
3. Assess only the applicable dimensions from [references/dimensions.md](references/dimensions.md) — correctness, architecture, security, determinism, tests, performance, UX/accessibility, onboarding, documentation, CI/supply-chain, package metadata, observability/recovery, maintainability. Skip dimensions with no surface (no UI → no UX dimension) and say which were skipped.
4. Verify claims, don't trust them: README promises vs actual behavior, documented commands actually run, version/changelog/tag consistency, license and metadata correctness.
5. Classify every finding by severity with evidence (`file:line`, command output):
   - **BLOCKER** — ships broken behavior, data loss, security exposure, or a legal/metadata defect.
   - **HIGH** — visible defect or risk a first user will likely hit.
   - **MEDIUM** — real but survivable for this release.
   - **LOW** — cosmetic or preference. Never promote preferences into blockers.
6. Produce the output package.

## Output

1. Findings by severity, each with evidence and one-line fix sketch.
2. Readiness assessment: a score or category per assessed dimension.
3. **Release blockers** — the exact list gating the verdict.
4. **Pre-release batch** — ordered minimal work to reach READY.
5. **Deferred backlog** — explicitly accepted-for-later items, so they are not re-audited.
6. Final verdict, exactly one:
   - `READY`
   - `READY WITH ACCEPTED RISKS` — enumerate each accepted risk; the user owns the acceptance.
   - `NOT READY` — blockers listed above.

## Boundaries

- Evidence or it is not a finding; "probably" belongs in the deferred backlog marked as unverified.
- Cosmetic preferences and refactor wishes are LOW, never blockers.
- Do not implement fixes, and never perform the release itself, in certification mode.
- For a broad improvement audit rather than a ship/no-ship decision, use `improve` instead.
