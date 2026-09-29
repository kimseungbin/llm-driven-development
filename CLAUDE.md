# llm-driven-development

Design phase. The design record is [docs/design.md](docs/design.md). Start with its "Where we left off" section, and keep that section current.

- Update `docs/design.md` in the same turn a decision is made, a question is resolved, or an assumption is verified. Move the item to the right section and add the date.
- Record a decision only after the user confirms it. Proposals go under Open questions.
- Commit freely, but never push; the user pushes with `git push` (a fresh clone needs `node src/cli.ts setup` once). Each plan step is its own commit, with a `Plan-Step: <step id>` trailer, on a branch named `plan/<intent id>`. Other changes get their own commits.
- Run `approve` only when the user's message explicitly says to approve and names the gate and the rev, and always pass `--via agent`.
