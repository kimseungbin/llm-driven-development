---
name: propose-plan
description: Propose the steps for an approved intent in this project's plan/review format, after reading the code. Use once an intent has passed the intent gate, or when asked to plan an intent that already exists.
---

# Propose a plan

Start from an intent approved at its current rev: `node src/cli.ts intent-view <id> --repo <repo>` shows `approvedRev` equal to `intentRev`. If it isn't approved, use the structure-request skill first. Now read the code.

Plan data lives only in the product repo's `refs/ldd/plans/<id>`, written through `node src/cli.ts`. Work in a copy: `node src/cli.ts export <id> --repo <repo> --out out/work/<id>`, add or edit `steps/<step id>.json`, then store it with `node src/cli.ts edit <id> --repo <repo> --from out/work/<id> --message "<what changed>"`. Approving the plan is the human's decision. Run `approve ... --gate plan --rev <plan rev> --via agent` only when their message explicitly says to approve and names the gate and the rev, in any language (in Korean, 계획 게이트 is the plan gate and 인텐트 게이트 the intent gate); never infer it.

## Amending the intent

- The agent proposes the steps and their expectations; the human approves, edits, or rejects them at the plan gate.
- The intent's `decisions` are settled. Follow them in the steps and never re-ask them.
- Reading the code can raise questions the request couldn't. Add them to the intent's `openQuestions` with `"origin": "code"` and a proposal. That changes the intent rev, so the intent needs approving again. Resolve them the way the structure-request skill does: one at a time with AskUserQuestion, recording each answer with `decide` before asking the next.
- If a question didn't need the code to ask, it was missed at the intent gate. Add it with `"origin": "request"`: `plan-view` then refuses to build, which sends the intent back to the intent gate.
- Don't edit the request, problem, or acceptance yourself; propose the change as a question.

## Steps

- Write each step's summary, risk reason, rules, invariants, and evidence in the intent's request language. Kinds, symbols, and section headings stay as they are.
- IDs are `<intent id>.<n>` (for example `7.3`), with `parent` set to the intent ID.
- One step per logical change. Its `expect` lists every symbol the change touches.
- Steps use format version 2 (`"schemaVersion": 2`).
- One `kind` per step, and each kind states what reconciliation needs:
  - `data-shape`: a change to a data type's fields (add, remove, rename, retype, nullability), whatever role the type plays. Needs `add`, `remove`, or `change`.
  - `signature-change`: needs `change` entries with `from` and `to`.
  - `behavior-change`: needs the changed symbols in `change` and at least one rule.
  - `feature`: needs `add`.
  - `instructions`: agent-facing text (skills, CLAUDE.md, hook prompts). Needs `sections` and at least one rule saying what it now tells agents. Its evidence is a dry run of the changed instruction.
  - `docs`: the design record and other human-facing docs. Needs `sections`.
  - `non-semantic`: only typos, formatting, and pure moves; say what the human checks in `rules`.
  - `other`: no machine check; say what the human checks in `rules`.
- `expect` fields: `add` and `change` entries name a `symbol`; `remove` and `unchanged` list symbols; `rules` and `invariants` are `{ "text", "checkedBy": "test" | "human" }`. Anything machine-checked is a symbol list, never prose. Code kinds never name file paths or line numbers, because a symbol survives a file move and a path doesn't.
- `instructions` and `docs` steps, and `non-semantic` steps that touch prose, name what they change in `sections`: `{ "doc", "section" }`, where `doc` is the skill's name for a skill or the repo-relative path for any other file, and `section` is the heading text. For prose the file is the identity. Code kinds never have `sections`.
- At the result gate, each change gets one category from its kind's list in `docs/model/categories.md`. A change no category on that list fits is `uncategorized`, never the nearest category.
- `risk`: `low`, `medium`, or `high`, set per step, with a one-line `riskReason` on every step. High-risk steps require it; the plan gate shows high-risk reasons and hides the rest behind a toggle.
- `evidence`: how the result gets checked, such as named tests or call-site lists.
- `dependsOn`: order the steps so each one is safe to ship alone. The step that changes observable behavior comes after everything it relies on. A step may depend on another intent's step (`12.2`); validation checks that it exists.
- Don't mention other step IDs in the prose; `dependsOn` carries the ordering.
- `origin`: `planned`. Steps added after approval are `discovered`, and they need their own approval.
- Decompose until each step is one kind with checkable evidence. Refine later steps when you get to them; don't guess.
- Store nothing derived: no status, approvals, or observed data.

## Commits, when implementing

- One step is one commit by default. Rebase review fixups into it.
- A step may take several commits, but only back to back, never interleaved with another step's.
- A commit never serves two steps: at most one `Plan-Step: <step id>` trailer per commit.
- Build every step of an approved plan without stopping for approval in between. Then hold one result gate for the whole intent, rendered as a view that explains each step: what changed, why, planned vs built, and every unplanned change with its reason. The human decides once, there.

## Before showing it

1. Build and validate the view: `node src/cli.ts plan-view <id> --repo <repo> --out out/<id>.plan-gate.json`. It fails on missing fields; fix them rather than working around it.
2. Render it: `node src/cli.ts render out/<id>.plan-gate.json`, and pass the output to the widget unchanged.
