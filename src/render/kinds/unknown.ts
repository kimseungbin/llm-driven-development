import type { KindRenderer } from '../result-gate.ts'
import { esc, planCell } from '../html.ts'

export const unknownKind: KindRenderer = {
  itemName(item, t) {
    const name = (item.detail as { name?: unknown } | null)?.name
    return typeof name === 'string' ? name : t.unknown.unnamed
  },

  body(view, t) {
    const planned = view.mode === 'planned'
    const rows = view.items.map(
      (item) =>
        `<tr data-breaking="${item.breaking}"><td><pre class="v-raw">${esc(JSON.stringify(item.detail, null, 2))}</pre></td><td>${planCell(item.plan, planned, t)}</td></tr>`,
    )
    return `<p class="v-note">${t.unknown.noRenderer(`<span class="m">${esc(view.step.kind)}</span>`)}</p>
<table class="v-table"><colgroup><col style="width:80%"><col style="width:20%"></colgroup>
<thead><tr><th>${t.unknown.change}</th><th>${t.unknown.plan}</th></tr></thead>
<tbody>${rows.join('\n')}</tbody>
</table>`
  },
}
