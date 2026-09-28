import { displayId, esc, list, plural, promptButton } from './html.ts'
import { dtoShape } from './kinds/dto-shape.ts'
import { unknownKind } from './kinds/unknown.ts'
import { style } from './style.ts'

export type PlanMatch = 'matched' | 'unplanned' | 'missing'

export interface ReconItem {
  plan: PlanMatch
  breaking: boolean
  detail: unknown
}

export interface EvidenceGateView {
  schemaVersion: 1
  view: 'evidence-gate'
  mode: 'planned' | 'observed-only'
  step: { id: string; summary: string; kind: string; planRev: string | null }
  observed: { kind: string; range: string; head: string }
  items: ReconItem[]
  invariants: { text: string; status: 'pending' | 'passed' | 'failed'; note?: string }[]
}

export interface KindRenderer {
  body(view: EvidenceGateView): string
  itemName(item: ReconItem): string
}

const kinds: Record<string, KindRenderer> = { 'dto-shape': dtoShape }

const STYLE = style(`
.v-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:12px}
.v-stat{background:var(--surface-1);border-radius:var(--radius);padding:10px 12px;font-size:22px;font-weight:500}
.v-stat>div:first-child{font-size:12px;font-weight:400;color:var(--text-secondary)}
.v-row label{position:relative;font-size:13px;padding:6px 12px;border:0.5px solid var(--border-strong);border-radius:var(--radius);cursor:pointer}
.v-row label:has(input:checked){background:var(--surface-1)}
.v-row label:has(input:focus-visible){outline:2px solid var(--border-accent)}
.v-row input{position:absolute;opacity:0;pointer-events:none}
.v:has(input[value=breaking]:checked) tr[data-breaking=false]{display:none}
.v-table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:13px}
.v-table th{text-align:left;font-weight:500;color:var(--text-secondary);padding:6px 8px;border-bottom:0.5px solid var(--border)}
.v-table td{padding:8px;border-bottom:0.5px solid var(--border);vertical-align:top;overflow-wrap:anywhere}
.v-table .v-grp th{font-size:11px;color:var(--text-muted);border-bottom:none;padding-bottom:0}
.v-raw{margin:0;font-family:var(--font-mono);font-size:12px;white-space:pre-wrap}`)

export function renderEvidenceGate(view: EvidenceGateView): string {
  const planned = view.mode === 'planned'
  const kind = kinds[view.observed.kind] ?? unknownKind
  const id = displayId(view.step.id)
  const byPlan = (plan: PlanMatch) => view.items.filter((i) => i.plan === plan)
  const unplanned = byPlan('unplanned')
  const missing = byPlan('missing')
  const breaking = view.items.filter((i) => i.breaking)
  const names = (items: ReconItem[]) => items.map((i) => kind.itemName(i)).join(', ')

  const blockers: string[] = []
  if (planned && unplanned.length) blockers.push(plural(unplanned.length, 'unplanned change'))
  if (planned && missing.length) blockers.push(`${plural(missing.length, 'planned change')} missing`)
  const failed = view.invariants.filter((i) => i.status === 'failed').length
  const pending = view.invariants.filter((i) => i.status === 'pending').length
  if (failed) blockers.push(plural(failed, 'failed invariant'))
  if (pending) blockers.push(`${plural(pending, 'invariant')} without evidence`)

  const modeText = planned ? 'planned mode' : 'observed-only, reviewed without a plan'
  const against = view.step.planRev
    ? `<span class="v-chip">against plan rev <span class="m">${esc(view.step.planRev)}</span></span>`
    : '<span class="v-chip">no plan</span>'

  const stat = (label: string, value: number | null, tone: string) =>
    `<div class="v-stat"><div>${label}</div><div class="${value ? tone : ''}">${value ?? 'n/a'}</div></div>`

  const invariantTone = { passed: 'v-ok', failed: 'v-bad', pending: 'v-sec' }
  const invariants = view.invariants.map(
    (i) =>
      `<span class="${invariantTone[i.status]}"><i class="ti ti-shield-check" aria-hidden="true"></i> Invariant "${esc(i.text)}": ${i.status}${i.note ? ` (${esc(i.note)})` : ''}</span>`,
  )
  const verdict = blockers.length
    ? `<span class="v-warn"><i class="ti ti-lock" aria-hidden="true"></i> Approval blocked: ${esc(list(blockers))}. Resolve them or override with a reason.</span>`
    : '<span class="v-ok"><i class="ti ti-circle-check" aria-hidden="true"></i> Ready for your decision.</span>'

  const buttons: string[] = []
  if (planned && unplanned.length)
    buttons.push(promptButton('Triage unplanned', `For ${id}, how should these unplanned changes be handled: attach to this step, split into a new step, or reject? ${names(unplanned)}`))
  if (breaking.length)
    buttons.push(promptButton('Migration plan', `For ${id}, how should consumers be migrated for these breaking changes? ${names(breaking)}`))
  if (blockers.length)
    buttons.push(promptButton('Override with reason', `I want to override the approval block on ${id} (${list(blockers)}). What reason and evidence would the write path record?`))

  const summary = planned
    ? `${byPlan('matched').length} matched, ${unplanned.length} unplanned, ${missing.length} missing, ${breaking.length} breaking`
    : `${view.items.length} changes, ${breaking.length} breaking`
  const filterName = `v-filter-${esc(id)}`

  return `<div class="v">${STYLE}
<h2 class="sr-only">Review, evidence gate, ${modeText}: ${esc(id)}. ${summary}. ${blockers.length ? 'Approval blocked' : 'Ready for decision'}.</h2>
<div class="v-row"><span class="v-badge"><i class="ti ti-checklist" aria-hidden="true"></i> Review</span><span class="v-sec" style="font-size:13px">Evidence gate · ${modeText} · accept this step's result?</span></div>
<div class="v-row"><span style="font-weight:500;font-size:15px">${esc(id)}</span><span class="v-sec">${esc(view.step.summary)}</span><span class="v-chip m">${esc(view.step.kind)}</span>${against}</div>
<div class="v-stats">${stat('Matched', planned ? byPlan('matched').length : null, 'v-ok')}${stat('Unplanned', planned ? unplanned.length : null, 'v-warn')}${stat('Planned, missing', planned ? missing.length : null, 'v-bad')}${stat('Breaking', breaking.length, 'v-bad')}</div>
<div class="v-row" role="radiogroup" aria-label="Filter changes"><label><input type="radio" name="${filterName}" value="all" checked>All changes</label><label><input type="radio" name="${filterName}" value="breaking">Breaking only</label></div>
${kind.body(view)}
<div class="v-status">${invariants.join('')}${verdict}</div>
<div class="v-row">${buttons.join('')}</div>
</div>`
}
