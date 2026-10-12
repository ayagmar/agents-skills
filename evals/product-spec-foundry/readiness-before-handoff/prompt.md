---
plugins: ["../../../plugins/product-spec-foundry"]
description: Readiness trigger. Before handing a pre-build spec to developers, the agent checks consistency across spec, contract, and issues, cites evidence for each failure, and returns a GO / FIX-FIRST verdict.
tags: [trigger, output]
allowed_tools: [Read, Glob, Grep, Skill]
---

We hand this to the dev team on Monday and nothing is built yet. Is it in good enough shape, or will it bite us? Here's everything we have.

**spec.md**

> Teams create Workspaces. A Workspace owner can invite members by email.
> Journey 1, Invite a member: the owner enters an email; the invitee gets a link valid for 7 days; accepting adds them as a member. Done when the invitee appears in the member list.
> Journey 2, Remove a member: the owner removes someone and they lose access.
> Invites are free on every plan.

**openapi.yaml (excerpt)**

```yaml
paths:
  /teams/{teamId}/invitations:
    post:
      requestBody:
        content:
          application/json:
            schema:
              properties:
                email: { type: string }
                expiresInHours: { type: integer, default: 48 }
      responses:
        "402": { description: Invite limit reached for plan }
```

**Issues**

- #12 Invite members to a workspace (links #13)
- #13 Removing a member deletes all their documents
- #14 Workspace billing: limit invites per plan
