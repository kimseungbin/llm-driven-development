import { renderResultGate, type ResultGateView } from './result-gate.ts'
import { displayId } from './html.ts'
import { renderIntentGate, type IntentGateView } from './intent-gate.ts'
import { renderPlanGate, type PlanGateView } from './plan-gate.ts'

export type View = IntentGateView | PlanGateView | ResultGateView

export function renderView(view: View): string {
  switch (view.view) {
    case 'intent-gate':
      return renderIntentGate(view)
    case 'plan-gate':
      return renderPlanGate(view)
    case 'result-gate':
      return renderResultGate(view)
    default:
      throw new Error(`unknown view: ${(view as { view: unknown }).view}`)
  }
}

export function viewTitle(view: View): string {
  if (view.view === 'result-gate') return `${displayId(view.step.id)} result`
  return `${displayId(view.intent.id)} ${view.view === 'intent-gate' ? 'intent' : 'plan'}`
}
