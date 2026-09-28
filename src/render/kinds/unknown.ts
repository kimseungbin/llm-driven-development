import type { KindRenderer } from '../evidence-gate.ts'
import { esc, planCell } from '../html.ts'

export const unknownKind: KindRenderer = {
  itemName(item) {
    const name = (item.detail as { name?: unknown } | null)?.name
    return typeof name === 'string' ? name : 'unnamed change'
  },

  body(view) {
    const planned = view.mode === 'planned'
    const rows = view.items.map(
      (item) =>
        `<tr data-breaking="${item.breaking}"><td><pre class="v-raw">${esc(JSON.stringify(item.detail, null, 2))}</pre></td><td>${planCell(item.plan, planned)}</td></tr>`,
    )
    return `<p class="v-note">No renderer for kind <span class="m">${esc(view.observed.kind)}</span>; showing raw change data.</p>
<table class="v-table"><colgroup><col style="width:80%"><col style="width:20%"></colgroup>
<thead><tr><th>Change</th><th>Plan</th></tr></thead>
<tbody>${rows.join('\n')}</tbody>
</table>`
  },
}
