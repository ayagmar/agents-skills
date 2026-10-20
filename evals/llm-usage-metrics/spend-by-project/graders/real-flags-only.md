---
type: llm
---
PASS if all of these hold in the final answer:
- It tells the user to run the `llm-usage` CLI (or `npx llm-usage-metrics`), not a different tool.
- The per-repo answer comes from `llm-usage projects`, `llm-usage session --by-repo`, or `--by-repo` on `daily`, `weekly`, or `monthly`.
- Every flag it uses exists for that command in llm-usage-metrics 0.12.1. Valid flags include `--source`, `--since`, `--until`, `--last`, `--all`, `--json`, `--markdown`, `--top`, `--by-repo`, `--by-machine`, `--repo`, `--provider`, `--model`, `--machine`, `--timezone`, `--pricing-offline`, `--cost-mode`, `--compact`, `--no-cost`, `--granularity` (projects), `--share`.
FAIL if it invents a flag such as `--month`, `--this-month`, `--group-by`, `--by-project`, or `--format json`, or tells the user to run a different usage tool.
