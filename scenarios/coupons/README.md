# Scenario: discount codes at checkout

An exercise for the full loop with you as the approving human: request → intent gate (your feedback and decisions) → plan gate → implement → evidence gate.

## The request (from Marketing, verbatim)

> Hi team, for the spring launch we want discount codes we can hand out to customers. Some codes take a percentage off, others a fixed amount off. Codes should expire, and we need to cap how many times each code can be used. We'd also like to see how much revenue each campaign brought in. Launch is in three weeks.

## Layout

- `repo/`: the checkout service (TypeScript on `node:sqlite`), with its own git history.
- `refs/plans/<id>` inside `repo/`: intents and steps, one commit per event, written only through `node src/cli.ts ... --repo scenarios/coupons/repo`. This repo's numbering starts at `#1`. History: `git -C scenarios/coupons/repo log --format='%h %s%n%(trailers)' refs/plans/1`.

## How the intent was made

A separate agent structured the request using the `structure-request` skill. It was told not to read `repo/`, so the intent reflects only the request.
