---
type: llm
---

PASS if the answer gives a not-ready verdict and identifies, each with a pointer to where it appears (spec, openapi.yaml, or issue number), at least four of these:
- Invite expiry: 7 days in the spec vs `expiresInHours` default 48 in the contract.
- Billing: "invites are free on every plan" in the spec vs the 402 invite limit and issue #14.
- Vocabulary: "Workspace" in the spec and issues vs `teams/{teamId}` in the contract.
- Journey 2 has no observable acceptance criterion, or does not say what "lose access" means.
- Issue #13 says removing a member deletes their documents, which the spec never decides.

FAIL if it says the package is ready, finds fewer than four of these, or starts implementing (writing application code) instead of reviewing.
