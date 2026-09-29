import type { PlanMatch } from './result-gate.ts'

const entities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

export const esc = (s: string): string => s.replace(/[&<>"']/g, (c) => entities[c])

// Narrow columns otherwise break identifiers mid-word ("Money.precisio n").
export const symbol = (s: string): string => esc(s).replaceAll('.', '.<wbr>')

// Numeric IDs read as GitHub-style references; other schemes (the KRW sample) display as-is.
export const displayId = (id: string): string => (/^\d/.test(id) ? `#${id}` : id)

// Inside a plan the intent is named once in the header, so its own steps show only their suffix.
export const shortStepId = (stepId: string, intentId: string): string =>
  stepId.startsWith(`${intentId}.`) ? stepId.slice(intentId.length) : displayId(stepId)

export const plural =(n: number, noun: string): string => `${n} ${noun}${n === 1 ? '' : 's'}`

export const list = (items: string[]): string => new Intl.ListFormat('en', { type: 'conjunction' }).format(items)

// sendPrompt exists only inside a chat widget; elsewhere the prompt goes to the clipboard.
const SEND = "var p=this.dataset.prompt;typeof sendPrompt==='function'?sendPrompt(p):navigator.clipboard.writeText(p)"

export const promptButton = (label: string, prompt: string): string =>
  `<button type="button" data-prompt="${esc(prompt)}" onclick="${esc(SEND)}">${esc(label)} ↗</button>`

export function planCell(plan: PlanMatch, planned: boolean): string {
  if (!planned) return '<span class="v-dim">n/a</span>'
  if (plan === 'matched') return '<span class="v-ok"><i class="ti ti-check" aria-hidden="true"></i> matched</span>'
  return plan === 'unplanned' ? '<span class="v-warn">unplanned</span>' : '<span class="v-bad">missing</span>'
}
