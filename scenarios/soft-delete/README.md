# Scenario: soft delete for orders

An exercise for the request → intent gate → plan gate → implement → evidence gate loop, against real code.

## Situation (the request)

**#7: Deleted orders are gone for good.** Support deletes orders by mistake, and finance can't audit them afterwards. Make deletion recoverable for 30 days, then purge. Clients must not notice any change. Admins need to find and restore deleted orders.

The existing service (`repo/`, baseline `24090f8` on `main`) has these pieces:

- `OrderRepository` with four read paths (`findById`, `listByCustomer`, `search`, `all`) and a hard `delete`.
- `revenueByStatus`, which reads the raw store through `all()`.
- `exportCustomerData`, a data-subject export built on `listByCustomer`.
- `createApi`, whose `OrderSummary` response shape external clients depend on.

## Layout

- `repo/`: the service, with its own git history. Feature work goes on a branch, with `Plan-Step:` trailers on commits.
- `refs/plans/<id>` inside `repo/`: `intent.json` plus `steps/*.json`, one commit per event, written only through `node src/cli.ts ... --repo scenarios/soft-delete/repo`.
  - `7` is the soft-delete intent and its plan.
  - `8` is a stub for the purge schedule, deferred from `7`.
- Observed data and review views get added after implementation. Until the extractor exists, observed data is written by hand from the real diff and labeled a fixture.

#7 was drafted before the intent gate existed, so its intent already contains things learned from the code: the storage non-goal, the job-runner reason, and Q1/Q2, which are tagged "found in code".

## Commands

```bash
node src/cli.ts intent-view 7 --repo scenarios/soft-delete/repo --out out/7.intent-gate.json
node src/cli.ts plan-view 7 --repo scenarios/soft-delete/repo --out out/7.plan-gate.json
node src/cli.ts render out/7.plan-gate.json
```
