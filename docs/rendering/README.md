# Rendering (decided)

- The widget is one renderer over ref data, alongside a markdown/terminal and static-HTML fallback for the CLI. Writes never go through a widget.
- Renderers are deterministic code in the repo, one per `kind`. Claude never hand-writes widget markup for records (user requirement, 2026-09-28).
  - Pipeline: refs → reconciliation → view model (JSON) → per-kind renderer → widget, markdown, or static HTML.
  - Why: if Claude writes the markup, its counts and flags are Claude's claims rather than computed output, and each render costs thousands of output tokens.
  - Each renderer is a pure TypeScript function that runs in both Node and the browser.
- Architecture diagrams are the one exception (#3 Q9, 2026-09-29): authored content attached to a decision, stored as sanitized SVG, shown as-is, and labeled authored. Counts, flags, and tables always come from renderers.
- An inline view in chat is preferred over a separate browser-pane view (user, 2026-09-28).

## Delivery (2026-09-28)

- Default: (b), the loader (#9 Q1, 2026-09-29). `render` emits the views' data and one module script that imports the renderer from this repo's `renderer` branch through jsDelivr, pinned to that commit's SHA, so a drawn view never changes later (#9 Q2).
- `node src/cli.ts publish` is the only build: it turns `src/render` and `model.ts` into browser modules, commits them as the whole tree of `renderer`, and pushes. An unchanged renderer makes no new commit.
- A published renderer that differs from `src/render` fails a loader render, which says to run `publish` or use `--format widget` (#9 Q3). (a) stays for renderer development.
- If the widget can't load the renderer, it shows a sentence and a redraw-as-widget button in the viewer's language (#9 Q4).
- (c), MCP Apps, would beat (b), since no data would pass through Claude. It waits on [anthropics/claude-code#95149](https://github.com/anthropics/claude-code/issues/95149), tracked as #10.
- Not chosen: (d) browser pane, a separate view, and (e) Artifact, which uploads data.
- The options:
  - (a) The CLI emits the full widget HTML and Claude passes it through verbatim.
  - (b) The renderer script is served from an allowlisted CDN and Claude passes only the view-model JSON.
  - (c) An MCP App tool returns the UI directly.
  - (d) The CLI writes a static HTML file that opens in the desktop browser pane.
  - (e) The CLI writes the file and it's published as a private Artifact by path.

See [layouts.md](layouts.md) for the view layouts and [languages.md](languages.md) for how views render in each person's language.
