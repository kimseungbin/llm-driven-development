# llm-driven-development

Design phase. The design record is [docs/README.md](docs/README.md) and the docs it links. Start with its "Where we left off" section, and keep that section current.

- Update the matching doc under `docs/` in the same turn a decision is made, a question is resolved, or an assumption is verified, and add the date. Keep each doc short, about 40 lines, one topic per file; add a file rather than growing one.
- Record a decision only after the user confirms it. Proposals go under Open questions.
- Commit and push freely with `git push` (a fresh clone needs `node src/cli.ts setup` once). Deleting a GitHub repo, or anything else that can't be undone outside this clone, needs the user. Each plan step is its own commit, with a `Plan-Step: <step id>` trailer, on a branch named `plan/<intent id>`. Other changes get their own commits.
- Run `approve` only when the user's message explicitly says to approve and names the gate and the rev, and always pass `--via agent`.
