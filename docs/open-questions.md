# Open questions

- Implementation language for diff extraction. TypeScript is the suggestion, since its compiler API covers data-shape extraction.
- Team-phase questions, tracked in #4 and deferred until the team phase (2026-09-29): whether intents move to a coordinator database, the coordinator's runtime, and whether reviews of others' changes reach the authors (deferred from #2 Q2, since only local mode is in scope for now, 2026-09-29).
- Where conventions are stored in the solo phase; see [conventions.md](conventions.md).
- How one decision supersedes another (raised 2026-09-28). #1 Q14 renamed a kind that Q2 had decided, and #3 Q3 renamed a ref #1 Q13 had named. Decisions can't be edited, so the link exists only in answer text. A `supersedes` field would make it visible and let views mark the earlier decision as partly overridden.
- A result-gate event: recording the human's acceptance and attachments without editing the plan, so attaching unplanned changes doesn't force a plan re-approval (raised 2026-09-29).
- Other layers (raised 2026-09-28), opinion only:
  - DB: a strong fit, since schema diffs are deterministic.
  - Infra: a good fit through structured plan output (`terraform plan -json`, `cdk diff`), but that output depends on live state, so snapshot it as evidence.
  - FE: component props fit; visual changes need screenshot evidence, which the inline widget can't show well.
