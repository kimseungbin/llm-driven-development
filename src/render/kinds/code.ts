import type { KindRenderer, ReconItem } from '../result-gate.ts'
import { esc, planCell, symbol } from '../html.ts'
import type { Messages } from '../lang/index.ts'

interface FieldChange {
  field: string
  before: string | null
  after: string | null
  note?: string
  impact: string
}

const tone: Record<ReconItem['category'], string> = {
  added: 'v-ok',
  removed: 'v-bad',
  renamed: 'v-warn',
  moved: 'v-warn',
  'type-changed': 'v-warn',
  'nullability-changed': 'v-warn',
  'value-changed': 'v-warn',
  'behavior-changed': 'v-warn',
  'content-changed': 'v-warn',
  uncategorized: '',
}

const value = (v: string | null, t: Messages) => (v === null ? `<span class="v-dim">${t.none}</span>` : esc(v))

// The before/after table for every code kind. A data-shape step's rows are fields; other kinds' rows are symbols.
export const code: KindRenderer = {
  itemName: (item) => (item.detail as FieldChange).field,

  body(view, t) {
    const planned = view.mode === 'planned'
    const rows = view.items.map((item) => {
      const d = item.detail as FieldChange
      const inferred = item.classifiedBy === 'inferred'
      const label = t.category[item.category] + (d.note ? `, ${d.note}` : '') + (inferred ? '?' : '')
      const confidence = inferred
        ? `<div class="v-note">${t.inferred}${item.confidence === undefined ? '' : `, ${item.confidence.toFixed(2)}`}</div>`
        : ''
      return `<tr data-breaking="${item.breaking}"><td class="m">${symbol(d.field)}</td><td class="m">${value(d.before, t)}</td><td class="m">${value(d.after, t)}</td><td><span class="v-pill ${tone[item.category]}">${esc(label)}</span>${confidence}</td><td>${planCell(item.plan, planned, t)}</td><td class="${item.breaking ? 'v-bad' : 'v-sec'}">${esc(d.impact)}</td></tr>`
    })
    const { range, head } = view.observed
    return `<table class="v-table">
<colgroup><col style="width:17%"><col style="width:17%"><col style="width:19%"><col style="width:15%"><col style="width:14%"><col style="width:18%"></colgroup>
<thead><tr class="v-grp"><th></th><th colspan="3">${t.code.observed} <span class="m">${esc(range)} @ ${esc(head)}</span></th><th>${t.code.vsPlan}</th><th></th></tr>
<tr><th>${view.step.kind === 'data-shape' ? t.code.field : t.code.symbol}</th><th>${t.code.before}</th><th>${t.code.after}</th><th>${t.code.change}</th><th>${t.code.plan}</th><th>${t.code.impact}</th></tr></thead>
<tbody>${rows.join('\n')}</tbody>
</table>`
  },
}
