# Skill evals

Each plugin has an eval suite in `evals/<plugin>/`, run with [`claude plugin eval`](https://code.claude.com/docs/en/plugin-evals). The suites live here, not inside `plugins/<plugin>/`, because Codex copies the whole plugin directory on install and the evals would ship to users.

An eval answers two questions about a skill: does Claude load it when it should (and not when it shouldn't), and does the output follow the skill once it does.

## Run them

Free, no credentials, part of `npm run validate`:

```bash
node scripts/run-evals.mjs --check
```

This checks that every plugin has a suite with at least one positive and one near-miss negative trigger case, that every case loads its own plugin, and that `claude plugin eval` can parse every case. A $0 cost ceiling stops the run before the first model call.

Paid, on your Claude Code login, and always started by hand:

```bash
node scripts/run-evals.mjs --plugin commit --runs 1     # one suite, quick
node scripts/run-evals.mjs --changed origin/main        # suites whose plugin or evals changed
node scripts/run-evals.mjs --plugin commit --baseline   # also run without the skill and report the delta
```

Defaults: agent model `claude-sonnet-5-5`, judge `claude-haiku-5-5` (override with `--model`, `--judge-model`, or `EVAL_MODEL` and `EVAL_JUDGE_MODEL`), 3 runs per case, `--threshold 0.8`, concurrency 2. Results and an HTML report go to `eval-results/<plugin>/`, which is gitignored. A suite fails when any case scores below the threshold. A full run of every suite costs a few dollars; `--max-cost-usd` sets a hard ceiling.

## Case layout

```
evals/<plugin>/<case>/
├── prompt.md          # frontmatter, then the user prompt
└── graders/
    ├── skill-fired.md # one grader per file
    └── ...
```

Every `prompt.md` loads its plugin by relative path, because the suites sit outside the plugin directory:

```markdown
---
plugins: ["../../../plugins/commit"]
description: What this case proves, in one sentence.
tags: [trigger, output]
allowed_tools: [Read, Glob, Grep, Skill]
---

The prompt, written the way a user would type it.
```

To test routing between two of these skills, list both plugins and assert which one fires.

Cases run in an empty temporary workspace with read-only tools. Put the material the skill needs (a diff, a plan, a draft, `git status` output) in the prompt itself. The runner passes neither `--scaffold` nor `--allow-tools`, so cases must not depend on Bash or on fixture scripts.

## What each suite needs

- **Positive trigger cases.** Prompts where the skill should fire, phrased as a user would phrase them, without naming the skill. The ones worth having are where the link to the skill isn't obvious from keywords alone. Grade with:

  ```markdown
  ---
  type: tool_used
  tool: Skill
  input_match: '"skill"\s*:\s*"(?:[\w-]+:)?commit"'
  ---
  ```

- **Near-miss negative cases.** Prompts that share words or a domain with the skill but need something else, often a sibling skill named in the description's "Not for" clause. An unrelated prompt tests nothing. Grade with the same grader plus `min: 0`, `max: 0`, and `arm: both`.

- **Output checks** on the positive cases: the rules a user relies on and that the model gets wrong without the skill. Prefer `regex` (free and deterministic) for mechanical rules. Use one `llm` grader per case for judgment, written as concrete `PASS if` / `FAIL if` conditions, never "the output is good".

Before adding a grader, name the regression it would catch. Drop graders that pass both with and without the skill (`--baseline` shows this): they only inflate the score.

## Changing a skill

1. Run its suite before the change with `--runs 3` and note the scores.
2. Change the skill.
3. Run it again. A case that drops below the threshold is a regression. Fix the skill, not the grader, unless the grader was wrong.
4. When a real failure turns up in use, add it as a case.
