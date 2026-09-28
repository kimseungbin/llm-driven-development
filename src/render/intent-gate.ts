import type { Intent } from '../model.ts'
import { displayId, esc } from './html.ts'
import {
  acceptanceSection,
  areasChip,
  blockers,
  decisionsSection,
  gateButtons,
  INTENT_STYLE,
  problemSection,
  questionsSection,
  scopeSections,
  verdictLines,
} from './intent.ts'
import { style } from './style.ts'

export interface IntentGateView {
  schemaVersion: 1
  view: 'intent-gate'
  intentRev: string
  approvedRev: string | null
  intent: Intent
}

const STYLE = style(`${INTENT_STYLE}
.v-quote{margin:0;padding:6px 12px;border-left:2px solid var(--border-strong);border-radius:0;font-size:13px;color:var(--text-secondary);white-space:pre-wrap}`)

export function renderIntentGate(view: IntentGateView): string {
  const { intent, intentRev, approvedRev } = view
  const id = displayId(intent.id)
  const questions = intent.openQuestions
  const blocked = blockers(questions)
  const buttons = gateButtons(
    intent,
    questions,
    approvedRev === intentRev,
    ['Approve intent', `Approve the intent gate for ${id} at rev ${intentRev}.`],
    `I want changes to the ${id} intent (rev ${intentRev}).`,
  )

  return `<div class="v">${STYLE}
<h2 class="sr-only">Intent, intent gate: ${esc(id)} ${esc(intent.title)}, intent rev ${esc(intentRev)}. ${blocked.length ? 'Approval blocked' : approvedRev === intentRev ? 'Approved' : 'Ready for decision'}.</h2>
<div class="v-row"><span class="v-badge"><i class="ti ti-message-2" aria-hidden="true"></i> Intent</span><span class="v-sec" style="font-size:13px">Intent gate · approve what and why before any code is read?</span></div>
<div class="v-row"><span style="font-weight:500;font-size:15px">${esc(id)}</span><span class="v-sec">${esc(intent.title)}</span><span class="v-chip">intent rev <span class="m">${esc(intentRev)}</span></span>${areasChip(intent)}</div>
<div class="v-h">Request (verbatim)</div><blockquote class="v-quote">${esc(intent.request)}</blockquote>
${problemSection(intent)}
${acceptanceSection(intent)}
${scopeSections(intent)}
${decisionsSection(intent)}
${questionsSection(questions)}
<div class="v-status">${verdictLines(blocked, intentRev, approvedRev)}</div>
<div class="v-row">${buttons}</div>
</div>`
}
