---
name: structure-request
description: Turn a human's change request into a structured intent for the intent gate, without reading the code. Use when the user asks for a change, feature, or fix that will need a plan, before proposing any steps.
---

# Structure a request

Capture what and why in the human's terms. Don't read code, tests, or schemas yet: the how comes after the intent gate, and reading the code first bends the problem toward whatever is easy to build. You may read existing intents (`git -C <repo> for-each-ref refs/plans/` and `node src/cli.ts export`) to spot duplicates and related work.

Plan data lives only in the product repo's `refs/plans/<id>`, written through `node src/cli.ts`. Never write plan files anywhere else, and never run `approve`.

1. Draft `out/work/new/intent.json` (any `id`; `create` assigns the real one).
2. Fill in:
   - `request`: the human's words, verbatim. Never paraphrase it; every other field is your interpretation and gets checked against it.
   - `title`, and `problem`: the current pain, naming who feels it. It's not a user story and not a solution.
   - `areas`: your best guess from `fe`, `be`, `db`, `infra`.
   - `acceptance`: behavior a test or a human can check, in the request's terms, with no code names. Check every criterion against the problem: none may work against someone the problem names.
   - `deferred`: `{ "item", "reason", "followUp" }` for work still needed later. `followUp` is the intent ID that will do it; create a stub intent (request, problem, acceptance, no steps) if none exists. No acceptance criterion may quietly depend on a deferred item.
   - `nonGoals`: `{ "item", "reason" }` for things this change will never do.
   - `openQuestions`: `{ "id", "text", "proposal", "origin": "request" }` for gaps or conflicts in the request that only the human can settle. Always give a proposal with its reasoning. Ask every question that doesn't need the code now: anything left for the plan gate should be something only the code could raise. Product rules, edge-case behavior, limits, and who is affected are all intent-level questions.
   - `decisions`: an empty array.
3. Store it: `node src/cli.ts create --repo <repo> --from out/work/new` prints the new ID. Then view it: `node src/cli.ts intent-view <id> --repo <repo> --out out/<id>.intent-gate.json`, then `node src/cli.ts render out/<id>.intent-gate.json`, and pass the output to the widget unchanged.
4. Resolve the open questions one at a time with the AskUserQuestion tool, never as a batch:
   - Go in dependency order: questions whose answers could change, narrow, or remove others come first (scope and definitions before details).
   - One question per call. The proposal is the first option, marked "(Recommended)", followed by one to three real alternatives, each with its consequence.
   - Record each answer before asking the next question: `node src/cli.ts decide <id> <question id> --repo <repo> --answer "<their answer>"`. The answer is theirs, either the chosen option or their own words. Never answer a question yourself.
   - If an answer changes the problem, acceptance criteria, deferred items, or non-goals, update those too and say what changed: `node src/cli.ts export <id> --repo <repo> --out out/work/<id>`, edit the files, then `node src/cli.ts edit <id> --repo <repo> --from out/work/<id> --message "<why>"`. An edit can't touch decisions.
   - If an answer makes a later question moot or changes it, drop or reword that question the same way before asking it, and say so.
   - Re-render the intent gate once the questions are resolved, or sooner if the human asks.
5. Stop at approval. The human approves by running `node src/cli.ts approve <id> --repo <repo> --gate intent --rev <intent rev>` themselves; give them the command, don't run it. Don't read the code or propose steps until the intent is approved at its current rev. For a small, low-risk request (a typo, a comment), say so and offer to combine both gates into one; the human decides.
