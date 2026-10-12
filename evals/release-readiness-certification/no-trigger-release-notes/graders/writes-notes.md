---
type: llm
---

PASS if the answer is release notes for 2.0.0 that mention the new `--delimiter` flag, the quoted-newline fix, and that Node 16 is no longer supported.
FAIL if it gives a release verdict (READY / NOT READY / go / no-go) instead of or in addition to the notes, or leaves out the Node 16 change.
