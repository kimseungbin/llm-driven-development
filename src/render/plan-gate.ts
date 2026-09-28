import type { Expect, Intent, PlanStep } from '../model.ts'
import { displayId, esc, plural, shortStepId, symbol } from './html.ts'
import { acceptanceSection, areasChip, blockers, gateButtons, INTENT_STYLE, questionsSection, verdictLines } from './intent.ts'
import { style } from './style.ts'

export interface PlanGateView {
  schemaVersion: 1
  view: 'plan-gate'
  intentRev: string
  planRev: string
  approvedIntentRev: string | null
  approvedPlanRev: string | null
  intent: Intent
  steps: PlanStep[]
}

const riskTone = { low: 'v-ok', medium: 'v-warn', high: 'v-bad' }

function expectLines(e: Expect): string[] {
  const ref = (r: NonNullable<Expect['add']>[number]) =>
    [r.symbol, r.type && `: ${r.type}`, r.signature && ` ${r.signature}`, r.from && r.to && ` ${r.from} → ${r.to}`].filter(Boolean).join('')
  return [
    ...(e.add ?? []).map((r) => `add: ${ref(r)}`),
    ...(e.remove ?? []).map((s) => `remove: ${s}`),
    ...(e.change ?? []).map((r) => `change: ${ref(r)}`),
    ...(e.unchanged ?? []).map((s) => `unchanged: ${s}`),
    ...(e.rules ?? []).map((c) => `rule (checked by ${c.checkedBy}): ${c.text}`),
    ...(e.invariants ?? []).map((c) => `invariant (checked by ${c.checkedBy}): ${c.text}`),
  ]
}

// The reasons toggle is CSS-only, like the result gate's filter, so the view still has no script.
const STYLE = style(`${INTENT_STYLE}
.v-step{border-top:0.5px solid var(--border);padding:10px 0}
.v-step .v-row{margin-bottom:4px}
.v-expect{font-family:var(--font-mono);font-size:12px;color:var(--text-secondary);margin:6px 0 0}
.v-toggle{position:relative;font-size:13px;padding:6px 12px;border:0.5px solid var(--border-strong);border-radius:var(--radius);cursor:pointer}
.v-toggle:has(input:checked){background:var(--surface-1)}
.v-toggle:has(input:focus-visible){outline:2px solid var(--border-accent)}
.v-toggle input{position:absolute;opacity:0;pointer-events:none}
.v-reason{display:none}
.v:has(input[value=reasons]:checked) .v-reason{display:block}`)

export function renderPlanGate(view: PlanGateView): string {
  const { intent, steps, planRev, intentRev, approvedIntentRev, approvedPlanRev } = view
  const id = displayId(intent.id)
  // Intent-level questions are settled before planning starts, so only code-raised ones reach this gate.
  const questions = intent.openQuestions.filter((q) => q.origin === 'code')
  const blocked = blockers(questions)
  if (approvedIntentRev !== intentRev) blocked.push(`intent rev ${intentRev} isn't approved (last approved: ${approvedIntentRev ?? 'never'})`)
  const short = (stepId: string) => shortStepId(stepId, intent.id)
  const hiddenReasons = steps.some((s) => s.risk !== 'high' && s.riskReason)

  const stepRows = steps.map((s) => {
    const discovered = s.origin === 'discovered' ? '<span class="v-pill v-warn">discovered</span>' : ''
    const after = s.dependsOn.length ? `<span class="v-dim" style="font-size:12px">after ${esc(s.dependsOn.map(short).join(', '))}</span>` : ''
    const reason = s.riskReason
      ? `<div class="v-note${s.risk === 'high' ? '' : ' v-reason'}">Risk: ${esc(s.riskReason)}</div>`
      : ''
    const lines = expectLines(s.expect).map((l) => `<div>${symbol(l)}</div>`).join('')
    return `<div class="v-step"><div class="v-row"><span style="font-weight:500" title="${esc(displayId(s.id))}">${esc(short(s.id))}</span><span class="v-chip m">${esc(s.kind)}</span><span class="v-pill ${riskTone[s.risk]}">${s.risk} risk</span>${discovered}${after}</div>
<div>${esc(s.summary)}</div>${reason}${lines ? `<div class="v-expect">${lines}</div>` : ''}<div class="v-note">Evidence: ${esc(s.evidence.join('; '))}</div></div>`
  })

  const buttons = gateButtons(
    intent,
    questions,
    approvedPlanRev === planRev || blocked.length > 0,
    ['Approve plan', `Approve the plan gate for ${id} at rev ${planRev}.`],
    `I want changes to the ${id} plan (rev ${planRev}).`,
  )

  return `<div class="v">${STYLE}
<h2 class="sr-only">Plan, plan gate: ${esc(id)} ${esc(intent.title)}, plan rev ${esc(planRev)}, ${plural(steps.length, 'step')}. ${blocked.length ? 'Approval blocked' : approvedPlanRev === planRev ? 'Approved' : 'Ready for decision'}.</h2>
<div class="v-row"><span class="v-badge"><i class="ti ti-list-check" aria-hidden="true"></i> Plan</span><span class="v-sec" style="font-size:13px">Plan gate · approve this decomposition before work starts?</span></div>
<div class="v-row"><span style="font-weight:500;font-size:15px">${esc(id)}</span><span class="v-sec">${esc(intent.title)}</span><span class="v-chip">intent rev <span class="m">${esc(intentRev)}</span></span><span class="v-chip">plan rev <span class="m">${esc(planRev)}</span></span><span class="v-chip">${plural(steps.length, 'step')}</span>${areasChip(intent)}</div>
${acceptanceSection(intent, `Acceptance criteria (from intent rev ${intentRev})`)}
${questionsSection(questions, 'Found while planning: needs your decision')}
<div class="v-h">Steps, in order</div>
${hiddenReasons ? '<div class="v-row"><label class="v-toggle"><input type="checkbox" value="reasons">Show all risk reasons</label></div>' : ''}
${stepRows.join('\n')}
<div class="v-status">${verdictLines(blocked, planRev, approvedPlanRev)}</div>
<div class="v-row">${buttons}</div>
</div>`
}
