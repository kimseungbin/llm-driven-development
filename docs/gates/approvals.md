# Approvals (decided)

## Who approves (#3 Q8, 2026-09-29)

- **Solo phase:** `approve` in the CLI. The human runs it, or the agent runs it with `--via agent` only when the human's message explicitly says to approve and names the gate and the rev (user, 2026-09-28). The Approve buttons send exactly that. The commit keeps `Actor: human` and adds `Via: agent`, so history tells delegated approvals apart from ones the human ran.
- **Team phase:** acts that decide a gate need a passkey signature, and delegated approvals never count toward a team gate; see [team/identity.md](../team/identity.md). SSH-signed approvals were dropped in favor of passkeys, because only a passkey proves a human was physically present.
- **Where approvals live, team phase (#2 Q3, 2026-09-29):** in `refs/ldd`, as passkey-signed events. The coordinator mirrors each gate to the forge as a required check. A pull-request approval never decides a gate, so the record works the same on every forge, bare remotes included.
- `approve` refuses a stale rev, open questions, or a plan whose intent isn't approved at its current rev.
- The `Actor` trailer is asserted, not verified. On one machine the gate guards against agent mistakes, not deliberate misuse.

## Evidence on approvals

Each approval records who approved, a timestamp, the head SHA, and the observed-diff hash. Plans themselves store no SHA.

## Staleness

Decided by #3 Q7 (2026-09-29). The baseline is recorded on the approval, and staleness is scoped by symbols, like Gerrit's change kinds and GitLab's patch-ids:

- A **plan-gate approval** records the `main` commit it saw. When `main` moves, only steps whose expected symbols changed go stale and get planned again; the rest carry over.
- A **result-gate approval** records the step's head SHA and observed-diff hash. After a rebase or new revision, the step's observed diff is computed again. The approval carries over if the hash is the same, and goes stale otherwise.
- A rebase of a feature branch never invalidates a stored baseline, because `main` isn't rewritten.
