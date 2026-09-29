# Goal and constraints (decided)

- Structured plan and review data lives in git refs. Widgets and other views only render it.
- One system for planning (issues) and review, so humans and LLMs can both see planned vs implemented.
- Human in the loop is mandatory.
- No squash merges. Data must survive rebase.
- Review defaults to plan-based: approve plan items with evidence, not line-level diff comments. Observed-only review is optional.
- Must be able to review other people's changes without them using this tool.

## Two phases (#3 Q1, 2026-09-29)

- **Solo phase, now:** one developer, local, agents on the same machine. No forge integration: no hosting, accounts, permissions, notifications, web UI, search, or webhooks. The data layer and thin tools only.
- **Team phase, the target:** a coordinator alongside a forge, described in [team/](team/README.md).
- Anything expensive to change later, above all the data layer, is designed now so the coordinator can adopt it unchanged.

## Solo now vs later (decided)

- Build now: append-only events, `schemaVersion`, stable IDs, typed `kind` payloads, actor type (`human` | `agent`) with the gate in the write path, evidence snapshots on approvals, and trailers as the join key.
- Defer to the team phase: server-side enforcement, approver rules, concurrency handling, and display in hosting UIs.
- In the solo phase the forge is a one-way mirror at most. No two-way sync.
- Scope test for any feature: does it help reconcile plan vs observed, or gate human approval? If not, defer it.

## Build order (leaning)

1. Event schema and write tool: transition validation, rejecting agent-written accepted states. Built 2026-09-28, after the renderers, which inverted the order.
2. Deterministic observed-diff extraction for one kind (`data-shape`).
3. Reconciliation of plan vs observed.
4. A widget renderer for that kind plus a markdown/HTML fallback. Then add kinds one at a time.
