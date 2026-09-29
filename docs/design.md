# Design: git-ref-based plan/review tracking (working title)

Status: prototype. The write path, the three gate views, per-repo areas, and links between intents exist; diff extraction and reconciliation don't yet. Last updated 2026-09-29.

Labels: **Decided** = confirmed constraint or conclusion. **Leaning** = suggested, not confirmed. Open items and unverified assumptions have their own sections.

## Where we left off (2026-09-29)

- **#1 "Settle the intent and plan structure and gate views" is done** (steps 1.1 to 1.7 on branch `plan/1`, not yet merged). The human accepted all seven results at one result gate on 2026-09-29, with the unplanned changes attached to their steps (plan rev `fa0a214`). The tool can't record result-gate acceptance yet; this line is the record.
- **Next, in order:**
  1. #5 "Retire the exercise scenarios": plan approved at `cc66423`, then amended (step 5.1 also syncs `refs/ldd/config`), so it needs approving again.
  2. #3 "Reconcile with the ldd design": every question decided. It moves plan refs under `refs/ldd/` and splits this record into short nested docs. Its intent and plan both wait for approval.
- **Stubs:** #2 holds the review-side questions (#3 Q8, passkey approvals in the team phase, bears on its Q3). #4 holds team-phase questions deferred from #3.
- **The scenarios are being retired by #5;** their sections below go in step 5.3.
- **Offered, not done:** a Claude Code permission rule that blocks the agent from running `approve`.
- **Resuming on another Mac:**
  - Clone the project with `gh repo clone <owner>/llm-driven-development`, then run `scripts/github.sh clone-scenarios <owner>`.
  - Run `scripts/github.sh pull` before working and `scripts/github.sh push` after.
  - In Claude Code, say "Read docs/design.md and continue where we left off."

## Goal and constraints (decided)

- Structured plan and review data lives in git refs. Widgets and other views only render it.
- No forge. Build the data layer and thin tools only: no hosting, accounts, permissions, notifications, web UI, search, or webhooks.
- One system for planning (issues) and review, so humans and LLMs can both see planned vs implemented.
- Human in the loop is mandatory.
- Now: one developer, local, agents on the same machine. Git refs are chosen so teams can come later.
- No squash merges. Data must survive rebase.
- Review defaults to plan-based: approve plan items with evidence, not line-level diff comments. Observed-only review is optional.
- Must be able to review other people's changes without them using this tool.

## Data model (decided)

- **Split by origin.**
  - Observed: a deterministic semantic diff (AST or schema based). Derived, regenerated from the new head after a rebase, never migrated.
  - Authored: plans, review decisions, human overrides. Can't be regenerated, so it needs stable identity.
  - Inferred: LLM judgments, stored separately and labeled `inferred` with a confidence value.
- Reconciliation (matched / unplanned / planned-but-missing) is computed, never stored or recalled from LLM memory.
- `schemaVersion` on every record from day one.
- Authored data is keyed by stable work-item ID, not SHA. The base is a branch or recomputed merge-base, not a stored SHA.
- Commit trailers link commits to items, so "which commits implement X" is a query. Trailer name leaning `Plan-Step:`.
- Flat typed records: `id`, `parentId`, `kind`, `payload`. Hierarchy is a view and rollups are computed.
- Rendering follows `kind`. Unknown kinds fall back to a raw diff.
- `classifiedBy: deterministic | inferred`, with human override.
- Start with 3-4 kinds plus the fallback. Each kind needs a payload schema, a reconciliation rule, and a renderer. Keep one rendering spec per kind in the repo.

## Plans (decided)

- Two layers:
  - Intent: human-authored and stable, with acceptance criteria.
  - Steps: the agent proposes them and their expectations after reading the code; the human approves, edits, or rejects them at the plan gate (#1 Q1, 2026-09-28). Each step is a single `kind` with checkable evidence and declares `dependsOn`.
- Three gates, in order (2026-09-28):
  1. Intent gate. The agent structures the human's request into an intent without reading the code (it may read other intents). The human approves it. The approval binds to the intent rev, the hash of the intent alone.
  2. Plan gate. Only now does the agent read the code and propose steps. Questions only the code can raise go into `openQuestions` with `origin: "code"`: they amend the intent and require re-approval. The approval binds to the plan rev, the hash of the intent plus the steps.
  3. Result gate: approves each step's result (named after what it approves, like the other two; renamed from "evidence gate", #1 Q10, 2026-09-28).
  - All of an intent's steps are built without stopping for approval, then one result gate covers them together. Its view explains each step: what changed, why, planned vs built, and every unplanned change with its reason (user, 2026-09-29).
  - Collapsing the first two gates for small, low-risk requests is leaning, not built.
- IDs (2026-09-28):
  - Opaque, stable, per-repo numbers. Intents are `"7"`, steps `"7.1"`, and the display form is `#7` / `#7.1`.
  - Allocation takes the highest existing number plus one (`next-id`), which is safe for a single writer. Multiple writers need a compare-and-swap on a counter ref.
  - Views name the intent once and show short step IDs inside the plan (`.1`, "after .2").
  - Scope goes in `areas`, not in the ID, because scope can change and an ID can't. Later, compare it with the areas the observed diff actually touched.
  - Each repo declares its own closed list of areas in `refs/ldd/config`, defaulting to `fe`, `be`, `db`, `infra` (#1 Q9, 2026-09-28). The setup-areas skill proposes a list from the repo's layout; the human confirms it and `set-areas` records it. A ref, not a committed file, so it works on repos you don't own (#1 Q13). The ref name follows #3 Q3 and Q13, which supersede #1 Q13's `refs/plans-config`.
- Commits and steps (2026-09-28):
  - One step is one commit by default, with fixups rebased in.
  - A step may take several commits, but only back to back.
  - A commit never serves two steps: at most one `Plan-Step:` trailer per commit. A commit check waits until there are commits to check.
- Intent fields (terms confirmed 2026-09-28):
  - `request`: the human's words, verbatim. Every other field is an interpretation, checked against it.
  - `areas`: see IDs above.
  - `problem`: why the change exists, stated as the current pain. It's not a user story.
  - `acceptance`: the testable restatement of the problem. Criteria never name stakeholders; the problem names who feels the pain (#1 Q7, 2026-09-28). Raised after soft-delete's problem statement mixed support's undo need with finance's retention need; Q7 kept criteria plain instead of citing needs.
  - `deferred`: `{ item, reason, followUp }` for work still needed later. `followUp` is the intent ID that will do it, so deferred work can't get lost; create a stub intent if none exists.
  - `nonGoals`: `{ item, reason }` for things the change will never do.
  - These two replace `outOfScope`, which mixed future work with non-goals (user, 2026-09-28). Reasons are required on both. Checking that a `followUp` intent actually exists waits for the index.
  - `relations`: `{ type, target }` typed links to other intents: `blocks`, `duplicates`, `parent`, alongside `deferred.followUp` (#1 Q5, 2026-09-28). Stored on one side only; reverse links are computed by scanning the plan refs, and the intent gate shows both directions. A prose `#8` mention is just a mention.
  - `openQuestions`: `{ id, text, proposal, origin, owner? }`, decisions the human must make. The proposal is required. `origin` is `request` or `code`. `owner` names who must answer when it isn't the approving human (#1 Q6, 2026-09-28): a decision that needs an outside party's confirmation stays an open question owned by them and blocks the intent until their answer is recorded.
  - `decisions`: `{ id, question, answer, origin, owner? }`. When the human answers a question, it moves here with their answer, and its owner comes with it. Agents never answer questions.
  - Intents and plans are JSON only, written through the CLI. Markdown may come later as an input the CLI converts (#1 Q8, 2026-09-28).
- Step format version 2 (#1 Q2, Q3, Q4, Q11, Q12, Q14, 2026-09-28):
  - One step per logical change; its `expect` lists every symbol it touches.
  - Kinds: `data-shape` (a change to a data type's fields, whatever role the type plays; renamed from `dto-shape` by Q14), `signature-change`, `behavior-change`, `feature`, `non-semantic`, and the fallback `other`. More may be added; if the list keeps growing, move to nested kinds.
  - Each kind has a fixed, validated `expect` shape. Anything machine-checked is a symbol list (`add`, `remove`, `change` from and to, `unchanged`), never prose. Rules and invariants stay prose, each marked `checkedBy: test | human`. The fallback kind has no machine check.
  - Risk is set per step, not derived from the kind. Every step carries a one-line `riskReason`; it's required for high risk. Views show high-risk reasons and hide the rest behind a toggle.
  - Step dependencies may point at another intent's step (`12.2`); validation checks that it exists.
  - Stored plans were migrated to version 2 in one step, accepting a brief window where they couldn't be read (Q12).
- Resolve questions one at a time with AskUserQuestion, never as a batch (user, 2026-09-28):
  - Go in dependency order, recording each answer as a decision before asking the next.
  - The proposal is the recommended option, with real alternatives beside it.
  - Gate views have no bulk "accept all" button, to avoid rubber-stamping.
- Settle intent-level decisions at the intent gate; never carry them to the plan gate (user, 2026-09-28):
  - The structure-request skill asks everything that doesn't need the code: product rules, edge cases, limits.
  - `plan-view` refuses to build while any `request`-origin question is still open.
  - The plan gate shows only `code`-origin questions and doesn't repeat settled decisions or the problem. It keeps the acceptance criteria, labeled with the intent rev, as the contract the steps must meet.
  - A question found during planning that didn't need the code is a miss at the intent gate. It goes back there as `request`-origin, which blocks planning.
- Authoring rules live in two project skills: `.claude/skills/structure-request` (intent, no code reading) and `.claude/skills/propose-plan` (steps, after the intent is approved). `intent-view` and `plan-view` enforce the same rules. The skills guide authors and validation rejects what slips through, following the design principle of enforcing in the write path, not in prompts (2026-09-28).
- Decompose just in time until each step is one kind with checkable evidence. Don't pre-plan everything.
- `expect` is symbolic (symbols, types, rules), not file or line based.
- Plans store nothing derived. Status, `claimed_done`, `verified`, approvals, and observed diffs live elsewhere.
- Revising a plan is a first-class event. New steps are tagged `discovered` (vs `planned`) and need approval.
- Plan-gate approval binds to a plan-revision hash.
- Unplanned observed changes go to a bucket, where the human attaches them to a step or rejects them.
- Low-risk steps (typos) may be created after the fact, classified non-semantic, and auto-accepted.

Example, stored as `KRW-12/intent.json` and `KRW-12/steps/KRW-12.1.json`:

```json
{ "schemaVersion": 1, "id": "KRW-12", "kind": "intent", "title": "Add KRW support",
  "acceptance": ["KRW amounts format with 0 decimals", "USD behavior unchanged"] }
```

```json
{ "schemaVersion": 2, "id": "KRW-12.1", "parent": "KRW-12", "kind": "data-shape", "origin": "planned",
  "summary": "Make implicit USD an explicit enum",
  "risk": "medium", "riskReason": "Money's JSON gains a required field.",
  "expect": {
    "add": [{ "symbol": "Currency", "type": "enum { USD }" }],
    "change": [{ "symbol": "Money.currency", "from": "implicit", "to": "Currency" }],
    "invariants": [{ "text": "no observable behavior change", "checkedBy": "test" }]
  },
  "evidence": ["existing tests pass unchanged", "call-site list"],
  "dependsOn": [] }
```

## Status and events (decided)

- Stored item status is one of `todo`, `in_progress`, `blocked`, `dropped`. Issue status is never stored; it's a rollup.
- "Done" takes two signals that are never merged: `claimed_done` (author or LLM) and `verified` (reconciliation matched, or a human confirmed).
- Events are append-only: each event is a commit on the intent's ref (see Storage). The commit chain is the event log, and the tip's tree is the current state.
- One write path: `node src/cli.ts`, optionally wrapped as an MCP server later. Every write is validated before it's committed. The commands (2026-09-28):
  - `create`, `edit`, and `import` are agent events. An `edit` can't change decisions.
  - `decide` records the human's answer to a question.
  - `areas` prints the repo's area list; `set-areas` records the human's confirmed list as a `configure` event on `refs/ldd/config` and names any intent the new list leaves invalid.
  - `approve` is the human's. It refuses a stale rev, open questions, or a plan whose intent isn't approved at its current rev.
  - The `Actor` trailer is asserted, not verified.
  - Delegated approval (user, 2026-09-28): the agent may run `approve` only when the human's message explicitly says to approve and names the gate and the rev. The Approve buttons send exactly that. The commit keeps `Actor: human` and adds `Via: agent`, so history tells delegated approvals apart from ones the human ran. Signed approvals would later be the human-only path.
- Search goes through a disposable local index (JSON or SQLite), gitignored and rebuilt on demand.

## Storage (decided / leaning)

- Decided: custom refs, not `refs/notes/*`. Notes attach to a single object while a diff is a range. Notes don't follow rewrites without per-clone config, and the default `concatenate` rewrite mode corrupts JSON.
- Decided (user, 2026-09-28): one ref per intent, `refs/plans/<id>`, in the product repo it plans. Intents never conflict with each other. These refs aren't fetched or pushed by default, so they need refspecs once anyone else is involved.
- Decided (user, 2026-09-28): each event commit is a snapshot plus trailers. The tree is the full validated `intent.json` plus `steps/`, and the message carries `Event`, `Actor`, and event-specific trailers (`Question`, `Gate`, `Rev`).
  - Current state is the tip's tree.
  - `git log --format='%(trailers)' refs/plans/<id>` is the audit trail, and `git diff` between two commits shows what an event changed.
  - This was chosen over an `events.jsonl` fold, because the commit chain is already append-only.
- Syncing between Macs (2026-09-28): private GitHub repos, one for the project and one per scenario, set up by `scripts/github.sh`. The scenario remotes fetch and push `refs/plans/*` without force, so if two machines both write an intent, the second push is rejected rather than overwriting the first.
- Every write is a compare-and-swap: `update-ref` with the expected old tip, and with the zero ID on create, which also makes ID allocation atomic.
- Reviews will go under `refs/reviews/<id>`.
- `refs/ldd/config` holds the repo's config (`config.json`, the area list), one commit per `configure` event, synced alongside the plans (#1 step 1.4, 2026-09-29).
- Built 2026-09-28. #1, #2, #7, and #8 were imported from the earlier plan files, each as one `import` event with a note that edits before storage existed have no history. The plan files were then deleted.

## Human-in-the-loop gate (decided)

- Agents write `proposed` events. Only a human actor can move an item to an accepted state, and agents can never write `verified`.
- This is enforced in the write path, not in prompts.
- Three gates (details under Plans):
  1. Intent gate: approve what and why, before any code is read.
  2. Plan gate: approve the decomposition before work starts.
  3. Result gate: approve each step's result.
- Tier by risk. Typo kinds can be bulk or auto-accepted when reconciliation matches. Signature refactors and breaking DTO changes need individual decisions.
- A reconciliation mismatch blocks approval. A human may override it with a recorded reason.
- Each approval stores `approvedBy`, a timestamp, the head SHA, and the observed-diff hash. It goes stale when the code changes.
- Widget clicks (`sendPrompt`) carry no identity and count as intent only. Real approvals go through the write path.
- Leaning:
  - Human approvals are SSH-signed commits verified via `gpg.ssh.allowedSignersFile`.
  - The human key stays out of ssh-agent, so approving is a separate passphrase-prompting command.
  - A `reference-transaction` hook enforces this client-side.
- Caveat: on one machine the gate guards against agent mistakes, not deliberate misuse of the key.

## Solo now vs later (decided)

- Build now (expensive to add later): append-only events, `schemaVersion`, stable IDs, typed `kind` payloads, actor type (`human` | `agent`) with the gate in the write path, evidence snapshots on approvals, and trailers as the join key.
- Defer: server-side enforcement, approver rules, concurrency handling, refspec distribution, and display in hosting UIs.
- The forge is a one-way mirror at most. No two-way sync.
- Scope test for any feature: does it help reconcile plan vs observed, or gate human approval? If not, defer it.

## Reviews (decided)

- One schema with `mode: planned | observed-only`. `planRef` is required in planned mode.
- Planned is the default. Observed-only needs an explicit flag and a recorded one-line reason.
- "Verified against plan" and "reviewed without a plan" stay separate states in every filter and rollup.
- A plan reconstructed from the diff is labeled `reconstructed` and never yields `verified`.
- Reviewing others' changes:
  - Observed data comes from base..head, so authors don't need to cooperate.
  - Claims are extracted from commit messages and PR text and labeled `inferred`. The review compares those claims against the observed diff.
- Missing `Plan-Step:` trailers are flagged as a nudge, not a gate.

## Rendering (decided)

- The widget is one renderer over ref data, alongside a markdown/terminal and static-HTML fallback for the CLI. Writes never go through a widget.
- Renderers are deterministic code in the repo, one per `kind`. Claude never hand-writes widget markup for records. User requirement, 2026-09-28.
  - Pipeline: refs → reconciliation → view model (JSON) → per-kind renderer → widget, markdown, or static HTML.
  - Why: if Claude writes the markup, its counts and flags are Claude's claims rather than computed output, and each render costs thousands of output tokens.
  - Each renderer is a pure TypeScript function that runs in both Node and the browser, so the delivery mechanism can change without rewriting it.
- An inline view in chat is preferred over a separate browser-pane view (user, 2026-09-28).
- How rendered output reaches the widget (2026-09-28):
  - Now: (a), the CLI's widget HTML passed through verbatim. Renderers change often during design, and (a) always shows the working copy with no publish step.
  - Target: (b), the CDN loader, once renderers stop changing often. Add a `publish` script when switching. Keep (a) for renderer development.
  - Revisit (c), MCP Apps, when [anthropics/claude-code#95149](https://github.com/anthropics/claude-code/issues/95149) lands. It would beat (b), since no data would pass through Claude.
  - Not chosen: (d) browser pane, which is a separate view, and (e) Artifact, which uploads data.
  - Options:
    - (a) The CLI emits the full widget HTML and Claude passes it through verbatim.
    - (b) The renderer script is served from an allowlisted CDN and Claude passes only the view-model JSON.
    - (c) An MCP App tool returns the UI directly.
    - (d) The CLI writes a static HTML file that opens in the desktop browser pane.
    - (e) The CLI writes the file and it's published as a private Artifact by path.
- Every view opens by naming what it is: the badge (Intent / Plan / Result), the gate (intent gate / plan gate / result gate), the mode (planned / observed-only), and the decision it prepares. Decided 2026-09-28, after the first render couldn't be told apart from a plan; badge and gate names follow #1 Q10.
- Every section of a view gets a visible label. Unlabeled text confuses readers; ORD-7's problem statement rendered as a bare line (user, 2026-09-28).
- Group column headers by data origin (observed in code vs plan), so readers can tell authored, observed, and computed data apart.
- Result-gate view layout, accepted 2026-09-28 (first render of KRW-12.1 against the `Money` DTO):
  - Badge "Result", then the label "Result gate · planned mode · accept this step's result?"
  - Header: step ID, summary, `kind`, plan revision.
  - Counts: matched, unplanned, planned-but-missing, breaking.
  - An "All changes / Breaking only" filter and the observed range with head SHA.
  - Table: Field | Before | After | Change | Plan | Impact. Change pills are colored by type, and inferred changes show their confidence.
  - An invariant/evidence status line.
  - When reconciliation doesn't match, a blocked-approval line naming what to resolve.
  - `sendPrompt` follow-up buttons.
- Intent-gate and plan-gate view layouts, accepted as a whole at #1's result gate after seeing them on #3 and #5 (user, 2026-09-29):
  - Intent gate:
    - Label, then the header with intent rev and areas.
    - The request, verbatim.
    - Problem, acceptance, deferred, and non-goals.
    - Links: relations out, and relations, follow-ups, and step dependencies in.
    - Decided: the settled answers, with "Decided by <owner>" when someone else answered.
    - Questions, with a "found in code" tag on code-origin ones and an owner pill on owned ones.
    - A blocked or ready line naming what it waits on, then buttons.
  - Plan gate:
    - Label, then the header with intent rev, plan rev, step count, and areas.
    - Acceptance criteria (from the intent rev).
    - Only questions found while planning.
    - Steps in order, with short IDs, kind, risk, dependsOn, `expect` lines, and evidence.
    - A blocked or ready line, then buttons.

## Verified findings

- 2026-09-28: `show_widget` inline visuals render in the Claude desktop Code tab, including dark mode.
- 2026-09-28: `show_widget` takes markup inline as a tool argument, not a file path. Anything it shows passes through Claude's output tokens.
- Widget scripts can load only from cdnjs, esm.sh, jsdelivr, and unpkg.
- 2026-09-28: Claude Code doesn't render MCP App (`ui://`) UIs, in either the Code tab or the CLI. See the open issue [anthropics/claude-code#95149](https://github.com/anthropics/claude-code/issues/95149). Regular Claude chat does render them (reported, not checked here).
- 2026-09-28: the Artifact tool publishes a local HTML file by path, so a CLI-generated page can be shown without Claude retyping it.
- 2026-09-28: the renderer works through delivery options (a) and (d). Code is in `src/render/`; run `node src/cli.ts render <view.json> --format widget|page`.
  - (a) The CLI's widget fragment, passed through unchanged, renders inline in the Code tab. It's about 6.6 KB for 4 rows and grows with the row count.
  - (d) The browser pane opens the local `file://` page and the CSS-only filter works there.
  - (b) The CDN loader renders in the Code tab widget, so the widget sandbox allows ES module imports from jsDelivr.
    - Tested with a temporary public repo, `kimseungbin/llmdd-renderer` pinned at `9b58b68`. Deleted on 2026-09-28 (confirmed). jsDelivr still serves its cached copy of the pinned SHA, which contains renderer code only. Recreate a repo when switching to (b).
    - To publish: `node scripts/build-browser.ts`, copy `dist/render` into a public repo, commit, push, and pass `--cdn https://cdn.jsdelivr.net/gh/<owner>/<repo>@<sha>` with `--format loader`.
- Measured output size by row count, (a) widget vs (b) loader: 4 rows 6.6K/1.5K (4.4x), 20 rows 12.1K/4.9K (2.5x), 50 rows 22.5K/11.3K (2.0x), 100 rows 39.8K/21.9K (1.8x).
  - Fixed cost is about 5.2 KB for (a) (mostly CSS) and 0.65 KB for (b).
  - Per row, it's about 346 B for (a) and 213 B for (b).
  - Both are paid twice per render: read as a tool result, then emitted as output. (d) costs a constant ~100 output tokens.
- 2026-09-28: GitHub accepts pushes of custom `refs/plans/*` refs. `git ls-remote` lists them on the private scenario repos, though the web UI doesn't show them.
- Node 26 runs `.ts` directly, and `node:module` exposes `stripTypeScriptTypes`, so a browser build needs no dependencies.
- Earlier (via docs/search):
  - SSH signing and allowed-signers behavior.
  - That the `reference-transaction` hook exists and what it's for.
  - Notes rewrite and merge defaults.
  - git-bug README claims.
  - Claude Code desktop feature list.

## Unverified assumptions

- In the Code tab: `sendPrompt` clicks from a widget, and the widget's JS (the filter toggle).
- Clipboard fallback for follow-up buttons when viewed outside chat (in the browser pane).
- Edge cases of the `reference-transaction` hook.
- `update-ref --stdin` transaction semantics.
- FIDO2 per-use signing confirmation.
- Denying specific commands via Claude Code permission settings.
- `git range-diff` and patch-id behavior on rewritten branches.
- GitHub PR head ref names.
- git-appraise status.
- MCP app UI spec.

## Open questions

- Implementation language for the write tool and diff extraction. TypeScript is the suggestion, since its compiler API covers DTO extraction.
- Review-side questions, tracked as #2's open questions: observed-only review for your own agents' work, whether reviews of others' changes reach the authors, approval location in the team era, and whether inline views show only the rows that need a decision.
- Other layers (raised 2026-09-28), opinion only:
  - DB: a strong fit, since schema diffs are deterministic.
  - Infra: a good fit through structured plan output (`terraform plan -json`, `cdk diff`), but that output depends on live state, so snapshot it as evidence.
  - FE: component props fit; visual changes need screenshot evidence, which the inline widget can't show well.
- How one decision supersedes another (raised 2026-09-28, self-hosted #1). Q14 renamed a kind that Q2 had decided. Decisions can't be edited, so the link exists only in Q14's answer text. A `supersedes: "Q2"` field would make it visible and let views mark Q2 as partly overridden.

## Scenario: soft delete (#7), started 2026-09-28

- A real TypeScript service with its own git repo in `scenarios/soft-delete/repo` (baseline `24090f8` on `main`). The intents are in `scenarios/soft-delete/plan/7` and `plan/8`.
- The flow being tested: request, intent gate, plan gate, implementation on a branch with `Plan-Step:` trailers, then the evidence gate.
- Revs are the SHA-256 of canonical JSON (sorted keys), truncated to 7 hex characters. Open questions are part of the intent, so answering them changes both revs, and approval has to come after the answers.
- Status: intent rev `0ceeec5` and plan rev `bfbeffb`, both blocked on Q1 and Q2 (found in code).
  - #7 was drafted before the intent gate existed, so its intent includes things learned from the code.
  - The purge schedule is deferred to the stub intent #8.
  - "OrderSummary" in an acceptance criterion became "the public order response shape", since acceptance criteria can't name code.

## Scenario: discount codes (#1 in the checkout repo), started 2026-09-28

- A checkout service on `node:sqlite` with SQL migrations, in `scenarios/coupons/repo` (baseline `96fc130`). It covers products, orders with tax rounded once per order, refunds, and a daily revenue report. Areas: `be` and `db`.
- The request is a fictional message from Marketing. The user acts as the approving human, starting at the intent gate.
- A separate agent structured the intent while forbidden from reading the product code. That tests whether the structure-request skill works on its own.
- The agent raised 15 questions. The user resolved 13 of them one at a time through AskUserQuestion, in dependency order starting with scope (Q3). The report question (Q2) moved to the stub intent #2 along with the deferred report. Answers are recorded with `node src/cli.ts decide`, the first piece of the single write path.
  - One answer went against the proposal: Q13, "switch off only". It added an acceptance criterion.
  - Q9's answer depends on an outside party ("Finance to confirm the tax treatment"), and the schema can't track that yet.
- Status: intent rev `ecbd228`, no open questions, ready for the intent gate.

## Build order (leaning)

1. Event schema and write tool: transition validation, rejecting agent-written accepted states, signed human approvals. Built 2026-09-28 except the signing; this came after the renderers, which inverted the order.
2. Deterministic observed-diff extraction for one kind (DTO shape).
3. Reconciliation of plan vs observed.
4. Widget renderer for that kind plus a markdown/HTML fallback. Then add kinds one at a time: typo, signature refactor, function body, unknown fallback.
