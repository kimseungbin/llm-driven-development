// No <script> in any view: filters are CSS-only and buttons use inline handlers, so the markup
// behaves the same whether streamed into a widget, saved as a page, or set via innerHTML.
const base = `
.v{padding:.5rem 0 0;font-size:14px;color:var(--text-primary)}
.v .m{font-family:var(--font-mono);font-size:12px}
.v-row{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:12px}
.v-badge{background:var(--bg-accent);color:var(--text-accent);font-size:12px;padding:3px 10px;border-radius:var(--radius)}
.v-chip{font-size:12px;padding:3px 10px;border-radius:var(--radius);background:var(--surface-1);color:var(--text-secondary)}
.v-pill{display:inline-block;font-size:11px;padding:2px 8px;border-radius:var(--radius);background:var(--surface-1)}
.v-pill.v-ok{background:var(--bg-success)}.v-pill.v-warn{background:var(--bg-warning)}.v-pill.v-bad{background:var(--bg-danger)}
.v-ok{color:var(--text-success)}.v-warn{color:var(--text-warning)}.v-bad{color:var(--text-danger)}.v-sec{color:var(--text-secondary)}.v-dim{color:var(--text-muted)}
.v-note{font-size:11px;color:var(--text-muted);margin-top:4px}
.v-h{font-size:13px;font-weight:500;margin:16px 0 6px}
.v-status{display:grid;gap:6px;margin:12px 0;font-size:13px}`

export const style = (extra: string): string => `<style>${base}\n${extra}\n</style>`
