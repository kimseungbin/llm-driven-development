import { renderResultGate,                     } from './result-gate.js'
import { displayId } from './html.js'
import { renderIntentGate,                     } from './intent-gate.js'
import { renderPlanGate,                   } from './plan-gate.js'
import { catalog } from './lang/index.js'

                                                                 

export function renderView(view      , lang = 'en')         {
  const t = catalog(lang)
  switch (view.view) {
    case 'intent-gate':
      return renderIntentGate(view, t)
    case 'plan-gate':
      return renderPlanGate(view, t)
    case 'result-gate':
      return renderResultGate(view, t)
    default:
      throw new Error(`unknown view: ${(view                     ).view}`)
  }
}

export function viewTitle(view      , lang = 'en')         {
  const t = catalog(lang)
  if (view.view === 'result-gate') return t.title.result(displayId(view.step.id))
  return view.view === 'intent-gate' ? t.title.intent(displayId(view.intent.id)) : t.title.plan(displayId(view.intent.id))
}
