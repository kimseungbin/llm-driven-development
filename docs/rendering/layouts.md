# View layouts (decided)

## Every view

- Opens by naming what it is: the badge (Intent / Plan / Result), the gate, the mode (planned / observed-only), and the decision it prepares. Decided 2026-09-28, after the first render couldn't be told apart from a plan; names follow #1 Q10.
- Every section gets a visible label. An early problem statement rendered as a bare line and wasn't recognized (user, 2026-09-28).
- Column headers are grouped by data origin (observed in code vs plan), so readers can tell authored, observed, and computed data apart.

## Intent gate and plan gate (accepted as a whole at #1's result gate, user, 2026-09-29)

- Intent gate: label; header with intent rev and areas; the request, verbatim; problem, acceptance, deferred, and non-goals; Links (relations out, and relations, follow-ups, and step dependencies in); Decided, with "Decided by <owner>"; questions, with a "found in code" tag and an owner pill; a blocked or ready line naming what it waits on; buttons.
- Plan gate: label; header with intent rev, plan rev, step count, and areas; acceptance criteria from the intent rev; only questions found while planning; steps in order with short IDs, kind, risk, dependsOn, `expect` lines, and evidence; high-risk reasons visible and the rest behind a CSS-only toggle; a blocked or ready line; buttons.

## Result gate (accepted 2026-09-28, first render of the KRW sample)

- Badge "Result", then "Result gate · planned mode · accept this step's result?"
- Header: step ID, summary, `kind`, plan revision.
- Counts: matched, unplanned, planned-but-missing, breaking.
- An "All changes / Breaking only" filter and the observed range with head SHA.
- Code kinds: Field | Before | After | Change | Plan | Impact, headed Symbol instead of Field except for `data-shape` steps (#6, 2026-09-29). Change pills are colored by category; inferred changes are marked and show their confidence.
- The step's kind picks the view: code kinds the table above, prose kinds the prose view below, `other` the raw view. A category the kind can't produce fails the render (#6).
- An invariant and evidence status line; a blocked line naming what to resolve; `sendPrompt` follow-up buttons.
- One result gate per intent renders one of these views for each step, together.
- The inline view lists every row, sorted by attention first: unplanned, missing, breaking, and inferred, then matched. A large change makes a long widget, and that cost is accepted so everything stays in one place (#2 Q4, 2026-09-29).

## Prose changes at the result gate (#6 Q2, 2026-09-29)

For `instructions`, `docs`, and `non-semantic` steps:

- Mechanical changes (moved, renamed, or a whole section added or removed) are table rows: What | Change | From | To | Plan | Why. Like code rows, each shows its category and plan match (user, #6's result gate).
- Wording changes (`content changed`, and `behavior changed` for `instructions`) are quoted: one diff code block per change, `-` lines for removed text and `+` lines for added text, with a line saying why.

## Leaning, from the ldd design

- Filters by kind and step.
- Per-kind result views: `data-shape` and `signature-change` as before/after tables; `behavior-change` as a condition → outcome table, with a flowchart when the change is mostly about flow; evidence as acceptance criteria mapped to tests, with gaps flagged both ways; `non-semantic` collapsed to one row per kind of change with counts.
