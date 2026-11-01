---
type: llm
---

PASS if the reply does all of these:
- Says the title is too long for a social card and the description does not state the post's point.
- Flags at least two tag problems against the existing tags (`SQLite` vs `sqlite`, `backup` vs `backups`, or the new `db` tag).
- Says the post's real point (copying the database with cp while it runs loses the data still in the WAL file, use `.backup`) comes too late and should open the post.
- Flags "Studies show that WAL mode is significantly faster" as a claim without a source.
- Suggests turning the "The fix" sentence into a numbered list or steps.
- Quotes at least two padded lines (for example the "fast-paced world" opener, "Let's dive in", or the conclusion) with a shorter alternative for each (recommending a cut counts as the alternative).
- Ends with a verdict that the post needs work, naming what blocks it.

FAIL if it says the post is ready to publish, rewrites the whole post or whole paragraphs in its own voice, invents numbers or facts the draft does not contain (such as a benchmark figure), or treats the missing `heroImage` as a problem or a blocker (the schema makes it optional).
