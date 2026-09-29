# Steps (decided)

The agent proposes steps and their expectations after reading the code; the human approves, edits, or rejects them at the plan gate (#1 Q1, 2026-09-28).

## Format version 2 (#1 Q2, Q3, Q4, Q11, Q12, Q14, 2026-09-28)

- One step per logical change; its `expect` lists every symbol it touches.
- Kinds: `data-shape` (a change to a data type's fields, whatever role the type plays; renamed from `dto-shape` by Q14), `signature-change`, `behavior-change`, `feature`, `instructions`, `docs`, `non-semantic`, and the fallback `other`. More may be added; if the list keeps growing, move to nested kinds.
- Prose kinds (#6 Q0, 2026-09-29): `instructions` covers agent-facing text (skills, CLAUDE.md, hook prompts): `expect` names the file and section, rules say what it now tells agents, and evidence is a dry run of the skill. `docs` covers the design record: sections added, removed, or moved. `non-semantic` is only typos, formatting, and pure moves.
- Each kind produces a fixed set of change categories; see [categories.md](categories.md).
- Each kind has a fixed, validated `expect` shape. Anything machine-checked is a symbol list (`add`, `remove`, `change` from and to, `unchanged`), never prose. Rules and invariants stay prose, each marked `checkedBy: test | human`. The fallback kind has no machine check.
- The review layers from the ldd design map onto kinds (#3 Q4): contracts are `data-shape` and `signature-change`, behavior is `behavior-change`, mechanical changes are `non-semantic`, verification is each step's evidence, and decisions are the intent's decisions.
- Risk is set per step, not derived from the kind. Every step carries a one-line `riskReason`; it's required for high risk.
- `dependsOn` may point at another intent's step (`12.2`); validation checks that it exists.
- `expect` for code kinds is symbolic (symbols, types, rules), never file or line based, because a symbol survives a file move and a path doesn't.
- Prose kinds (`instructions`, `docs`) name what they change in `expect.sections`: `{ doc, section }[]`, where `doc` is the skill name for a skill or the repo-relative path for any other file, and `section` is the heading text. For prose the file is the identity (#6 Q4, 2026-09-29).
- Plans store nothing derived: no status, approvals, or observed diffs.
- Decompose just in time until each step is one kind with checkable evidence. Don't pre-plan everything.
- Revising a plan is a first-class event. New steps are tagged `discovered` (vs `planned`) and need approval.
- Low-risk steps (typos) may be created after the fact, classified non-semantic, and auto-accepted.
- Stored plans were migrated to version 2 in one step, accepting a brief window where they couldn't be read (Q12).

## Commits and steps (2026-09-28)

- One step is one commit by default, with fixups rebased in. A step may take several commits, but only back to back.
- A commit never serves two steps: at most one `Plan-Step:` trailer per commit.

## Example

```json
{ "schemaVersion": 2, "id": "12.1", "parent": "12", "kind": "data-shape", "origin": "planned",
  "summary": "Make implicit USD an explicit enum",
  "risk": "medium", "riskReason": "Money's JSON gains a required field.",
  "expect": {
    "add": [{ "symbol": "Currency", "type": "enum { USD }" }],
    "change": [{ "symbol": "Money.currency", "from": "implicit", "to": "Currency" }],
    "invariants": [{ "text": "no observable behavior change", "checkedBy": "test" }] },
  "evidence": ["existing tests pass unchanged", "call-site list"], "dependsOn": [] }
```
