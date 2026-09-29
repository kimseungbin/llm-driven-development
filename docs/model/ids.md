# IDs, revs, and areas (decided)

## IDs (2026-09-28)

- Opaque, stable, per-repo numbers. Intents are `"7"`, steps `"7.1"`, and the display form is `#7` / `#7.1`.
- Allocation takes the highest existing number plus one (`next-id`). Creating with the zero ID as the expected old value makes allocation atomic, so racing creators can't share an ID.
- Views name the intent once and show short step IDs inside the plan (`.1`, "after .2").
- Scope goes in `areas`, not in the ID, because scope can change and an ID can't.

## Revs

- A rev is the SHA-256 of canonical JSON (sorted keys), truncated to 7 hex characters.
- The intent rev hashes the intent alone; the plan rev hashes the intent plus its steps.
- Open questions are part of the intent, so answering one changes both revs, and approval comes after the answers.

## Areas (#1 Q9, Q13, 2026-09-28)

- Each repo declares its own closed list of areas in `refs/ldd/config`, defaulting to `fe`, `be`, `db`, `infra`.
- The setup-areas skill proposes a list from the repo's layout; the human confirms it and `set-areas` records it.
- A ref, not a committed file, so it works on repos you don't own. The ref name follows #3 Q3 and Q13, which supersede #1 Q13's `refs/plans-config`.
- Later: compare an intent's areas with the areas its observed diff actually touched.
