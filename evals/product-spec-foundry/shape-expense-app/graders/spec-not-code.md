---
type: llm
---

PASS if all of these hold in the reply:
- It names non-goals or out-of-scope items, and puts at least the receipt OCR, bank sync, and AI categorization ideas there (or explicitly defers them) instead of specifying them as features.
- The core journeys (add an expense, see balances, settle up) each have acceptance criteria a tester could check by observing the app.
- It states how money is stored or computed (for example integer cents or a fixed-scale decimal) and how an equal split that does not divide evenly is handled (for example €10.00 split three ways), so the parts add back up to the total.
- It does not contain implementation code (no application source code, components, or route handlers). A data model table or a short API outline is fine.

FAIL if any of these is missing, or if it writes the app instead of the spec.
