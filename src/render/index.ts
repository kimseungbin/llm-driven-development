import { renderEvidenceGate, type EvidenceGateView } from './evidence-gate.ts'
import { displayId } from './html.ts'
import { renderIntentGate, type IntentGateView } from './intent-gate.ts'
import { renderPlanGate, type PlanGateView } from './plan-gate.ts'

export type View = IntentGateView | PlanGateView | EvidenceGateView

export function renderView(view: View): string {
  switch (view.view) {
    case 'intent-gate':
      return renderIntentGate(view)
    case 'plan-gate':
      return renderPlanGate(view)
    case 'evidence-gate':
      return renderEvidenceGate(view)
    default:
      throw new Error(`unknown view: ${(view as { view: unknown }).view}`)
  }
}

export function viewTitle(view: View): string {
  if (view.view === 'evidence-gate') return `${displayId(view.step.id)} review`
  return `${displayId(view.intent.id)} ${view.view === 'intent-gate' ? 'intent' : 'plan'}`
}
