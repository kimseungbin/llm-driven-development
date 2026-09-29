# Verified findings

- 2026-09-28: `show_widget` inline visuals render in the Claude desktop Code tab, including dark mode.
- 2026-09-28: `show_widget` takes markup inline as a tool argument, not a file path. Anything it shows passes through Claude's output tokens.
- Widget scripts can load only from cdnjs, esm.sh, jsdelivr, and unpkg.
- 2026-09-28: Claude Code doesn't render MCP App (`ui://`) UIs, in either the Code tab or the CLI ([anthropics/claude-code#95149](https://github.com/anthropics/claude-code/issues/95149)). Regular Claude chat does render them (reported, not checked here).
- 2026-09-28: the Artifact tool publishes a local HTML file by path, so a CLI-generated page can be shown without Claude retyping it.
- 2026-09-28: the renderer works through delivery options (a) and (d). Run `node src/cli.ts render <view.json> --format widget|page`.
  - (a) The widget fragment, passed through unchanged, renders inline. About 6.6 KB for 4 rows.
  - (d) The browser pane opens the local `file://` page and the CSS-only filter works there.
  - (b) The CDN loader renders in the Code tab widget, so the sandbox allows ES module imports from jsDelivr. First tested with a temporary public repo, since deleted.
- 2026-09-29: jsDelivr serves this repo's `renderer` branch at a commit SHA once the repo is public. A loader render of #9's intent gate drew it in Korean in the browser pane over localhost, and pointing it at a missing SHA drew the Korean fallback with its redraw button.
- 2026-09-29: markup Claude retypes into `show_widget` can arrive with backslash escapes decoded: a loader's `\u003c/script>` became a real `</script>` and ended its script. The loader's output therefore holds no backslash; after that change the Code tab widget drew #9's result gate through the loader, in Korean (user, 2026-09-29).
- 2026-09-29: #9's intent gate is 7.9 KB through (a) and 6.5 KB through (b). Most of it is authored text, which both carry; the loader's inlined fallback, with its style block, adds about 1.2 KB to (b)'s fixed cost.
- Output size by row count, (a) widget vs (b) loader: 4 rows 6.6K/1.5K, 20 rows 12.1K/4.9K, 50 rows 22.5K/11.3K, 100 rows 39.8K/21.9K. Fixed cost about 5.2 KB vs 0.65 KB; per row about 346 B vs 213 B. Both are paid twice per render. (d) costs about 100 output tokens.
- 2026-09-28: GitHub accepts pushes of custom refs outside `refs/heads`. `git ls-remote` lists them, though the web UI doesn't show them.
- Node 26 runs `.ts` directly, and `node:module` exposes `stripTypeScriptTypes`, so a browser build needs no dependencies. `node --test` runs the tests with no dependencies.
- 2026-09-29: `git update-ref --stdin` with `start`, `create`/`delete` lines, `prepare`, and `commit` moves refs atomically: all five plan refs moved in one transaction, each checked against its old value.
- 2026-09-29: a result gate for seven steps, rendered through (a), is about 47 KB.
- Earlier, via docs and search: SSH signing and allowed-signers behavior; the `reference-transaction` hook; notes rewrite and merge defaults; git-bug README claims; the Claude Code desktop feature list.
