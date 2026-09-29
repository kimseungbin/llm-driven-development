# Team review (team phase)

Reviewers vote or comment on each step at its gate. Only humans cast votes that count; see [identity.md](identity.md).

## Deciders

Each step has one decider, taken from owners config by path or kind. Other people's votes feed into the decider's ruling.

- **Solo repo:** the voter is the decider. A down vote asks for a reason and records the outcome: a fix is needed, a new convention or decision, or the objection is withdrawn.
- **Team repo:** votes are totaled. Down votes ask for a reason, which is optional. The decider's agent can group the reasons on request, and the decider rules.

## Gate configuration

- The plan gate and the merge gate are both configured per repo and overridable per change or intent. Each can require specific deciders per kind or path, vote thresholds, and automatic pass for chosen kinds, such as `non-semantic`.
- A per-change override can always add requirements. Relaxing one needs the decider's approval, recorded in the change.
- The coordinator reports the gate to the forge as a required check.

## Shared answers

When a reviewer asks their agent about a step, the answer is stored on that step, so the next reviewer reads it instead of asking again.
