# Design: git-ref-based plan/review tracking (working title)

Status: prototype. The write path, the three gate views (result rows sorted attention first), per-repo areas, links between intents, and `setup` exist; diff extraction and reconciliation don't yet. Last updated 2026-09-29.

Labels: **Decided** = confirmed. **Leaning** = suggested, not confirmed. Open items are in [open-questions.md](open-questions.md).

## Where we left off (2026-09-29)

- **Done, accepted at one result gate each on 2026-09-29, merged into `main`:**
  - #1 "Settle the intent and plan structure and gate views" (plan rev `fa0a214`)
  - #5 "Retire the exercise scenarios" (plan rev `113e2f3`)
  - #3 "Reconcile with the ldd design" (plan rev `8015f6a`). Plan refs now live under `refs/ldd/plans/`; the ldd docs were merged here and deleted.
  - #2 "Settle the review-side design" (plan rev `919968b`). Q1: observed-only also covers your own agents' work, with a reason ([reviews.md](reviews.md)). Q3: team approvals live in `refs/ldd`, mirrored to the forge ([gates/approvals.md](gates/approvals.md)). Q4: result views list every row, attention first ([rendering/layouts.md](rendering/layouts.md)); `inferred` is now on every result-gate item. Q2 moved to #4, since only local mode is in scope for now.
- **Open: #6 "Change categories that fit every kind": intent approved at `2cf7b64`, then Q4 was found while planning (prose steps name `expect.sections`, [model/steps.md](model/steps.md)), so the intent waits for re-approval at `f506611`; plan rev `45dc352` (five steps) waits after it.** Q0: new `instructions` and `docs` kinds ([model/steps.md](model/steps.md)). Q1: one shared category list with per-kind subsets ([model/categories.md](model/categories.md)). Q2: prose changes are table rows when mechanical and diff blocks when wording changes ([rendering/layouts.md](rendering/layouts.md)). Q3: #1's, #2's, #3's, and #5's results keep their labels; the categories apply from #6 on.
- **Deferred: #4 "Settle the team-phase coordinator design"** until the team phase, since only local mode is in scope for now (user, 2026-09-29). It holds team-phase questions deferred from #3, plus #2's Q2 as its Q1.
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
