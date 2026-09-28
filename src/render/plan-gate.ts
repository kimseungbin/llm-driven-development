import type { Intent, PlanStep } from '../model.ts'
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

// Risk follows kind until per-step signals (breaking flags, call-site counts) exist.
const riskByKind: Record<string, 'low' | 'medium' | 'high'> = {
  'non-semantic': 'low',
  'dto-shape': 'medium',
  feature: 'medium',
  'signature-change': 'high',
  'behavior-change': 'high',
}
const riskTone = { low: 'v-ok', medium: 'v-warn', high: 'v-bad' }

function describe(v: unknown): string {
  if (typeof v === 'string') return v
  if (v && typeof v === 'object' && 'symbol' in v) {
    const o = v as { symbol: string; type?: string; signature?: string; from?: string; to?: string }
    return [o.symbol, o.type && `: ${o.type}`, o.signature && ` ${o.signature}`, o.from && o.to && ` ${o.from} → ${o.to}`]
      .filter(Boolean)
      .join('')
  }
  return JSON.stringify(v)
}

const expectLines = (expect: Record<string, unknown> = {}) =>
  Object.entries(expect).flatMap(([key, value]) => (Array.isArray(value) ? value : [value]).map((v) => `${key}: ${describe(v)}`))

const STYLE = style(`${INTENT_STYLE}
.v-step{border-top:0.5px solid var(--border);padding:10px 0}
.v-step .v-row{margin-bottom:4px}
.v-expect{font-family:var(--font-mono);font-size:12px;color:var(--text-secondary);margin:6px 0 0}`)

export function renderPlanGate(view: PlanGateView): string {
  const { intent, steps, planRev, intentRev, approvedIntentRev, approvedPlanRev } = view
  const id = displayId(intent.id)
  // Intent-level questions are settled before planning starts, so only code-raised ones reach this gate.
  const questions = intent.openQuestions.filter((q) => q.origin === 'code')
  const blocked = blockers(questions)
  if (approvedIntentRev !== intentRev) blocked.push(`intent rev ${intentRev} isn't approved (last approved: ${approvedIntentRev ?? 'never'})`)
  const short =(stepId: string) => shortStepId(stepId, intent.id)

  const stepRows = steps.map((s) => {
    const risk = riskByKind[s.kind]
    const riskPill = risk ? `<span class="v-pill ${riskTone[risk]}">${risk} risk</span>` : '<span class="v-pill">unknown risk</span>'
    const discovered = s.origin === 'discovered' ? '<span class="v-pill v-warn">discovered</span>' : ''
    const after = s.dependsOn.length ? `<span class="v-dim" style="font-size:12px">after ${esc(s.dependsOn.map(short).join(', '))}</span>` : ''
    const lines = expectLines(s.expect).map((l) => `<div>${symbol(l)}</div>`).join('')
    return `<div class="v-step"><div class="v-row"><span style="font-weight:500" title="${esc(displayId(s.id))}">${esc(short(s.id))}</span><span class="v-chip m">${esc(s.kind)}</span>${riskPill}${discovered}${after}</div>
<div>${esc(s.summary)}</div>${lines ? `<div class="v-expect">${lines}</div>` : ''}<div class="v-note">Evidence: ${esc(s.evidence.join('; '))}</div></div>`
  })

  const buttons = gateButtons(
    intent,
    questions,
    approvedPlanRev === planRev || blocked.length > 0,
    ['Approve plan', `Approve the plan gate for ${id} at rev ${planRev}.`],
    `I want changes to the ${id} plan (rev ${planRev}).`,
  )

  return `<div class="v">${STYLE}
<h2 class="sr-only">Plan, plan gate: ${esc(id)} ${esc(intent.title)}, plan rev ${esc(planRev)}, ${plural(steps.length, 'step')}. ${blocked.length ? 'Approval blocked' : 'Ready for decision'}.</h2>
<div class="v-row"><span class="v-badge"><i class="ti ti-list-check" aria-hidden="true"></i> Plan</span><span class="v-sec" style="font-size:13px">Plan gate · approve this decomposition before work starts?</span></div>
<div class="v-row"><span style="font-weight:500;font-size:15px">${esc(id)}</span><span class="v-sec">${esc(intent.title)}</span><span class="v-chip">intent rev <span class="m">${esc(intentRev)}</span></span><span class="v-chip">plan rev <span class="m">${esc(planRev)}</span></span><span class="v-chip">${plural(steps.length, 'step')}</span>${areasChip(intent)}</div>
${acceptanceSection(intent, `Acceptance criteria (from intent rev ${intentRev})`)}
${questionsSection(questions, 'Found while planning: needs your decision')}
<div class="v-h">Steps, in order</div>
${stepRows.join('\n')}
<div class="v-status">${verdictLines(blocked, planRev, approvedPlanRev)}</div>
<div class="v-row">${buttons}</div>
</div>`
}
