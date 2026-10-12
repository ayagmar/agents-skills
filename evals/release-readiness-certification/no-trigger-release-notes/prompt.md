---
plugins: ["../../../plugins/release-readiness-certification"]
description: Near-miss negative. Writing release notes for a release shares the vocabulary but needs no ship/no-ship verdict, so the certification skill must not load.
tags: [trigger, negative]
allowed_tools: [Read, Glob, Grep, Skill]
---

We're releasing 2.0.0 of csvkit-cli today. Turn these merged PR titles into short release notes for the GitHub release page:

- feat: add --delimiter flag (#41)
- feat!: drop Node 16 support (#44)
- fix: handle quoted newlines in fields (#45)
- chore: bump vitest to 2.1 (#46)
