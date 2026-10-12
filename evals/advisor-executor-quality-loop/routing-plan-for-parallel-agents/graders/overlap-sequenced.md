---
type: llm
---

PASS if the answer is a set of plan documents (or a program index plus plans) and it does not let the three agents edit the same files at the same time: it notices that one importer can use helpers from more than one new module (or that all three touch `src/legacy/utils.ts`), and either orders that shared work explicitly or assigns it to a single plan.
FAIL if all three plans are marked as safe to run fully in parallel while each one edits importers or `src/legacy/utils.ts`.
