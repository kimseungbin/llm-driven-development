# Status and events (decided)

- Stored item status is one of `todo`, `in_progress`, `blocked`, `dropped`. Issue status is never stored; it's a rollup.
- "Done" takes two signals that are never merged: `claimed_done` (author or LLM) and `verified` (reconciliation matched, or a human confirmed).
- Events are append-only: each event is a commit on the intent's ref (see [storage.md](storage.md)). The commit chain is the event log, and the tip's tree is the current state.
- Search goes through a disposable local index (JSON or SQLite), gitignored and rebuilt on demand.

## The write path (2026-09-28)

One write path, `node src/cli.ts`, optionally wrapped as an MCP server later. Every write is validated before it's committed.

| Command | Actor | Does |
|---|---|---|
| `create`, `edit`, `import` | agent | Write an intent or plan. An `edit` can't change decisions. |
| `decide` | human | Record the human's answer to a question |
| `approve` | human | Approve a gate at a rev; see [approvals](gates/approvals.md) |
| `areas`, `set-areas` | human | Read, or record, the repo's area list as a `configure` event on `refs/ldd/config`. `set-areas` names any intent the new list leaves invalid. |
| `setup` | — | Configure a clone's refspecs; see [storage.md](storage.md) |
| `intent-view`, `plan-view`, `render` | — | Build and render gate views |
