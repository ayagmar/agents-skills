# Operational Policy Checklist

Load only in `specify` or `readiness` mode when the domain touches these concerns. Each applicable policy must be written down once, in one owning document, and referenced elsewhere.

## Money and decimals

- Storage type and precision (e.g. integer minor units vs fixed-scale decimal), and the single conversion boundary.
- Currency handling: single vs multi-currency, quote direction for exchange rates, and where rates come from.
- Fee ordering relative to conversions and totals.
- Expected value ranges and overflow stance.

## Rounding

- One named rounding mode applied at defined points only (never mid-calculation).
- Display rounding vs stored precision explicitly separated.
- Sum-of-parts vs rounded-total reconciliation rule.

## Time, timezones, recurrence

- Storage timezone (usually UTC) and the user-local display boundary.
- Which timestamps are event-time vs record-time.
- Recurrence schema when scheduling exists: frequency, interval, weekday/month-day, local time + timezone, start/end, optional count. One shared schema — never per-feature variants.
- DST behavior for local-time recurrences.

## Correction and immutability

- Which records are append-only vs editable.
- Correction mechanism for immutable records (reversal/adjustment entries), and how history remains auditable.
- Deletion semantics: hard delete, soft delete, or forbidden — and who may trigger each.

## Provenance

- For every derived or imported value: source, retrieval time, and confidence/quality where relevant.
- Whether recalculation is possible from stored inputs (keep inputs when yes).

## Authentication and security boundaries

- Identity model: who authenticates, single vs multi-user, session vs token.
- Trust boundary of the deployment (e.g. private network) and what that does and does not excuse.
- Data classification: what is sensitive, where it may appear (logs, exports, errors).
- Authorization granularity when more than one actor exists.

## Consistency check

For each policy present: it names one owner document, uses the shared vocabulary, contradicts no other policy, and every acceptance criterion touching the concern cites it.
