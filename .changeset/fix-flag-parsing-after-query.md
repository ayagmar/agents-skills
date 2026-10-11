---
"@ayagmar/session-memory-search": patch
---

Fix flag parsing in `search_sessions.mjs`: options placed after the query were swallowed into the search text, so e.g. `"noctalia" --provider pi --limit 3` searched for the literal string `noctalia --provider pi --limit 3` and flags had no effect. Flags are now recognized anywhere on the command line.
