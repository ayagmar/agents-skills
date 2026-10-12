---
name: summarize
description: "Convert a URL or local document (PDF, DOCX, PPTX, XLSX, HTML, etc.) to Markdown with `uvx markitdown`, and optionally summarize it with a focus prompt. Use whenever the user shares a link or a document file and wants its content read, reviewed, searched, quoted, or summarized, even if they only paste the link and ask a question about what is in it (a PDF report, a Word spec, a slide deck, a web page). Not for text already pasted into the chat or for explaining a topic from general knowledge."
license: Apache-2.0
compatibility: Requires Node.js and uvx (markitdown). The optional summary step runs the pi CLI. Fetches URLs.
---

Turn “things” (URLs, PDFs, Word docs, PowerPoints, HTML pages, text files, etc.) into **Markdown** so they can be inspected/quoted/processed like normal text.

`markitdown` can fetch URLs by itself; this skill mainly wraps it to make saving + summarizing convenient.

## Quick usage

`to-markdown.mjs` sits at the root of this skill's directory. Paths below are relative to that directory; when running from elsewhere, prefix the skill directory's path.

### Convert a URL or file to Markdown

```bash
uvx markitdown <url-or-path>
```

To write Markdown to a temp file (prints the path) use the wrapper:

```bash
node to-markdown.mjs <url-or-path> --tmp
```

Write Markdown to a specific file:

```bash
node to-markdown.mjs <url-or-path> --out <file>.md
```

### Convert + summarize (pass context!)

Summaries are only useful when you provide **what you want extracted** and the **audience/purpose**.

```bash
node to-markdown.mjs <url-or-path> --summary --prompt "Summarize focusing on X, for audience Y. Extract Z."
```

Or:

```bash
node to-markdown.mjs <url-or-path> --summary --prompt "Focus on security implications and action items."
```

This will:
1) convert to Markdown via `uvx markitdown`
2) always write the full Markdown to a temp `.md` file and print its path as a final "Hint" line, so you can open/inspect the full content
3) run `pi --model openai-codex/gpt-6-luna:medium` (no-tools, no-session) to summarize using your extra prompt
