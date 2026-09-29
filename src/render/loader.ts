import { esc, promptButton } from './html.ts'
import { type View, viewTitle } from './index.ts'
import { catalog } from './lang/index.ts'
import { style } from './style.ts'

// Claude passes this markup to the widget by retyping it, and a retyped backslash escape can arrive
// decoded: an escaped "</script>" in the data becomes a real one and ends the script. So the output holds
// no backslash and no "<" outside its own tags. The payload is JSON with "~" written as "~t", backslash
// as "~b", and "<" as "~l", which the script turns back without writing either character itself.
const encode = (value: unknown) => JSON.stringify(value).replaceAll('~', '~t').replaceAll('\\', '~b').replaceAll('<', '~l')

// The fallback is the root's starting content, so it also shows when the script can't run at all. It
// fades in after a delay that a successful render never reaches, and at once when the import fails.
const FALLBACK_STYLE = '#v-root .v-wait{opacity:0;animation:v-show 0s 4s forwards}#v-root.v-failed .v-wait{animation:none;opacity:1}@keyframes v-show{to{opacity:1}}'

// The views' data plus a module script that imports the published renderer and draws them in place.
export function renderLoader(views: View[], lang: string, cdn: string): string {
  const t = catalog(lang)
  const titles = views.map((v) => viewTitle(v, lang)).join(', ')
  const fallback = `<div class="v v-wait">${style(FALLBACK_STYLE)}<div class="v-status"><span class="v-warn"><i class="ti ti-plug-connected-x" aria-hidden="true"></i> ${esc(t.loader.failed)}</span></div><div class="v-row">${promptButton(t.loader.redraw, t.loader.redrawPrompt(titles))}</div></div>`
  return `<div id="v-root">${fallback}</div>
<script type="application/json" id="v-data">${encode({ cdn, lang, views })}</script>
<script type="module">
const root = document.getElementById('v-root')
try {
  const back = { b: String.fromCharCode(92), l: String.fromCharCode(60), t: '~' }
  const text = document.getElementById('v-data').textContent.replace(/~(.)/g, (_, c) => back[c])
  const { cdn, lang, views } = JSON.parse(text)
  const { renderView } = await import(cdn + '/render/index.js')
  root.innerHTML = views.map((view) => renderView(view, lang)).join('')
} catch {
  root.classList.add('v-failed')
}
</script>`
}
