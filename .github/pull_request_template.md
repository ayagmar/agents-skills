## Summary

<!-- What changed and why. Link any related issue. -->

## Checklist

- [ ] Changeset added for every changed `plugins/*` workspace (`npx changeset`), or not needed — reason: <!-- e.g. docs-only change with no user-facing behavior change -->
- [ ] `npm run validate` passes locally
- [ ] Privacy review: no real session logs, transcripts, credentials, or customer data were added (including as test fixtures)
- [ ] Script changes reviewed: no network calls, read-only access to session stores, no hard-coded user paths
- [ ] Package contents inspected: `node scripts/validate.mjs packages`
