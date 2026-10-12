---
plugins: ["../../../plugins/engineering-optimization"]
description: Implicit trigger. Asked to get a slow job back under a time budget, the agent pairs the fix with a before/after measurement and an equivalence check, and names the behavior the rewrite must preserve.
tags: [trigger, output]
allowed_tools: [Read, Glob, Grep, Skill]
---

The nightly revenue report used to finish in about 3 minutes. Since we onboarded the big wholesale accounts it takes 25, and it has to be done before 6am. Can you get it back under 5? Here's the core of it:

```python
def build_report(orders, customers):
    rows = []
    for o in orders:                      # ~2M orders
        c = next(c for c in customers if c.id == o.customer_id)   # ~400k customers
        rows.append((c.region, c.name, o.total))
    rows.sort(key=lambda r: (r[0], r[1]))
    return rows
```

`customers` comes from a CRM export, and I'm honestly not sure the ids in it are unique.
