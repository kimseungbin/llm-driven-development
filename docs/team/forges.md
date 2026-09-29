# Forges (team phase)

The forge hosts the code and `refs/ldd/*`; the coordinator runs no git hosting. It connects through one adapter per forge:

```ts
interface ForgeAdapter {
  parseWebhook(req): ForgeEvent[]                 // push, PR opened/updated/merged
  pollEvents(repo, since): ForgeEvent[]           // when webhooks can't reach the coordinator
  setCheck(repo, sha, { state, summary, url })    // the required gate check
  pushRefs(repo, updates: { ref, next, expected }[])   // atomic compare-and-swap
  fetchRefs(repo, pattern)
  pullRequestFor(repo, branch)
}
```

| | GitHub | GitLab | Bare remote |
|---|---|---|---|
| Coordinator's credentials | GitHub App | Bot account with an access token | SSH key or token |
| Events | Webhooks | Webhooks | Polling |
| Merge gate | Checks API plus branch protection or rulesets | External status checks, or a required CI job that asks the coordinator | Advisory only |

## The coordinator's clone

- A partial clone of each repo (`--filter=blob:none`): commits and trees, with file contents fetched only for the files a change touches.
- Used to read `Plan-Step:` trailers, run extractors independently of the author, and write events to `refs/ldd/*`.
- Events are written to the clone first, then pushed to the forge in batches with `git push --atomic --force-with-lease`. Acts that decide a gate are pushed immediately. A lost clone is rebuilt by fetching from the forge.

## Tampering

Forge branch protection doesn't cover custom refs, so anyone with write access could push to `refs/ldd/*`. The coordinator's next `--force-with-lease` push fails, and it alerts and restores from its clone. Any clone can also detect it, because the injected event lacks the coordinator's [signature](identity.md#signing).
