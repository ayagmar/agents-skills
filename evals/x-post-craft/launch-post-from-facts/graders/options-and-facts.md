---
type: llm
---

The user supplied only these facts: the project is csvlint-rs, an open-source CSV linter; v2 shipped today; it now streams, so it handles files bigger than RAM instead of loading everything.

PASS if all of these hold:
- The answer offers at most three post options (a thread counts as one option).
- No option invents a fact: no benchmark, speedup multiplier, file size, memory figure, star count, user count, quote, or feature the user did not state. Asking the user for such a number, or leaving a clearly marked placeholder for the user to fill, is fine. Restating what the user said (for example that v1 loaded the whole file into memory) is not an invented fact; a new claim about measured behavior, such as "flat memory use" or "constant memory", is.
- No option uses "game-changer", "supercharge", "unlock", "seamlessly", or an "It's not X, it's Y" / "not just X" contrast.

FAIL if it offers four or more options, or any option states an invented number or fact as true.
