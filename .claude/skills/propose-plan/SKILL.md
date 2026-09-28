---
name: propose-plan
description: Propose the steps for an approved intent in this project's plan/review format, after reading the code. Use once an intent has passed the intent gate, or when asked to plan an intent that already exists.
---

# Propose a plan

Start from an intent approved at its current rev: `node src/cli.ts intent-view <id> --repo <repo>` shows `approvedRev` equal to `intentRev`. If it isn't approved, use the structure-request skill first. Now read the code.

Plan data lives only in the product repo's `refs/plans/<id>`, written through `node src/cli.ts`. Work in a copy: `node src/cli.ts export <id> --repo <repo> --out out/work/<id>`, add or edit `steps/<step id>.json`, then store it with `node src/cli.ts edit <id> --repo <repo> --from out/work/<id> --message "<what changed>"`. The human approves the plan at the plan gate by running `approve` themselves; never run it.

## Amending the intent

- The intent's `decisions` are settled. Follow them in the steps and never re-ask them.
- Reading the code can raise questions the request couldn't. Add them to the intent's `openQuestions` with `"origin": "code"` and a proposal. That changes the intent rev, so the intent needs approving again. Resolve them the way the structure-request skill does: one at a time with AskUserQuestion, recording each answer with `decide` before asking the next.
- If a question didn't need the code to ask, it was missed at the intent gate. Add it with `"origin": "request"`: `plan-view` then refuses to build, which sends the intent back to the intent gate.
- Don't edit the request, problem, or acceptance yourself; propose the change as a question.

## Steps

- IDs are `<intent id>.<n>` (for example `7.3`), with `parent` set to the intent ID.
- One `kind` per step: `dto-shape`, `behavior-change`, `signature-change`, `feature`, or `non-semantic`.
- `expect` is symbolic: symbols, types, rules, and invariants. Never file paths or line numbers, because those don't survive a rebase.
- `evidence`: how the result gets checked, such as named tests or call-site lists.
- `dependsOn`: order the steps so each one is safe to ship alone. The step that changes observable behavior comes after everything it relies on.
- Don't mention other step IDs in the prose; `dependsOn` carries the ordering.
- `origin`: `planned`. Steps added after approval are `discovered`, and they need their own approval.
- Decompose until each step is one kind with checkable evidence. Refine later steps when you get to them; don't guess.
- Store nothing derived: no status, approvals, or observed data.

## Commits, when implementing

- One step is one commit by default. Rebase review fixups into it.
- A step may take several commits, but only back to back, never interleaved with another step's.
- A commit never serves two steps: at most one `Plan-Step: <step id>` trailer per commit.

## Before showing it

1. Build and validate the view: `node src/cli.ts plan-view <id> --repo <repo> --out out/<id>.plan-gate.json`. It fails on missing fields; fix them rather than working around it.
2. Render it: `node src/cli.ts render out/<id>.plan-gate.json`, and pass the output to the widget unchanged.
