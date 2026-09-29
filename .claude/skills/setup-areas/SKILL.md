---
name: setup-areas
description: Propose and record a repo's own list of areas (the scopes an intent can name, like be or cli), confirmed by the human. Use when a repo has no area list yet, when the default fe, be, db, infra doesn't fit, or when the human asks to change the list.
---

# Set up a repo's areas

An area is a scope an intent names in `areas`. Each repo keeps its own closed list in `refs/ldd/config`, written only through `node src/cli.ts`. Until it has one, the list is `fe, be, db, infra`.

1. Show the current list: `node src/cli.ts areas --repo <repo>`.
2. Look at the repo's layout (top-level directories, packages, what the code does) and propose a short list of lowercase names, like `cli`, `render`, `store`. Each area should be a part of the repo that a change can touch on its own.
3. Ask the human to confirm it with the AskUserQuestion tool: your proposal first, marked "(Recommended)", then the current list, then one real alternative. The list is theirs; never record one they didn't choose.
4. Record their choice: `node src/cli.ts set-areas --repo <repo> --areas <a,b,...>`.
5. If it prints intents that use an area outside the new list, tell the human. Each one needs its areas edited (export, edit `areas`, `node src/cli.ts edit`) before it validates again.
