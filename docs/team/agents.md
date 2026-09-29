# Agents (team phase)

Users bring their own agent. The tool defines the formats and checks everything written against them; all LLM work (structuring requests, proposing plans, explaining changes) runs in the user's agent. The coordinator runs no LLM. A central LLM on Bedrock is a later option, not planned.

## What ships

- **MCP server:** tools generated from the same contract as the API. Reads return one slice at a time (one intent, one step, the conventions that match a file), never a bulk dump. Writes return structured failures so the agent knows what to fix.
- **Claude Code plugin:** the authoring skills, the conventions [hook](../conventions.md#delivery), and the MCP server.

## Records agents write

- Intents and plans, through the same write path as the CLI.
- Research and decision records, attached to the intent and its steps while working. Records written after the fact, for a human's change, are labeled `inferred`.
- Answers to a reviewer's questions about a step, and optional verification of a step's prose claims. Both are stored and shared, so the next reviewer reads them instead of asking again.

## Claims

Before generating something expensive (verifying a step, drawing a diagram, answering a question), an agent claims it, so a second agent never starts the same work.

- One Postgres row per `(target, kind)`, taken with a single conditional upsert.
- Ten minutes, renewed by a heartbeat; a crashed agent's claim expires on its own.
- A new revision cancels open claims on the old one; the next heartbeat returns `SUPERSEDED`.
- A refused agent waits on the change's event stream for the result.
- Writes carry idempotency keys, so a retried write returns the original result.
