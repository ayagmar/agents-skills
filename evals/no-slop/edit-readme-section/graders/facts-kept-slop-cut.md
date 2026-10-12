---
type: llm
---

PASS if all of these hold in the edited README section:
- It still states the retried statuses (429, 503), the limit of 5 retries, the 250 ms starting backoff, and that `FETCHQ_RETRIES=0` disables retries. `fetchq` and `FETCHQ_RETRIES=0` still appear as inline code.
- It adds no new fact (no new flags, statuses, defaults, or claims about behavior).
- None of these survive in the edited text: "not just", "crucial", "seamlessly", "Let's dive", "At the end of the day", "resilient, reliable, and scalable".

A "What changed" list or notes after the edited section are fine and are not part of the edited text; quoting the removed phrases there is fine.

FAIL if any of these is violated in the edited section itself, or if the answer returns commentary without the edited section.
