                                                           
import { displayId, esc, shortStepId, symbol } from './html.js'
import { acceptanceSection, areasChip, blockers, gateButtons, INTENT_STYLE, questionsSection, verdictLines } from './intent.js'
                                               
import { style } from './style.js'

                               
                  
                   
                   
                 
                                  
                                
                
                   
 

const riskTone = { low: 'v-ok', medium: 'v-warn', high: 'v-bad' }

function expectLines(e        , t          )           {
  const x = t.plan.expect
  const ref = (r                                    ) =>
    [r.symbol, r.type && `: ${r.type}`, r.signature && ` ${r.signature}`, r.from && r.to && ` ${r.from} → ${r.to}`].filter(Boolean).join('')
  return [
    ...(e.add ?? []).map((r) => `${x.add}: ${ref(r)}`),
    ...(e.remove ?? []).map((s) => `${x.remove}: ${s}`),
    ...(e.change ?? []).map((r) => `${x.change}: ${ref(r)}`),
    ...(e.unchanged ?? []).map((s) => `${x.unchanged}: ${s}`),
    ...(e.sections ?? []).map((r) => `${x.section}: ${r.doc} § ${r.section}`),
    ...(e.rules ?? []).map((c) => `${x.rule(x.checkedBy[c.checkedBy])}: ${c.text}`),
    ...(e.invariants ?? []).map((c) => `${x.invariant(x.checkedBy[c.checkedBy])}: ${c.text}`),
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

export function renderPlanGate(view              , t          )         {
  const { intent, steps, planRev, intentRev, approvedIntentRev, approvedPlanRev } = view
  const id = displayId(intent.id)
  // Intent-level questions are settled before planning starts, so only code-raised ones reach this gate.
  const questions = intent.openQuestions.filter((q) => q.origin === 'code')
  const blocked = blockers(questions, t)
  if (approvedIntentRev !== intentRev) blocked.push(t.plan.intentNotApproved(intentRev, approvedIntentRev))
  const short = (stepId        ) => shortStepId(stepId, intent.id)
  const hiddenReasons = steps.some((s) => s.risk !== 'high' && s.riskReason)

  const stepRows = steps.map((s) => {
    const discovered = s.origin === 'discovered' ? `<span class="v-pill v-warn">${t.plan.discovered}</span>` : ''
    const after = s.dependsOn.length ? `<span class="v-dim" style="font-size:12px">${t.plan.after(esc(s.dependsOn.map(short).join(', ')))}</span>` : ''
    const reason = s.riskReason
      ? `<div class="v-note${s.risk === 'high' ? '' : ' v-reason'}">${t.plan.riskReason(esc(s.riskReason))}</div>`
      : ''
    const lines = expectLines(s.expect, t).map((l) => `<div>${symbol(l)}</div>`).join('')
    return `<div class="v-step"><div class="v-row"><span style="font-weight:500" title="${esc(displayId(s.id))}">${esc(short(s.id))}</span><span class="v-chip m">${esc(s.kind)}</span><span class="v-pill ${riskTone[s.risk]}">${t.plan.risk[s.risk]}</span>${discovered}${after}</div>
<div>${esc(s.summary)}</div>${reason}${lines ? `<div class="v-expect">${lines}</div>` : ''}<div class="v-note">${t.plan.evidence(esc(s.evidence.join('; ')))}</div></div>`
  })

  const buttons = gateButtons(
    intent,
    questions,
    approvedPlanRev === planRev || blocked.length > 0,
    [t.plan.approve, t.plan.approvePrompt(id, planRev)],
    t.plan.changesPrompt(id, planRev),
    t,
  )
  const state = blocked.length ? t.state.blocked : approvedPlanRev === planRev ? t.state.approved : t.state.ready
  const stepCount = t.plan.steps(steps.length)

  return `<div class="v">${STYLE}
<h2 class="sr-only">${esc(t.plan.sr(id, intent.title, planRev, stepCount, state))}</h2>
<div class="v-row"><span class="v-badge"><i class="ti ti-list-check" aria-hidden="true"></i> ${t.plan.badge}</span><span class="v-sec" style="font-size:13px">${t.plan.gate}</span></div>
<div class="v-row"><span style="font-weight:500;font-size:15px">${esc(id)}</span><span class="v-sec">${esc(intent.title)}</span><span class="v-chip">${t.intentRev} <span class="m">${esc(intentRev)}</span></span><span class="v-chip">${t.planRev} <span class="m">${esc(planRev)}</span></span><span class="v-chip">${stepCount}</span>${areasChip(intent, t)}</div>
${acceptanceSection(intent, t.plan.acceptance(intentRev))}
${questionsSection(questions, t.plan.foundWhilePlanning, t)}
<div class="v-h">${t.plan.stepsInOrder}</div>
${hiddenReasons ? `<div class="v-row"><label class="v-toggle"><input type="checkbox" value="reasons">${t.plan.showReasons}</label></div>` : ''}
${stepRows.join('\n')}
<div class="v-status">${verdictLines(blocked, planRev, approvedPlanRev, t)}</div>
<div class="v-row">${buttons}</div>
</div>`
}
