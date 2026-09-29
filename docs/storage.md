# Storage (decided)

Everything the tool stores lives in the product repo, under `refs/ldd/` (#3 Q3, 2026-09-29):

```
refs/ldd/plans/<id>    one ref per intent: intent.json plus steps/
refs/ldd/config        the repo's config: config.json, the area list
refs/ldd/reviews/<id>  planned, for reviews
```

- One ref per intent, in the repo it plans (user, 2026-09-28). Intents never conflict with each other. Intents stay in git in the team phase too, for now; a coordinator database may come later and isn't decided (#3 Q2, deferred to #4).
- Each event commit is a snapshot plus trailers (user, 2026-09-28). The tree is the full validated state, and the message carries `Event`, `Actor`, and event-specific trailers (`Question`, `Gate`, `Rev`, `Via`).
  - `git log --format='%(trailers)' refs/ldd/plans/<id>` is the audit trail, and `git diff` between two commits shows what an event changed.
  - Chosen over an `events.jsonl` fold, because the commit chain is already append-only.
- Every write is a compare-and-swap: `update-ref` with the expected old tip, or the zero ID on create.
- Custom refs, not `refs/notes/*`, and no notes anywhere (#3 Q10). Notes attach to a single object while a diff is a range, they don't follow rewrites without per-clone config, and the default `concatenate` rewrite mode corrupts JSON. The `Plan-Step:` trailer already links each merged commit to its step, whose ref holds the approvals.

## Syncing (#5, #3, 2026-09-29)

- A private GitHub repo. `node src/cli.ts setup` adds `refs/ldd/*` to the clone's fetch and push refspecs, keeps `refs/heads/*` in push, and removes refspecs left from before the move to `refs/ldd/`. Then plain `git push` and `git pull --ff-only` sync everything.
- Refspecs never force, so if two machines both write an intent, the second push is rejected rather than overwriting the first.
- Plans moved from `refs/plans/<id>` to `refs/ldd/plans/<id>` on 2026-09-29, in one `update-ref --stdin` transaction, with tips and histories unchanged.

## History

- Built 2026-09-28. The first intents were imported from earlier plan files, each as one `import` event noting that edits before storage existed have no history.
