# Design: git-ref-based plan/review tracking (working title)

Status: prototype. The write path, the three gate views in each person's language (result rows sorted attention first, and chosen by step kind), per-repo areas, links between intents, and `setup` exist; diff extraction and reconciliation don't yet. Last updated 2026-10-01.

Labels: **Decided** = confirmed. **Leaning** = suggested, not confirmed. Open items are in [open-questions.md](open-questions.md).

## Where we left off (2026-10-01)

- **Done, accepted at one result gate each on 2026-09-29, merged into `main`:**
  - #1 "Settle the intent and plan structure and gate views" (plan rev `fa0a214`)
  - #5 "Retire the exercise scenarios" (plan rev `113e2f3`)
  - #3 "Reconcile with the ldd design" (plan rev `8015f6a`). Plan refs now live under `refs/ldd/plans/`; the ldd docs were merged here and deleted.
  - #2 "Settle the review-side design" (plan rev `919968b`). Q1: observed-only also covers your own agents' work, with a reason ([reviews.md](reviews.md)). Q3: team approvals live in `refs/ldd`, mirrored to the forge ([gates/approvals.md](gates/approvals.md)). Q4: result views list every row, attention first ([rendering/layouts.md](rendering/layouts.md)); `inferred` is now on every result-gate item. Q2 moved to #4, since only local mode is in scope for now.
  - #6 "Change categories that fit every kind" (plan rev `d18c12c`). New `instructions` and `docs` kinds with `expect.sections` ([model/steps.md](model/steps.md)); one category list with per-kind subsets that the result gate enforces ([model/categories.md](model/categories.md)); prose results as table rows and diff blocks ([rendering/layouts.md](rendering/layouts.md)). Earlier results keep their labels.
  - #8 "Korean support (i18n)" (plan rev `9be8b53`). Gate views render in each person's language from `git config --global ldd.lang`, with `en` and `ko` catalogs; authored text follows the request's language, and approvals count in any language ([rendering/languages.md](rendering/languages.md)). Unplanned catalog parameters in .1 were attached to it at the result gate.
  - #9 "로더 형식의 다국어 지원" (plan rev `28184c5`, with the discovered 9.5). The loader is the default delivery, drawing with the renderer `publish` pushes to this repo's `renderer` branch, in each person's language ([rendering/README.md](rendering/README.md)). The plan gate was approved at `5649909`; the user had 9.5 built without a prior approval and accepted it at the result gate.
- **Open, waiting upstream: #10 "MCP Apps로 게이트 뷰 전달"**, until Claude Code renders MCP App UIs ([anthropics/claude-code#95149](https://github.com/anthropics/claude-code/issues/95149)).
- **Open, waiting on intent approval: #7 "Result-gate rows that say what changed, how, and in what kind of thing"** (intent rev `518e37f`). It began as a stub from #6's result gate, where 12 of 30 rows were uncategorized. On 2026-10-01 the user folded in a second pain: rows name a symbol but not what kind of thing it is or what changed inside it. Q1–Q6 are answered: one intent; kinds in the language's own terms, and prose rows name a kind of text; each row shows kind, where it lives, category, and before/after; one level down, with the body diff behind a closed toggle; a kind swap shows both kinds under `type changed`; the per-kind lists widen.
- **Areas:** this repo's list is `cli`, `model`, `store`, `render`, `skills`, `docs` (user, 2026-09-29). Re-tagging #1-#8 with it moved their intent revs, so the approvals on #1, #2, #3, #5, and #6 are stale; they stay that way, since that work is done (user, 2026-09-29).
- **Public:** the repo was made public on 2026-09-29 by the agent, on the user's explicit instruction, for #9's loader (#9 Q2). #9's Q5 answer says the human would switch it; decided answers can't be edited, so this line records who did. jsDelivr serves the repo at a commit SHA.
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
