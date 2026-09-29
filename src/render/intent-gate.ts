import type { IncomingLink, Intent } from '../model.ts'
import { displayId, esc } from './html.ts'
import {
  acceptanceSection,
  areasChip,
  blockers,
  decisionsSection,
  gateButtons,
  INTENT_STYLE,
  linksSection,
  problemSection,
  questionsSection,
  scopeSections,
  verdictLines,
} from './intent.ts'
import type { Messages } from './lang/index.ts'
import { style } from './style.ts'

export interface IntentGateView {
  schemaVersion: 1
  view: 'intent-gate'
  intentRev: string
  approvedRev: string | null
  intent: Intent
  incoming?: IncomingLink[]
}

const STYLE = style(`${INTENT_STYLE}
.v-quote{margin:0;padding:6px 12px;border-left:2px solid var(--border-strong);border-radius:0;font-size:13px;color:var(--text-secondary);white-space:pre-wrap}`)

export function renderIntentGate(view: IntentGateView, t: Messages): string {
  const { intent, intentRev, approvedRev } = view
  const id = displayId(intent.id)
  const questions = intent.openQuestions
  const blocked = blockers(questions, t)
  const buttons = gateButtons(
    intent,
    questions,
    approvedRev === intentRev,
    [t.intent.approve, t.intent.approvePrompt(id, intentRev)],
    t.intent.changesPrompt(id, intentRev),
    t,
  )
  const state = blocked.length ? t.state.blocked : approvedRev === intentRev ? t.state.approved : t.state.ready

  return `<div class="v">${STYLE}
<h2 class="sr-only">${esc(t.intent.sr(id, intent.title, intentRev, state))}</h2>
<div class="v-row"><span class="v-badge"><i class="ti ti-message-2" aria-hidden="true"></i> ${t.intent.badge}</span><span class="v-sec" style="font-size:13px">${t.intent.gate}</span></div>
<div class="v-row"><span style="font-weight:500;font-size:15px">${esc(id)}</span><span class="v-sec">${esc(intent.title)}</span><span class="v-chip">${t.intentRev} <span class="m">${esc(intentRev)}</span></span>${areasChip(intent, t)}</div>
<div class="v-h">${t.intent.request}</div><blockquote class="v-quote">${esc(intent.request)}</blockquote>
${problemSection(intent, t)}
${acceptanceSection(intent, t.intent.acceptance)}
${scopeSections(intent, t)}
${linksSection(intent, view.incoming ?? [], t)}
${decisionsSection(intent, t)}
${questionsSection(questions, t.intent.needsDecision, t)}
<div class="v-status">${verdictLines(blocked, intentRev, approvedRev, t)}</div>
<div class="v-row">${buttons}</div>
</div>`
}
