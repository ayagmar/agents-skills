---
plugins: ["../../../plugins/improve", "../../../plugins/engineering-optimization"]
description: Routing near-miss. A request to make a slow endpoint faster loads engineering-optimization, not improve.
tags: [trigger, negative, routing]
allowed_tools: [Read, Glob, Grep, Skill]
---

Our `/search` endpoint's p95 went from 180ms to 1.3s after last week's release. Make it faster. This is the handler:

```ts
export async function search(req, res) {
  const products = await db.query("SELECT * FROM products");
  const q = String(req.query.q ?? "").toLowerCase();
  const hits = products.filter((p) => p.name.toLowerCase().includes(q));
  for (const hit of hits) {
    hit.reviews = await db.query("SELECT * FROM reviews WHERE product_id = $1", [hit.id]);
  }
  res.json(hits.slice(0, 20));
}
```
