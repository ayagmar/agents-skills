---
plugins: ["../../../plugins/draft-coach"]
description: Review trigger. Asked to review a blog draft, the agent loads the skill and reports frontmatter issues against the repo's tags, the buried point, the unsourced claim, the steps that should be a list, and padded lines, ending with a "needs" verdict without rewriting the post.
tags: [trigger, output]
allowed_tools: [Read, Glob, Grep, Skill]
---

review my draft before I publish it. it's src/content/blog/sqlite-wal-backups.md in my Astro site, pasted below.

Context from the repo: the content schema requires `title`, `description`, `pubDate`, `tags`, and has an optional `heroImage`. Published posts use these tags: `sqlite`, `backups`, `self-hosting`, `rust`, `performance`. The other posts in the blog run 900 to 1,400 words.

```markdown
---
title: "Unlocking the Hidden Power of SQLite: A Deep Dive Into WAL Mode, Checkpoints, and Why It Matters for Your Backups"
description: In this post we'll explore SQLite.
pubDate: 2026-10-28
tags: [SQLite, backup, db]
---

In today's fast-paced world of software development, data is more important than ever. Backups are not just a nice-to-have, they're a critical part of any robust system.

I've been running a small shop app on a single VPS for two years. Let's dive in.

## How WAL works

WAL mode writes changes to a separate file first, then a checkpoint copies them back into the main database. Studies show that WAL mode is significantly faster for most workloads.

## The problem

My nightly backup copied app.db with cp while the app was running. When I restored it last month, the last six hours of orders were missing, because they were still sitting in app.db-wal.

## The fix

First you stop relying on cp, then you use the sqlite3 .backup command instead, then you schedule it with a systemd timer, then you check the copy with PRAGMA integrity_check, and finally you send it offsite.

## Conclusion

In conclusion, SQLite is a powerful, flexible, and reliable database. Backups matter. Happy coding!
```
