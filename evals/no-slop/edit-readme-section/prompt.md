---
plugins: ["../../../plugins/no-slop"]
description: Implicit Edit trigger. Asked to tighten a README section, the agent loads the skill, removes the dashes and stock phrasing, and keeps code, numbers, and commands byte for byte.
tags: [trigger, output]
allowed_tools: [Read, Glob, Grep, Skill]
---

this section of our README feels off, can you tighten it up? same content, just make it read better. I'll paste the result back in.

## Retries

Retries aren't just a nice-to-have — they're a crucial part of building robust integrations. When a request fails with a 429 or 503, `fetchq` will seamlessly retry it up to 5 times, with exponential backoff starting at 250 ms. Let's dive into how to configure it.

```bash
fetchq get https://api.example.com/v1/items --retries=5 --backoff-ms=250
```

You can also set `FETCHQ_RETRIES=0` to disable retries entirely — perfect for CI, debugging, and local development. At the end of the day, retries help you build resilient, reliable, and scalable systems.
