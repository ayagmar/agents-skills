# @ayagmar/session-memory-search

## 0.1.3

### Patch Changes

- 14acea2: Say that the script path is relative to the skill directory, and cover picking the right session out of pasted search hits.

## 0.1.2

### Patch Changes

- 90a87d2: Fix flag parsing in `search_sessions.mjs`: options placed after the query were swallowed into the search text, so e.g. `"noctalia" --provider pi --limit 3` searched for the literal string `noctalia --provider pi --limit 3` and flags had no effect. Flags are now recognized anywhere on the command line.

## 0.1.1

### Patch Changes

- f950cf7: README: give every skill a real prompt example and pin installs with `@<version>`.

## 0.1.0

### Minor Changes

- bf2fe90: Initial release.
