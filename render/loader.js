import { esc, promptButton } from './html.js'
import {            viewTitle } from './index.js'
import { catalog } from './lang/index.js'
import { style } from './style.js'

// Inline JSON can't contain "<", or "</script>" in the data would end the script early.
const inline = (value         ) => JSON.stringify(value).replaceAll('<', '\\u003c')

// The view data plus a module script that imports the published renderer and draws it in place.
// When the import fails, the fallback is drawn without the renderer, so its text is inlined here.
export function renderLoader(views        , lang        , cdn        )         {
  const t = catalog(lang)
  const titles = views.map((v) => viewTitle(v, lang)).join(', ')
  const failed = `<div class="v">${style('')}<div class="v-status"><span class="v-warn"><i class="ti ti-plug-connected-x" aria-hidden="true"></i> ${esc(t.loader.failed)}</span></div><div class="v-row">${promptButton(t.loader.redraw, t.loader.redrawPrompt(titles))}</div></div>`
  return `<div id="v-root"></div>
<script type="module">
const root = document.getElementById('v-root')
try {
  const { renderView } = await import(${inline(`${cdn}/render/index.js`)})
  root.innerHTML = ${inline(views)}.map((view) => renderView(view, ${inline(lang)})).join('')
} catch {
  root.innerHTML = ${inline(failed)}
}
</script>`
}
