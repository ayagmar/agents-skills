---
type: regex
pattern: '(#+\s*Commit(s|\s+boundar)|(^|\n)\s*(\$\s*|[-*]\s+|\d+\.\s+)?`?git (commit|push)\b)'
flags: i
match: not_contains
---
