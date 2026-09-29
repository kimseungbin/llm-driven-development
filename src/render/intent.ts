import type { IncomingLink, Intent, Question } from '../model.ts'
import { displayId, esc, list, promptButton } from './html.ts'
import type { Messages } from './lang/index.ts'

export const INTENT_STYLE = `
.v-list{margin:0;padding-left:20px;font-size:13px}
.v-q{border:0.5px solid var(--border-warning);border-radius:var(--radius);padding:8px 12px;margin-bottom:8px;font-size:13px}
.v-d{border:0.5px solid var(--border);border-radius:var(--radius);padding:8px 12px;margin-bottom:8px;font-size:13px}`

export const areasChip = (intent: Intent, t: Messages): string =>
  `<span class="v-chip">${t.areas} <span class="m">${esc(intent.areas.join(', '))}</span></span>`

export const problemSection = (intent: Intent, t: Messages): string =>
  `<div class="v-h">${t.intent.problem}</div><div style="font-size:13px">${esc(intent.problem)}</div>`

export const acceptanceSection = (intent: Intent, heading: string): string =>
  `<div class="v-h">${esc(heading)}</div><ul class="v-list">${intent.acceptance.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>`

export function scopeSections(intent: Intent, t: Messages): string {
  const deferred = intent.deferred?.length
    ? `<div class="v-h">${t.intent.deferred}</div><ul class="v-list">${intent.deferred.map((d) => `<li>${esc(d.item)} <span class="v-chip">${t.intent.followUp} <span class="m">${esc(displayId(d.followUp))}</span></span><div class="v-note">${t.intent.why} ${esc(d.reason)}</div></li>`).join('')}</ul>`
    : ''
  const nonGoals = intent.nonGoals?.length
    ? `<div class="v-h">${t.intent.nonGoals}</div><ul class="v-list">${intent.nonGoals.map((n) => `<li>${esc(n.item)}<div class="v-note">${t.intent.why} ${esc(n.reason)}</div></li>`).join('')}</ul>`
    : ''
  return deferred + nonGoals
}

function incomingLabel(l: IncomingLink, t: Messages): string {
  const from = displayId(l.from)
  if (l.type === 'blocks') return t.intent.incoming.blocks(from)
  if (l.type === 'duplicates') return t.intent.incoming.duplicates(from)
  if (l.type === 'parent') return t.intent.incoming.parent(from)
  if (l.type === 'follow-up') return t.intent.incoming.followUp(from)
  return t.intent.incoming.step(displayId(l.step ?? l.from), displayId(l.on ?? ''))
}

// Outgoing follow-ups already show under Deferred, so this lists relations out and every kind of link in.
export function linksSection(intent: Intent, incoming: IncomingLink[], t: Messages): string {
  const rows = [
    ...(intent.relations ?? []).map((r) => t.intent.outgoing[r.type](displayId(r.target))),
    ...incoming.map((l) => incomingLabel(l, t)),
  ]
  if (!rows.length) return ''
  return `<div class="v-h">${t.intent.links}</div><ul class="v-list">${rows.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>`
}

export function decisionsSection(intent: Intent, t: Messages): string {
  if (!intent.decisions?.length) return ''
  const rows = intent.decisions.map(
    (d) =>
      `<div class="v-d"><div><span class="v-ok" style="font-weight:500">${esc(d.id)}</span> ${esc(d.question)}</div><div style="margin-top:4px"><span class="v-sec">${d.owner ? t.intent.decidedBy(esc(d.owner)) : t.intent.decidedLabel}</span> ${esc(d.answer)}</div></div>`,
  )
  return `<div class="v-h">${t.intent.decided}</div>${rows.join('')}`
}

export function questionsSection(questions: Question[], heading: string, t: Messages): string {
  if (!questions.length) return ''
  const rows = questions.map(
    (q) =>
      `<div class="v-q"><div class="v-row" style="margin-bottom:0"><span class="v-warn" style="font-weight:500">${esc(q.id)}</span>${q.origin === 'code' ? `<span class="v-pill v-warn">${t.intent.foundInCode}</span>` : ''}${q.owner ? `<span class="v-pill">${t.intent.owner(esc(q.owner))}</span>` : ''}<span>${esc(q.text)}</span></div><div class="v-note">${t.intent.proposed} ${esc(q.proposal)}</div></div>`,
  )
  return `<div class="v-h">${esc(heading)}</div>${rows.join('')}`
}

// Answers are part of what gets approved, so an open question blocks its gate, including one owned by someone else.
export function blockers(questions: Question[], t: Messages): string[] {
  const mine = questions.filter((q) => !q.owner).length
  const owned = questions.filter((q) => q.owner).map((q) => t.intent.waitsOn(q.id, q.owner ?? ''))
  return [...(mine ? [t.intent.questionsNeedYou(mine)] : []), ...owned]
}

// `lastApproved` is the rev of this gate's latest approval event, which may be older than `current`.
export function verdictLines(blocked: string[], current: string, lastApproved: string | null, t: Messages): string {
  const rev = (r: string) => `<span class="m">${esc(r)}</span>`
  const stale =
    lastApproved && lastApproved !== current
      ? `<span class="v-warn"><i class="ti ti-history" aria-hidden="true"></i> ${t.changedSince(rev(lastApproved))}</span>`
      : ''
  if (blocked.length) return `${stale}<span class="v-warn"><i class="ti ti-lock" aria-hidden="true"></i> ${t.approvalBlocked(esc(list(blocked, t.lang)))}</span>`
  if (lastApproved === current)
    return `<span class="v-ok"><i class="ti ti-circle-check" aria-hidden="true"></i> ${t.approvedAt(rev(current))}</span>`
  return `${stale}<span class="v-ok"><i class="ti ti-circle-check" aria-hidden="true"></i> ${t.readyForYou}</span>`
}

export function gateButtons(
  intent: Intent,
  questions: Question[],
  approved: boolean,
  approve: [label: string, prompt: string],
  changes: string,
  t: Messages,
): string {
  const id = displayId(intent.id)
  const ids = list(questions.map((q) => q.id), t.lang)
  const buttons: string[] = []
  // No bulk accept: decisions are resolved one at a time, so none gets rubber-stamped.
  if (questions.length) buttons.push(promptButton(t.resolveOneByOne, t.resolvePrompt(ids, id)))
  else if (!approved) buttons.push(promptButton(...approve))
  buttons.push(promptButton(t.requestChanges, changes))
  return buttons.join('')
}
