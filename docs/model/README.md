# Data model (decided)

- **Split by origin.**
  - Observed: a deterministic semantic diff (AST or schema based). Derived, regenerated from the new head after a rebase, never migrated.
  - Authored: plans, review decisions, human overrides, and research and decision records. Can't be regenerated, so it needs stable identity.
  - Inferred: LLM judgments, stored separately and labeled `inferred` with a confidence value.
- Reconciliation (matched / unplanned / planned-but-missing) is computed, never stored or recalled from LLM memory; see [reviews.md](../reviews.md).
- `schemaVersion` on every record from day one.
- Authored data is keyed by stable work-item ID, never by SHA. Plans store no SHA; approvals record what they saw ([staleness](../gates/approvals.md#staleness)).
- Commit trailers link commits to items, so "which commits implement X" is a query. The trailer is `Plan-Step:`, and it's the only one (#3 Q6, 2026-09-29).
- Flat typed records: `id`, `parentId`, `kind`, `payload`. Hierarchy is a view and rollups are computed.
- Rendering follows `kind`. Unknown kinds fall back to a raw diff.
- `classifiedBy: deterministic | inferred`, with human override.
- Each kind needs a payload schema, a reconciliation rule, and a renderer. Keep one rendering spec per kind in the repo.

## Details

- [intents.md](intents.md): intent fields
- [steps.md](steps.md): step format, kinds, commits
- [categories.md](categories.md): change categories and which kinds produce them
- [ids.md](ids.md): IDs, revs, areas
