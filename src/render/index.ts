import { renderResultGate, type ResultGateView } from './result-gate.ts'
import { displayId } from './html.ts'
import { renderIntentGate, type IntentGateView } from './intent-gate.ts'
import { renderPlanGate, type PlanGateView } from './plan-gate.ts'
import { catalog } from './lang/index.ts'

export type View = IntentGateView | PlanGateView | ResultGateView

export function renderView(view: View, lang = 'en'): string {
  const t = catalog(lang)
  switch (view.view) {
    case 'intent-gate':
      return renderIntentGate(view, t)
    case 'plan-gate':
      return renderPlanGate(view, t)
    case 'result-gate':
      return renderResultGate(view, t)
    default:
      throw new Error(`unknown view: ${(view as { view: unknown }).view}`)
  }
}

export function viewTitle(view: View, lang = 'en'): string {
  const t = catalog(lang)
  if (view.view === 'result-gate') return t.title.result(displayId(view.step.id))
  return view.view === 'intent-gate' ? t.title.intent(displayId(view.intent.id)) : t.title.plan(displayId(view.intent.id))
}
