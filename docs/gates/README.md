# Gates (decided)

Three gates, in order (2026-09-28). Enforced in the write path, not in prompts.

1. **Intent gate:** approve what and why, before any code is read. The agent structures the human's request into an intent without reading the code (it may read other intents). An intent drafted after reading the code absorbed the code's shape; one structured by an agent forbidden from reading it raised the product questions instead. The approval binds to the intent rev.
2. **Plan gate:** approve the decomposition before work starts. Only now does the agent read the code and propose steps. Questions only the code can raise go into `openQuestions` with `origin: "code"`; they amend the intent and require re-approval. The approval binds to the plan rev.
3. **Result gate:** approve each step's result. Named after what it approves, like the other two; renamed from "evidence gate" (#1 Q10, 2026-09-28).

## One result gate per intent (user, 2026-09-29)

All of an intent's steps are built without stopping for approval. Then one result gate covers them together. Its view explains each step: what changed, why, planned vs built, and every unplanned change with its reason. The human decides once, there.

Unplanned changes the human accepts are attached to their steps, which changes the plan rev, so one plan re-approval at the end covers them all. The tool can't record result-gate acceptance yet; the design record's Where we left off holds it.

## Rules

- Agents write `proposed` events. Only a human actor can move an item to an accepted state, and agents never write `verified`.
- Tier by risk. Typo kinds can be bulk or auto-accepted when reconciliation matches. Signature refactors and breaking data-shape changes need individual decisions.
- A reconciliation mismatch blocks approval. A human may override it with a recorded reason.
- Unplanned observed changes go to a bucket, where the human attaches them to a step or rejects them.
- Widget clicks (`sendPrompt`) carry no identity and count as intent only. Real approvals go through the write path.
- Collapsing the first two gates for small, low-risk requests is leaning, not built.

## Details

- [questions.md](questions.md): resolving questions
- [approvals.md](approvals.md): who approves, and staleness
