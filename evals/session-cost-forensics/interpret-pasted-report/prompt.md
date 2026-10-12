---
plugins: ["../../../plugins/session-cost-forensics"]
description: Interpreting a pasted cost report. The agent cites session paths, labels measured numbers apart from inferred causes, and does not invent dollar costs for stores that record none.
tags: [trigger, output]
allowed_tools: [Read, Glob, Grep, Skill]
---

Here's the usage report I ran over last week's agent sessions. Where is it actually going, and what should I change in how I work? Give me a short list I can act on.

```
Sessions: 41  Total tokens: 612,480,113  Cost (where recorded): $18.42
Fresh input: 96,302,551  Cache read: 498,117,920  Output: 3,904,118  Compactions: 23

Heaviest sessions:
- [claude] 241,906,330 tok cache=0.912 compactions=14 2026-10-01 /home/me/.claude/projects/-home-me-work-billing-api/5e0c4a1d-8f2b-4c6e-a3d9-7b1f0e2c6a58.jsonl
- [codex] 88,410,227 tok cache=0.604 compactions=3 2026-10-02 /home/me/.codex/sessions/2026/10/02/rollout-2026-10-02T13-40-05-0199b7e2-1a2b-7c3d-8e4f-5a6b7c8d9e0f.jsonl
- [pi] 61,027,554 tok $11.08 cache=0.887 compactions=2 2026-10-03 /home/me/.pi/agent/sessions/--home-me-work-billing-api--/2026-10-03T08-15-22-401Z_3f9a.jsonl
- [claude] 57,300,118 tok cache=0.931 compactions=1 2026-10-03 /home/me/.claude/projects/-home-me-work-billing-api/a2d7e9b4-6c1f-4e0a-9b3d-1f8e2c7a5d60.jsonl
- [claude] 55,980,412 tok cache=0.928 compactions=1 2026-10-03 /home/me/.claude/projects/-home-me-work-billing-api/c8f3b1e6-2a9d-4f7c-8e15-6d0a4b9c3e27.jsonl

Worst cache hit ratio (>100k tokens):
- [codex] cache=0.604 88,410,227 tok /home/me/.codex/sessions/2026/10/02/rollout-2026-10-02T13-40-05-0199b7e2-1a2b-7c3d-8e4f-5a6b7c8d9e0f.jsonl

Repeated identical prompts within a session (retry/duplication signal):
- [claude] repeats=9 /home/me/.claude/projects/-home-me-work-billing-api/5e0c4a1d-8f2b-4c6e-a3d9-7b1f0e2c6a58.jsonl

Same prompt across multiple sessions (duplicate-session signal):
- fp=9b2e41c07d3a in 2 sessions (first: /home/me/.claude/projects/-home-me-work-billing-api/a2d7e9b4-6c1f-4e0a-9b3d-1f8e2c7a5d60.jsonl)
```
