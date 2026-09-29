# Rendering (decided)

- The widget is one renderer over ref data, alongside a markdown/terminal and static-HTML fallback for the CLI. Writes never go through a widget.
- Renderers are deterministic code in the repo, one per `kind`. Claude never hand-writes widget markup for records (user requirement, 2026-09-28).
  - Pipeline: refs → reconciliation → view model (JSON) → per-kind renderer → widget, markdown, or static HTML.
  - Why: if Claude writes the markup, its counts and flags are Claude's claims rather than computed output, and each render costs thousands of output tokens.
  - Each renderer is a pure TypeScript function that runs in both Node and the browser.
- Architecture diagrams are the one exception (#3 Q9, 2026-09-29): authored content attached to a decision, stored as sanitized SVG, shown as-is, and labeled authored. Counts, flags, and tables always come from renderers.
- An inline view in chat is preferred over a separate browser-pane view (user, 2026-09-28).

## Delivery (2026-09-28)

- Now: (a), the CLI's widget HTML passed through verbatim. Renderers change often during design, and (a) always shows the working copy with no publish step.
- Target: (b), the CDN loader, once renderers stop changing often. Add a `publish` script when switching. Keep (a) for renderer development.
- Revisit (c), MCP Apps, when [anthropics/claude-code#95149](https://github.com/anthropics/claude-code/issues/95149) lands. It would beat (b), since no data would pass through Claude.
- Not chosen: (d) browser pane, a separate view, and (e) Artifact, which uploads data.
- The options:
  - (a) The CLI emits the full widget HTML and Claude passes it through verbatim.
  - (b) The renderer script is served from an allowlisted CDN and Claude passes only the view-model JSON.
  - (c) An MCP App tool returns the UI directly.
  - (d) The CLI writes a static HTML file that opens in the desktop browser pane.
  - (e) The CLI writes the file and it's published as a private Artifact by path.

See [layouts.md](layouts.md) for the view layouts.
