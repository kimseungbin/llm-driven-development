# Questions (decided)

## One at a time (user, 2026-09-28)

Resolve questions one at a time with AskUserQuestion, never as a batch. First done on a 15-question intent, 13 of them resolved in dependency order starting with scope.

- Go in dependency order, recording each answer as a decision before asking the next.
- The proposal is the recommended option, with real alternatives beside it.
- Gate views have no bulk "accept all" button, to avoid rubber-stamping.

## Intent-level questions stay at the intent gate (user, 2026-09-28)

- The structure-request skill asks everything that doesn't need the code: product rules, edge cases, limits.
- `plan-view` refuses to build while any `request`-origin question is still open.
- The plan gate shows only `code`-origin questions and doesn't repeat settled decisions or the problem. It keeps the acceptance criteria, labeled with the intent rev, as the contract the steps must meet.
- A question found during planning that didn't need the code is a miss at the intent gate. It goes back there as `request`-origin, which blocks planning.

## Authoring skills (2026-09-28)

- `.claude/skills/structure-request`: the intent, with no code reading.
- `.claude/skills/propose-plan`: the steps, after the intent is approved.
- `.claude/skills/setup-areas`: a repo's area list, confirmed by the human.
- `intent-view` and `plan-view` enforce the same rules. The skills guide authors, and validation rejects what slips through: enforce in the write path, not in prompts.
