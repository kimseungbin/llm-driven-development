import type { KindRenderer, ReconItem } from '../result-gate.ts'
import { esc, planCell } from '../html.ts'
import type { Messages } from '../lang/index.ts'

// A prose change has no before and after value: a mechanical change names where it was and is,
// and a wording change carries a unified diff of the text (lines starting with - or +).
export interface ProseChange {
  what: string
  from?: string
  to?: string
  diff?: string
  why: string
}

// Wording changes are quoted, so the reviewer reads the words that changed rather than a summary of them.
const quoted: ReadonlySet<ReconItem['category']> = new Set(['content-changed', 'behavior-changed'])

export const PROSE_STYLE = `
.v-prose{border-bottom:0.5px solid var(--border);padding:8px 0;font-size:13px}
.v-diff{margin:6px 0;padding:8px 10px;background:var(--surface-1);border-radius:var(--radius);font-family:var(--font-mono);font-size:12px;white-space:pre-wrap;overflow-wrap:anywhere}
.v-diff .v-del{color:var(--text-danger)}.v-diff .v-add{color:var(--text-success)}`

const pill = (item: ReconItem, t: Messages) => {
  const inferred = item.classifiedBy === 'inferred'
  const note = inferred ? `<span class="v-note">${t.inferred}${item.confidence === undefined ? '' : `, ${item.confidence.toFixed(2)}`}</span>` : ''
  return `<span class="v-pill">${esc(t.category[item.category])}${inferred ? '?' : ''}</span>${note}`
}

const place = (v: string | undefined, t: Messages) => (v === undefined ? `<span class="v-dim">${t.none}</span>` : esc(v))

const diffLines = (diff: string) =>
  diff
    .split('\n')
    .map((line) => {
      const tone = line.startsWith('-') ? 'v-del' : line.startsWith('+') ? 'v-add' : ''
      return tone ? `<span class="${tone}">${esc(line)}</span>` : esc(line)
    })
    .join('\n')

export const prose: KindRenderer = {
  itemName: (item) => (item.detail as ProseChange).what,

  body(view, t) {
    const planned = view.mode === 'planned'
    const parts: string[] = []
    let rows: string[] = []
    const flush = () => {
      if (!rows.length) return
      parts.push(`<table class="v-table">
<colgroup><col style="width:20%"><col style="width:14%"><col style="width:18%"><col style="width:18%"><col style="width:12%"><col style="width:18%"></colgroup>
<thead><tr><th>${t.prose.what}</th><th>${t.prose.change}</th><th>${t.prose.from}</th><th>${t.prose.to}</th><th>${t.prose.plan}</th><th>${t.prose.why}</th></tr></thead>
<tbody>${rows.join('\n')}</tbody>
</table>`)
      rows = []
    }
    for (const item of view.items) {
      const d = item.detail as ProseChange
      if (quoted.has(item.category) && d.diff !== undefined) {
        flush()
        parts.push(`<div class="v-prose" data-breaking="${item.breaking}"><div class="v-row" style="margin-bottom:0"><span class="m">${esc(d.what)}</span>${pill(item, t)}${planCell(item.plan, planned, t)}</div>
<pre class="v-diff">${diffLines(d.diff)}</pre><div class="v-sec">${t.prose.whyLine(esc(d.why))}</div></div>`)
      } else {
        rows.push(`<tr data-breaking="${item.breaking}"><td class="m">${esc(d.what)}</td><td>${pill(item, t)}</td><td>${place(d.from, t)}</td><td>${place(d.to, t)}</td><td>${planCell(item.plan, planned, t)}</td><td class="v-sec">${esc(d.why)}</td></tr>`)
      }
    }
    flush()
    return `<div class="v-sec" style="font-size:12px;margin-bottom:6px">${t.prose.observed} <span class="m">${esc(view.observed.range)} @ ${esc(view.observed.head)}</span></div>
${parts.join('\n')}`
  },
}
