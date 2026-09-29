                                               
                                                 

const entities                         = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

export const esc = (s        )         => s.replace(/[&<>"']/g, (c) => entities[c])

// Narrow columns otherwise break identifiers mid-word ("Money.precisio n").
export const symbol = (s        )         => esc(s).replaceAll('.', '.<wbr>')

// Numeric IDs read as GitHub-style references; other schemes (the KRW sample) display as-is.
export const displayId = (id        )         => (/^\d/.test(id) ? `#${id}` : id)

// Inside a plan the intent is named once in the header, so its own steps show only their suffix.
export const shortStepId = (stepId        , intentId        )         =>
  stepId.startsWith(`${intentId}.`) ? stepId.slice(intentId.length) : displayId(stepId)

export const plural =(n        , noun        )         => `${n} ${noun}${n === 1 ? '' : 's'}`

export const list = (items          , lang        )         => new Intl.ListFormat(lang, { type: 'conjunction' }).format(items)

// sendPrompt exists only inside a chat widget; elsewhere the prompt goes to the clipboard.
const SEND = "var p=this.dataset.prompt;typeof sendPrompt==='function'?sendPrompt(p):navigator.clipboard.writeText(p)"

export const promptButton = (label        , prompt        )         =>
  `<button type="button" data-prompt="${esc(prompt)}" onclick="${esc(SEND)}">${esc(label)} ↗</button>`

export function planCell(plan           , planned         , t          )         {
  if (!planned) return `<span class="v-dim">${t.result.na}</span>`
  if (plan === 'matched') return `<span class="v-ok"><i class="ti ti-check" aria-hidden="true"></i> ${t.planMatch.matched}</span>`
  return plan === 'unplanned' ? `<span class="v-warn">${t.planMatch.unplanned}</span>` : `<span class="v-bad">${t.planMatch.missing}</span>`
}
