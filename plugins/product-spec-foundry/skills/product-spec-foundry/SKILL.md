---
name: product-spec-foundry
description: Turn a product idea, loose PRD, partial spec, or inconsistent pre-implementation repository into an implementation-ready specification package (vision, vocabulary, journeys, domain boundaries, decisions, operational policies, API contract, aligned issues). Use for pre-build product shaping, spec consolidation, or a pre-implementation readiness pass. Not for auditing existing code (use improve), release certification, or implementing features.
license: MIT
---

# Product Spec Foundry

Convert loose product intent into a specification package another agent or team can build from. Work only on documents, contracts, and trackers — never implement the product unless explicitly asked.

## Modes

Pick the one mode matching the request; do not run the full pipeline for a small ask.

- `discover` — extract the real user need, constraints, and non-goals from conversation and existing material.
- `specify` — produce or tighten the spec package: principles, vocabulary, actors, journeys, acceptance criteria, domain boundaries, decisions, operational policies, API contract.
- `align` — reconcile docs, OpenAPI, epics/issues, dependencies, and release ordering so all surfaces state the same product.
- `readiness` — a lightweight pre-build consistency pass with a GO / FIX-FIRST verdict. This is not release certification (that is `release-readiness-certification`).

## Workflow (specify mode, staged)

Apply only stages the product needs; skipping a stage is a recorded decision, not an omission.

1. **Need first.** State who the user is, the actual problem, and explicit non-goals. Challenge accidental overengineering: strip capabilities the user did not ask for (e.g. "private tracker" does not need broker features). Confirm scope corrections with the user.
2. **Product definition.** Principles, shared vocabulary (one term per concept, used everywhere), actors, primary journeys, and observable acceptance criteria per journey.
3. **Domain shape** (when the product has meaningful internal structure): bounded contexts, data ownership, domain events, cross-context flows. Do not force DDD onto a single-context tool.
4. **Decisions.** Record material architectural choices with the rejected alternatives and why. Use the repo's ADR convention if one exists; otherwise a single decisions file is enough.
5. **Operational policies** — only those the domain makes load-bearing. See [references/operational-policies.md](references/operational-policies.md) for the checklist (money/decimal semantics, rounding, timezones and recurrence, correction vs immutability, provenance, auth boundaries). A product without money needs no financial policy.
6. **API contract** where applicable: resource model, error shape, pagination, versioning stance. Keep OpenAPI the single source of truth if it exists; if contract generation exists, run the generator/consumer to prove the contract is valid.
7. **Tracker alignment** (`align`): every epic/issue restates current spec language, dependencies are explicit, stale issue bodies are rewritten rather than annotated, and one epic links its stories. Only touch GitHub with explicit user authorization.

## Readiness pass

Check, with file/issue evidence for each failure:

- every journey has acceptance criteria; every criterion is observable
- vocabulary is consistent across docs, OpenAPI, and issues
- no contradiction between spec, contract, and tracker
- operational policies exist for every load-bearing concern and are internally consistent
- decisions cover the contested choices; no undecided blocker remains
- generators/consumers of the contract run clean

Verdict: **GO** or **FIX-FIRST** with an ordered fix list. Do not start implementation on the back of the verdict unless asked.

## Boundaries

- Do not force ADRs, OpenAPI, GitHub issues, DDD, or financial policies on products that do not need them.
- Do not turn a small feature request into a governance exercise — a feature needs acceptance criteria, not a spec package.
- Do not implement, commit, or push without explicit instruction.
- Do not restate the user's problem back in the spec through the lens of one conversation; verify the product framing with the user before freezing it.
