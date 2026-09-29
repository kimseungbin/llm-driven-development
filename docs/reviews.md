# Reviews (decided)

## Reconciliation is computed (#3 Q5, 2026-09-29)

- An extractor lists what changed as symbols, from the commits carrying a step's `Plan-Step:` trailer.
- Reconciliation compares that list with the step's `expect`: matched, unplanned, or planned-but-missing.
- `data-shape` and `signature-change` symbol lists are fully computed. For `behavior-change`, which function bodies changed is computed; whether the behavior is right is checked by the tests named in evidence, or by the human. Invariants and rules are checked by tests or the human, and labeled as such.
- LLM judgments stay separate and labeled `inferred`. Agents never submit review items that map the diff to the intent.
- Research and decision records written while working are authored data, attached to the intent and its steps, because the diff can't show them (from the ldd design):
  - Research: `{ question, sources: { kind: code | doc | web, ref }[], findings, inferred }`
  - Decision: `{ question, options: { option, pros[], cons[] }[], chosen, why, inferred }`
  - `inferred: true` marks a record written after the fact, for example for a human's change.

## Modes

- One schema with `mode: planned | observed-only`. `planRef` is required in planned mode.
- Planned is the default. Observed-only needs an explicit flag and a recorded one-line reason.
- "Verified against plan" and "reviewed without a plan" stay separate states in every filter and rollup.
- A plan reconstructed from the diff is labeled `reconstructed` and never yields `verified`.

## Other people's changes

- Observed data comes from base..head, so authors don't need to cooperate.
- Claims are extracted from commit messages and PR text and labeled `inferred`. The review compares them against the observed diff.
- Missing `Plan-Step:` trailers are flagged as a nudge, not a gate.
