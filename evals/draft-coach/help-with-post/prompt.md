---
plugins: ["../../../plugins/draft-coach"]
description: Trigger without the word review. A loose request for help with a post in a Hugo site loads the skill.
tags: [trigger]
allowed_tools: [Read, Glob, Grep, Skill]
---

can you help me with this post? content/notes/why-i-left-kubernetes.md in my hugo site. it feels flat and I don't know why.

```markdown
---
title: "Why I left Kubernetes"
date: 2026-10-30
tags: ["kubernetes", "ops"]
draft: true
---

For three years I ran my side projects on a k3s cluster. Last month I moved all of them to two VMs with systemd units and Caddy.

The cluster cost me about four hours a month in upgrades and certificate problems. The VMs have cost me twenty minutes so far.

I don't miss it.
```
