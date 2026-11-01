---
plugins: ["../../../plugins/draft-coach", "../../../plugins/x-post-craft"]
description: Routing near-miss. Announcing a published blog post on X loads x-post-craft, not draft-coach, even though a blog post is involved.
tags: [trigger, negative, routing]
allowed_tools: [Read, Glob, Grep, Skill]
---

I just published my post about losing six hours of orders because I backed up SQLite with cp while the app was running, and how `.backup` fixed it. Link: https://example.com/blog/sqlite-wal-backups. Write me a tweet for it.
