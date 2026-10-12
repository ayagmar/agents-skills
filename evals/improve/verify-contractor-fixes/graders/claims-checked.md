---
type: llm
---

PASS if all of these hold in the final answer:
- Claim 1 (parameterized query) is accepted as fixed, citing the `$1` placeholder change.
- Claim 2 is not accepted as fixed, because the handler still sends 200 after logging, so Stripe never gets a 500 and never retries.
- Claim 3 is not accepted as fixed, because both tests are `it.skip` with empty bodies and exercise nothing.
- The answer says only the first ticket can be closed.

FAIL if any of these is violated, or if the answer accepts the handoff note at face value.
