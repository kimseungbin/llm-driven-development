# Intents (decided)

An intent is human-authored and stable. JSON only, written through the CLI; markdown may come later as an input the CLI converts (#1 Q8, 2026-09-28). Terms confirmed 2026-09-28.

- `request`: the human's words, verbatim. Every other field is an interpretation, checked against it.
- `areas`: see [ids.md](ids.md).
- `problem`: why the change exists, stated as the current pain. It's not a user story.
- `acceptance`: the testable restatement of the problem.
  - Criteria never name stakeholders; the problem names who feels the pain (#1 Q7). Raised after an early intent's problem mixed one team's undo need with another's retention need.
  - Criteria never name code: an early criterion naming a response type was restated as "the public order response shape".
- `deferred`: `{ item, reason, followUp }` for work still needed later. `followUp` is the intent that will do it, so deferred work can't get lost; create a stub intent if none exists.
- `nonGoals`: `{ item, reason }` for things the change will never do.
  - These two replace `outOfScope`, which mixed future work with non-goals (user, 2026-09-28). Reasons are required on both.
- `relations`: `{ type, target }`, typed links to other intents: `blocks`, `duplicates`, `parent`, alongside `deferred.followUp` (#1 Q5, 2026-09-28).
  - Stored on one side only; reverse links are computed by scanning the plan refs, and the intent gate shows both directions.
  - Validation rejects a link to an intent that doesn't exist. A prose `#8` mention is just a mention.
  - Work that spans repos is one intent per repo, joined by `parent` links (#3 Q2).
- `openQuestions`: `{ id, text, proposal, origin, owner? }`, decisions the human must make. The proposal is required. `origin` is `request` or `code`.
  - `owner` names who must answer when it isn't the approving human (#1 Q6). A decision that needs an outside party's confirmation stays an open question owned by them and blocks the intent until their answer is recorded. Raised by an early intent whose tax answer depended on Finance.
- `decisions`: `{ id, question, answer, origin, owner? }`. When the human answers, the question moves here with their answer and its owner. Agents never answer questions.

Example:

```json
{ "schemaVersion": 1, "id": "12", "kind": "intent", "title": "Add KRW support",
  "acceptance": ["KRW amounts format with 0 decimals", "USD behavior unchanged"] }
```
