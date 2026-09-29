import type { KindRenderer } from '../result-gate.ts'
import { esc, planCell, symbol } from '../html.ts'

interface FieldChange {
  field: string
  before: string | null
  after: string | null
  change: 'added' | 'removed' | 'renamed' | 'type-changed' | 'nullability-changed'
  note?: string
  classifiedBy: 'deterministic' | 'inferred'
  confidence?: number
  impact: string
}

const tone: Record<FieldChange['change'], string> = {
  added: 'v-ok',
  removed: 'v-bad',
  renamed: 'v-warn',
  'type-changed': 'v-warn',
  'nullability-changed': 'v-warn',
}

const value = (v: string | null) => (v === null ? '<span class="v-dim">none</span>' : esc(v))

export const dataShape: KindRenderer = {
  itemName: (item) => (item.detail as FieldChange).field,

  body(view) {
    const planned = view.mode === 'planned'
    const rows = view.items.map((item) => {
      const d = item.detail as FieldChange
      const inferred = d.classifiedBy === 'inferred'
      const label = d.change.replace('-', ' ') + (d.note ? `, ${d.note}` : '') + (inferred ? '?' : '')
      const confidence = inferred
        ? `<div class="v-note">inferred${d.confidence === undefined ? '' : `, ${d.confidence.toFixed(2)}`}</div>`
        : ''
      return `<tr data-breaking="${item.breaking}"><td class="m">${symbol(d.field)}</td><td class="m">${value(d.before)}</td><td class="m">${value(d.after)}</td><td><span class="v-pill ${tone[d.change]}">${esc(label)}</span>${confidence}</td><td>${planCell(item.plan, planned)}</td><td class="${item.breaking ? 'v-bad' : 'v-sec'}">${esc(d.impact)}</td></tr>`
    })
    const { range, head } = view.observed
    return `<table class="v-table">
<colgroup><col style="width:17%"><col style="width:17%"><col style="width:19%"><col style="width:15%"><col style="width:14%"><col style="width:18%"></colgroup>
<thead><tr class="v-grp"><th></th><th colspan="3">Observed in code · <span class="m">${esc(range)} @ ${esc(head)}</span></th><th>Vs plan</th><th></th></tr>
<tr><th>Field</th><th>Before</th><th>After</th><th>Change</th><th>Plan</th><th>Impact</th></tr></thead>
<tbody>${rows.join('\n')}</tbody>
</table>`
  },
}
