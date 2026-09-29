# Team phase (target)

The team-phase design came from a separate design session (the "ldd design") and was reconciled with this record by #3 (2026-09-29). It's the target, not the current build. Anything that would be expensive to change later is designed in the solo phase so this can adopt it unchanged (#3 Q1).

## Shape

- A **forge** (GitHub, GitLab, or a bare remote) hosts the code and `refs/ldd/*`. See [forges.md](forges.md).
- A **coordinator** works alongside it. It:
  - reacts to forge events and links pull requests to intents through `Plan-Step:` trailers
  - runs the extractors and computes reconciliation, the same deterministic code as the CLI (no LLM)
  - reports each gate to the forge as a required check, so the forge's own branch protection enforces it
  - serves an API, MCP, and a web UI, and keeps a search index
- **Users bring their own agents** for all LLM work; see [agents.md](agents.md).
- Plan data keeps the solo phase's format and refs. Intents stay in git for now; whether they move to a coordinator database is open (#3 Q2, in #4).
- A change is ready to merge when every step it implements has passed the result gate and nothing unplanned is left unresolved (#3 Q4).

## Dropped from the ldd design (#3, 2026-09-29)

- Agent-submitted review items and their submission checks: reconciliation is computed (Q5).
- The `Ldd-Work` trailer: `Plan-Step:` only (Q6).
- A stored baseline SHA in plans: approvals record what they saw (Q7).
- Git notes for merged commits (Q10).
- Typed intent layers: the layers became step kinds (Q4).

## Details

- [forges.md](forges.md): forge adapters, the coordinator's clone, replication
- [agents.md](agents.md): what ldd ships for agents, claims
- [identity.md](identity.md): logins, agent tokens, signing
- [review.md](review.md): deciders, votes, merge gate
- [stack.md](stack.md): libraries, with the runtime still open
