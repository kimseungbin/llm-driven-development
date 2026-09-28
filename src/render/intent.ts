import type { Intent, Question } from '../model.ts'
import { displayId, esc, list, plural, promptButton } from './html.ts'

export const INTENT_STYLE = `
.v-list{margin:0;padding-left:20px;font-size:13px}
.v-q{border:0.5px solid var(--border-warning);border-radius:var(--radius);padding:8px 12px;margin-bottom:8px;font-size:13px}
.v-d{border:0.5px solid var(--border);border-radius:var(--radius);padding:8px 12px;margin-bottom:8px;font-size:13px}`

export const areasChip = (intent: Intent): string =>
  `<span class="v-chip">areas <span class="m">${esc(intent.areas.join(', '))}</span></span>`

export const problemSection = (intent: Intent): string =>
  `<div class="v-h">Problem</div><div style="font-size:13px">${esc(intent.problem)}</div>`

export const acceptanceSection = (intent: Intent, heading = 'Acceptance criteria'): string =>
  `<div class="v-h">${esc(heading)}</div><ul class="v-list">${intent.acceptance.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>`

export function scopeSections(intent: Intent): string {
  const deferred = intent.deferred?.length
    ? `<div class="v-h">Deferred (needs follow-up)</div><ul class="v-list">${intent.deferred.map((d) => `<li>${esc(d.item)} <span class="v-chip">follow-up <span class="m">${esc(displayId(d.followUp))}</span></span><div class="v-note">Why: ${esc(d.reason)}</div></li>`).join('')}</ul>`
    : ''
  const nonGoals = intent.nonGoals?.length
    ? `<div class="v-h">Non-goals</div><ul class="v-list">${intent.nonGoals.map((n) => `<li>${esc(n.item)}<div class="v-note">Why: ${esc(n.reason)}</div></li>`).join('')}</ul>`
    : ''
  return deferred + nonGoals
}

export function decisionsSection(intent: Intent): string {
  if (!intent.decisions?.length) return ''
  const rows = intent.decisions.map(
    (d) =>
      `<div class="v-d"><div><span class="v-ok" style="font-weight:500">${esc(d.id)}</span> ${esc(d.question)}</div><div style="margin-top:4px"><span class="v-sec">Decided:</span> ${esc(d.answer)}</div></div>`,
  )
  return `<div class="v-h">Decided</div>${rows.join('')}`
}

export function questionsSection(questions: Question[], heading = 'Needs your decision'): string {
  if (!questions.length) return ''
  const rows = questions.map(
    (q) =>
      `<div class="v-q"><div class="v-row" style="margin-bottom:0"><span class="v-warn" style="font-weight:500">${esc(q.id)}</span>${q.origin === 'code' ? '<span class="v-pill v-warn">found in code</span>' : ''}<span>${esc(q.text)}</span></div><div class="v-note">Proposed: ${esc(q.proposal)}</div></div>`,
  )
  return `<div class="v-h">${esc(heading)}</div>${rows.join('')}`
}

// Answers are part of what gets approved, so an open question blocks its gate.
export function blockers(questions: Question[]): string[] {
  const n = questions.length
  return n ? [`${plural(n, 'question')} need${n === 1 ? 's' : ''} your decision`] : []
}

// `lastApproved` is the rev of this gate's latest approval event, which may be older than `current`.
export function verdictLines(blocked: string[], current: string, lastApproved: string | null): string {
  const stale =
    lastApproved && lastApproved !== current
      ? `<span class="v-warn"><i class="ti ti-history" aria-hidden="true"></i> Changed since the last approval (rev <span class="m">${esc(lastApproved)}</span>), so it needs approving again.</span>`
      : ''
  if (blocked.length) return `${stale}<span class="v-warn"><i class="ti ti-lock" aria-hidden="true"></i> Approval blocked: ${esc(list(blocked))}.</span>`
  if (lastApproved === current)
    return `<span class="v-ok"><i class="ti ti-circle-check" aria-hidden="true"></i> Approved at rev <span class="m">${esc(current)}</span>.</span>`
  return `${stale}<span class="v-ok"><i class="ti ti-circle-check" aria-hidden="true"></i> Ready for your decision.</span>`
}

export function gateButtons(
  intent: Intent,
  questions: Question[],
  approved: boolean,
  approve: [label: string, prompt: string],
  changes: string,
): string {
  const id = displayId(intent.id)
  const ids = list(questions.map((q) => q.id))
  const buttons: string[] = []
  // No bulk accept: decisions are resolved one at a time, so none gets rubber-stamped.
  if (questions.length) buttons.push(promptButton('Resolve one by one', `Let's resolve ${ids} for ${id}, one question at a time.`))
  else if (!approved) buttons.push(promptButton(...approve))
  buttons.push(promptButton('Request changes', changes))
  return buttons.join('')
}
