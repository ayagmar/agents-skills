---
plugins: ["../../../plugins/draft-coach"]
description: Near-miss negative. A commit message for a change that adds a draft post is a git task, so the skill must not load.
tags: [trigger, negative]
allowed_tools: [Read, Glob, Grep, Skill]
---

give me a commit message for this, just the message:

```
$ git status --short
A  src/content/blog/sqlite-wal-backups.md
M  src/content/blog/rust-cache-misses.md
$ git diff --cached --stat
 src/content/blog/rust-cache-misses.md  |  2 +-
 src/content/blog/sqlite-wal-backups.md | 41 +++++++++++++++++++++++++++
```

The new file is a draft post; in the other one I renamed the tag `perf` to `performance`.
