---
name: commit
description: "Read this skill before making git commits — single commits, logical commit stacks over mixed working trees, and plan-traceable commit sequences."
license: Apache-2.0
---

# Commit

Create Conventional Commits without losing or mixing user work. Never push, tag, release, or publish unless explicitly authorized; committing is the entire scope.

## Format

`<type>(<scope>): <summary>`

- `type` REQUIRED: `feat`, `fix`, `docs`, `refactor`, `chore`, `test`, `perf`.
- `scope` OPTIONAL: short noun for the affected area.
- `summary` REQUIRED: imperative, ≤ 72 chars, no trailing period.
- Body OPTIONAL (blank line, short paragraphs). No breaking-change footers. No sign-offs and no generated-by/co-author trailers.

## Preservation protocol (always, before anything else)

1. Run `git status` and read the full tree state: staged, unstaged, untracked.
2. Everything you did not create in this task is user work — never revert, delete, stash without instruction, or absorb it into your commits.
3. Never use broad staging (`git add -A`, `git add .`, `git commit -a`) when the tree contains anything unrelated to the requested commit.
4. Stage explicitly by path (`git add <file>...`; `git add -p` for mixed files).
5. Honor forbidden paths: anything the user, repo instructions, or an executing plan excludes — plus obvious never-commit content (secrets, `.env`, local scratch files, build artifacts not already tracked). When such a file is staged or requested, stop and ask.
6. Inspect `git diff --cached` before every `git commit`. If it contains anything outside the intended change, unstage and re-curate.
7. If it is unclear whether a file belongs, ask instead of guessing.

## Mode: single commit

1. Infer file paths/globs and instructions from the request; arguments limit scope.
2. Review `git status` and `git diff` (limited to specified files if given). Optionally `git log -n 50 --pretty=format:%s` for local scope conventions.
3. Stage only the intended files, inspect the staged diff, commit.

## Mode: logical commit stack

For a mixed working tree that should become several reviewable commits:

1. Map every changed hunk to a logical unit. Natural boundaries, when separating them improves reviewability: generated code, contracts/schemas, tests, implementation, configuration, docs. Do not over-split — a behavior change and the test that proves it belong together; never split changes that only compile/pass jointly.
2. Order commits dependency-aware: each commit should build and pass on its own (contracts before implementations that use them, helpers before callers).
3. For each planned commit: stage exactly its files/hunks, inspect `git diff --cached`, run the focused verification the commit affects (targeted tests/build) when the repo makes that feasible, then commit.
4. Leave everything not selected exactly as found — including dirty and untracked files.
5. Report the stack: each commit subject with the files it contains.

## Mode: plan-traceable commits

When executing a plan that defines commit boundaries:

1. Use the plan's commit messages/boundaries verbatim unless they violate this skill's rules — then stop and report the conflict instead of improvising.
2. Reference the plan step in the commit body when the plan or user asks for traceability (e.g. `Plan: 003 step 2`).
3. Commit at the plan's boundaries, running each boundary's verification first; do not batch multiple plan steps into one commit or split one step without cause.
