---
plugins: ["../../../plugins/draft-coach", "../../../plugins/no-slop"]
description: Routing and output. With no-slop also installed, asking whether a blog post file is ready to publish loads draft-coach, which owns drafts in a site repo, and the reply is a coaching report with a verdict, not a rewrite. Tools are read-only here, so this tests what the reply says, not whether the file was changed.
tags: [trigger, routing, output]
allowed_tools: [Read, Glob, Grep, Skill]
---

is this post ready? it's posts/2026-11-01-rate-limiting.md in our eleventy blog, going out tomorrow.

```markdown
---
title: Rate limiting our public API
summary: We added per-key token buckets to the public API.
tags: [api, redis]
---

Last week one customer's retry loop sent 40,000 requests a minute to /v2/search and slowed it down for everyone.

We now give each API key a token bucket in Redis: 600 requests a minute, bursts up to 100. Clients over the limit get a 429 with a Retry-After header.

Since the change, p99 latency on /v2/search is back under 200 ms.
```
