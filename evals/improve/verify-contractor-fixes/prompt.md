---
plugins: ["../../../plugins/improve"]
description: Implicit trigger for post-remediation verification. The agent checks each claimed fix against the diff and labels it VERIFIED, PARTIAL, or NOT DONE instead of accepting the handoff note.
tags: [trigger, output]
allowed_tools: [Read, Glob, Grep, Skill]
---

The contractor's handoff note says all three issues from last month's review are fixed and I can close the tickets. Here is the note and the diff of their PR. Can I close them?

Handoff note:
> 1. SQL injection in getOrder: fixed, now parameterized.
> 2. Webhook errors were swallowed: fixed, errors are logged and Stripe gets a 500 so it retries.
> 3. No tests for the webhook handler: added.

```diff
--- a/src/orders.ts
+++ b/src/orders.ts
@@ -2,5 +2,5 @@ export async function getOrder(req, res) {
   const rows = await db.query(
-    "SELECT * FROM orders WHERE id = '" + req.params.id + "'"
+    "SELECT * FROM orders WHERE id = $1", [req.params.id]
   );
--- a/src/webhook.ts
+++ b/src/webhook.ts
@@ -3,5 +3,7 @@ export async function handleWebhook(req, res) {
   try {
     await recordPayment(req.body);
-  } catch (e) {}
+  } catch (e) {
+    logger.error({ err: e }, "recordPayment failed");
+  }
   res.sendStatus(200);
 }
--- /dev/null
+++ b/src/webhook.test.ts
@@ -0,0 +1,9 @@
+import { handleWebhook } from "./webhook";
+describe("handleWebhook", () => {
+  it.skip("returns 500 when recordPayment throws", async () => {
+    // TODO: mock recordPayment
+  });
+  it.skip("returns 200 on success", async () => {
+    // TODO
+  });
+});
```
