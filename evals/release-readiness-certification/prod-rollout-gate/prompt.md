---
plugins: ["../../../plugins/release-readiness-certification"]
description: Implicit trigger for a deploy gate. The agent issues exactly one of the three verdicts and treats an unevidenced claim as unverified instead of as evidence.
tags: [trigger, output]
allowed_tools: [Read, Glob, Grep, Skill]
---

Platform team is asking whether billing-api 4.3.0 can go to production on Monday, and they want a clear answer they can file. What I can give you:

```
$ make ci
lint ............ ok
typecheck ....... ok
unit (1,204) .... ok
integration (88)  ok
migrations dry-run: 2 pending, both additive (new nullable column invoices.tax_region, new index)
```

- Rollback runbook: `docs/runbooks/rollback.md`, last exercised on 4.2.0 three weeks ago.
- Release notes for 4.3.0 are written and match the merged PRs.
- Known issue, measured on staging: first request after a cold start takes ~2.8s (p50 steady state 120ms). Product has signed off on shipping with it.
- The tech lead says "we load-tested this last week, it's fine". I don't have the results.
