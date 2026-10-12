---
plugins: ["../../../plugins/commit"]
description: Implicit trigger. Asked for a commit message from staged-diff text, the agent loads the skill and writes a Conventional Commit subject with no trailers.
tags: [trigger, output]
allowed_tools: [Read, Glob, Grep, Skill]
---

ok this is staged, can you write the commit msg? i'll paste it into git myself

```
$ git diff --cached --stat
 src/api/users.ts        | 6 +++---
 src/routes/profile.ts   | 2 +-
 src/routes/settings.ts  | 2 +-
 src/jobs/digest.ts      | 2 +-
 4 files changed, 6 insertions(+), 6 deletions(-)
```

All I did was rename `getUser` to `fetchUser` and update the three call sites. No behavior change.
