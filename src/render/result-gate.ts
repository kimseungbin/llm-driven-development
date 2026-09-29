import { type ChangeCategory, KIND_CATEGORIES, type StepKind } from '../model.ts'
import { displayId, esc, list, promptButton } from './html.ts'
import { code } from './kinds/code.ts'
import { prose, PROSE_STYLE } from './kinds/prose.ts'
import { unknownKind } from './kinds/unknown.ts'
import { en, type Messages } from './lang/en.ts'
import { style } from './style.ts'

export type PlanMatch = 'matched' | 'unplanned' | 'missing'

export interface ReconItem {
  plan: PlanMatch
  breaking: boolean
  // A change no category fits is uncategorized, never the nearest category.
  category: ChangeCategory | 'uncategorized'
  classifiedBy: 'deterministic' | 'inferred'
  confidence?: number
  detail: unknown
}

export interface ResultGateView {
  schemaVersion: 1
  view: 'result-gate'
  mode: 'planned' | 'observed-only'
  step: { id: string; summary: string; kind: StepKind; planRev: string | null }
  observed: { range: string; head: string }
  items: ReconItem[]
  invariants: { text: string; status: 'pending' | 'passed' | 'failed'; note?: string }[]
}

export interface KindRenderer {
  body(view: ResultGateView, t: Messages): string
  itemName(item: ReconItem, t: Messages): string
}

// The step's kind picks the view: code kinds get the before/after table, prose kinds the prose view.
const renderers: Record<StepKind, KindRenderer> = {
  'data-shape': code,
  'signature-change': code,
  'behavior-change': code,
  feature: code,
  instructions: prose,
  docs: prose,
  'non-semantic': prose,
  other: unknownKind,
}

// A category the step's kind can't produce is a mislabel, so the view refuses it rather than show it.
// The refusal is a CLI error, so it names the change in English whatever the view's language.
function checkCategories(view: ResultGateView, kind: KindRenderer) {
  const allowed = KIND_CATEGORIES[view.step.kind]
  if (!allowed) throw new Error(`${view.step.id}: unknown step kind ${view.step.kind}`)
  for (const item of view.items)
    if (item.category !== 'uncategorized' && !allowed.includes(item.category))
      throw new Error(
        `${view.step.id}: ${kind.itemName(item, en)} is ${item.category}, which a ${view.step.kind} step can't produce (${allowed.join(', ')}, or uncategorized)`,
      )
}

// Rows that need a decision come first. A row goes in the first group it qualifies for.
const attention = (item: ReconItem): number =>
  item.plan === 'unplanned' ? 0 : item.plan === 'missing' ? 1 : item.breaking ? 2 : item.classifiedBy === 'inferred' ? 3 : 4

const STYLE = style(`
.v-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:12px}
.v-stat{background:var(--surface-1);border-radius:var(--radius);padding:10px 12px;font-size:22px;font-weight:500}
.v-stat>div:first-child{font-size:12px;font-weight:400;color:var(--text-secondary)}
.v-row label{position:relative;font-size:13px;padding:6px 12px;border:0.5px solid var(--border-strong);border-radius:var(--radius);cursor:pointer}
.v-row label:has(input:checked){background:var(--surface-1)}
.v-row label:has(input:focus-visible){outline:2px solid var(--border-accent)}
.v-row input{position:absolute;opacity:0;pointer-events:none}
.v:has(input[value=breaking]:checked) [data-breaking=false]{display:none}
.v-table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:13px}
.v-table th{text-align:left;font-weight:500;color:var(--text-secondary);padding:6px 8px;border-bottom:0.5px solid var(--border)}
.v-table td{padding:8px;border-bottom:0.5px solid var(--border);vertical-align:top;overflow-wrap:anywhere}
.v-table .v-grp th{font-size:11px;color:var(--text-muted);border-bottom:none;padding-bottom:0}
.v-raw{margin:0;font-family:var(--font-mono);font-size:12px;white-space:pre-wrap}${PROSE_STYLE}`)

export function renderResultGate(view: ResultGateView, t: Messages): string {
  const planned = view.mode === 'planned'
  const kind = renderers[view.step.kind] ?? unknownKind
  checkCategories(view, kind)
  const id = displayId(view.step.id)
  const byPlan = (plan: PlanMatch) => view.items.filter((i) => i.plan === plan)
  const unplanned = byPlan('unplanned')
  const missing = byPlan('missing')
  const breaking = view.items.filter((i) => i.breaking)
  const names = (items: ReconItem[]) => items.map((i) => kind.itemName(i, t)).join(', ')

  const blockers: string[] = []
  if (planned && unplanned.length) blockers.push(t.result.unplannedChanges(unplanned.length))
  if (planned && missing.length) blockers.push(t.result.missingChanges(missing.length))
  const failed = view.invariants.filter((i) => i.status === 'failed').length
  const pending = view.invariants.filter((i) => i.status === 'pending').length
  if (failed) blockers.push(t.result.failedInvariants(failed))
  if (pending) blockers.push(t.result.pendingInvariants(pending))

  const modeText = planned ? t.result.mode.planned : t.result.mode.observed
  const against = view.step.planRev
    ? `<span class="v-chip">${t.result.against(`<span class="m">${esc(view.step.planRev)}</span>`)}</span>`
    : `<span class="v-chip">${t.result.noPlan}</span>`

  const stat = (label: string, value: number | null, tone: string) =>
    `<div class="v-stat"><div>${label}</div><div class="${value ? tone : ''}">${value ?? t.result.na}</div></div>`

  const invariantTone = { passed: 'v-ok', failed: 'v-bad', pending: 'v-sec' }
  const invariants = view.invariants.map(
    (i) =>
      `<span class="${invariantTone[i.status]}"><i class="ti ti-shield-check" aria-hidden="true"></i> ${t.result.invariant(esc(i.text), t.result.invariantStatus[i.status], i.note ? esc(i.note) : null)}</span>`,
  )
  const verdict = blockers.length
    ? `<span class="v-warn"><i class="ti ti-lock" aria-hidden="true"></i> ${t.result.blocked(esc(list(blockers, t.lang)))}</span>`
    : `<span class="v-ok"><i class="ti ti-circle-check" aria-hidden="true"></i> ${t.readyForYou}</span>`

  const buttons: string[] = []
  if (planned && unplanned.length)
    buttons.push(promptButton(t.result.triage, t.result.triagePrompt(id, names(unplanned))))
  if (breaking.length)
    buttons.push(promptButton(t.result.migration, t.result.migrationPrompt(id, names(breaking))))
  if (blockers.length)
    buttons.push(promptButton(t.result.override, t.result.overridePrompt(id, list(blockers, t.lang))))

  const summary = planned
    ? t.result.summaryPlanned(byPlan('matched').length, unplanned.length, missing.length, breaking.length)
    : t.result.summaryObserved(view.items.length, breaking.length)
  const filterName = `v-filter-${esc(id)}`

  return `<div class="v">${STYLE}
<h2 class="sr-only">${esc(t.result.sr(modeText, id, summary, blockers.length ? t.state.blocked : t.state.ready))}</h2>
<div class="v-row"><span class="v-badge"><i class="ti ti-checklist" aria-hidden="true"></i> ${t.result.badge}</span><span class="v-sec" style="font-size:13px">${t.result.gate(modeText)}</span></div>
<div class="v-row"><span style="font-weight:500;font-size:15px">${esc(id)}</span><span class="v-sec">${esc(view.step.summary)}</span><span class="v-chip m">${esc(view.step.kind)}</span>${against}</div>
<div class="v-stats">${stat(t.result.stats.matched, planned ? byPlan('matched').length : null, 'v-ok')}${stat(t.result.stats.unplanned, planned ? unplanned.length : null, 'v-warn')}${stat(t.result.stats.missing, planned ? missing.length : null, 'v-bad')}${stat(t.result.stats.breaking, breaking.length, 'v-bad')}</div>
<div class="v-row" role="radiogroup" aria-label="${t.result.filter}"><label><input type="radio" name="${filterName}" value="all" checked>${t.result.allChanges}</label><label><input type="radio" name="${filterName}" value="breaking">${t.result.breakingOnly}</label></div>
${kind.body({ ...view, items: view.items.toSorted((a, b) => attention(a) - attention(b)) }, t)}
<div class="v-status">${invariants.join('')}${verdict}</div>
<div class="v-row">${buttons.join('')}</div>
</div>`
}
