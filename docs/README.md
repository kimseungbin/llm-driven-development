# Design: git-ref-based plan/review tracking (working title)

Status: prototype. The write path, the three gate views, per-repo areas, links between intents, and `setup` exist; diff extraction and reconciliation don't yet. Last updated 2026-09-29.

Labels: **Decided** = confirmed. **Leaning** = suggested, not confirmed. Open items are in [open-questions.md](open-questions.md).

## Where we left off (2026-09-29)

- **Done, accepted at one result gate each on 2026-09-29, merged into `main`:**
  - #1 "Settle the intent and plan structure and gate views" (plan rev `fa0a214`)
  - #5 "Retire the exercise scenarios" (plan rev `113e2f3`)
  - #3 "Reconcile with the ldd design" (plan rev `8015f6a`). Plan refs now live under `refs/ldd/plans/`; the ldd docs were merged here and deleted.
- **Open: #6 "Change categories that fit every kind".** The result-gate views used data-shape's change categories and the `non-semantic` kind for changes they don't fit; #1's, #3's, and #5's results were accepted with those labels. The changes were right; #6 corrects the record. Four questions, unresolved.
- **#2 "Settle the review-side design": questions resolved, waiting for intent approval at rev `cb351f7`.** Q1: observed-only also covers your own agents' work, with a reason ([reviews.md](reviews.md)). Q3: team approvals live in `refs/ldd`, mirrored to the forge ([gates/approvals.md](gates/approvals.md)). Q4: inline result views list every row, attention first ([rendering/layouts.md](rendering/layouts.md)). Q2 moved to #4, since only local mode is in scope for now.
- **Stub:** #4 holds team-phase questions deferred from #3, plus #2's Q2 as its Q1.
- **Offered, not done:** a Claude Code permission rule that blocks the agent from running `approve`.
- **Resuming on another Mac:** clone with `gh repo clone <owner>/llm-driven-development`, run `node src/cli.ts setup` once, then `git pull --ff-only` before working and `git push` after. A clone set up before 2026-09-29 also has local `refs/plans/*` refs; delete them after fetching `refs/ldd/*`. In Claude Code, say "Read docs/README.md and continue where we left off."

## Docs

- [goals.md](goals.md): goal, constraints, the two phases, build order
- [model/](model/README.md): records, intents, steps, IDs and revs
- [gates/](gates/README.md): the three gates, questions, approvals and staleness
- [events.md](events.md): status and the write path
- [storage.md](storage.md): refs, snapshots, syncing
- [reviews.md](reviews.md): planned and observed-only review, reconciliation
- [conventions.md](conventions.md): repo rules agents follow while writing
- [rendering/](rendering/README.md): renderers, delivery, view layouts
- [team/](team/README.md): the team-phase target
- [findings/](findings/verified.md): verified findings and unverified assumptions
- [open-questions.md](open-questions.md)
