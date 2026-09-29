import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { test } from 'node:test'
import { pathToFileURL } from 'node:url'
import { renderView, type View } from '../src/render/index.ts'
import { CATALOGS } from '../src/render/lang/index.ts'
import { renderLoader } from '../src/render/loader.ts'
import { writeBuilt } from './helpers.ts'

const golden = new URL('./golden/', import.meta.url)
const read = (f: string) => JSON.parse(readFileSync(new URL(f, golden), 'utf8')) as View
const views = readdirSync(golden).filter((f) => f.endsWith('.json')).map(read)

// Runs the loader's module script the way a widget would, with a stand-in for the one element it touches.
async function run(html: string): Promise<string> {
  const body = html.match(/<script type="module">\n([\s\S]*)<\/script>$/)?.[1]
  assert.ok(body, 'loader has one module script')
  const root = { innerHTML: '' }
  const AsyncFunction = (async () => {}).constructor as new (...args: string[]) => (doc: unknown) => Promise<void>
  await new AsyncFunction('document', body)({ getElementById: (id: string) => (id === 'v-root' ? root : null) })
  return root.innerHTML
}

const built = pathToFileURL(writeBuilt()).href

test('the loader draws views exactly like the widget format, in the given language', async () => {
  const some = [read('8.intent-gate.json'), read('8.plan-gate.json'), read('krw-12.1.result-gate.json')]
  for (const lang of ['en', 'ko'])
    assert.equal(await run(renderLoader(some, lang, built)), some.map((v) => renderView(v, lang)).join(''))
})

test('every golden view survives the trip through the loader', async () => {
  assert.equal(await run(renderLoader(views, 'ko', built)), views.map((v) => renderView(v, 'ko')).join(''))
})

test('when the renderer can not be loaded, the fallback says so in the viewer language with a redraw button', async () => {
  for (const lang of ['en', 'ko'] as const) {
    const t = CATALOGS[lang]
    const html = await run(renderLoader([read('8.intent-gate.json')], lang, 'file:///nonexistent'))
    assert.ok(html.includes(t.loader.failed.replaceAll("'", '&#39;')), lang)
    assert.ok(html.includes(`>${t.loader.redraw} ↗</button>`), lang)
    assert.ok(html.includes(t.loader.redrawPrompt(t.title.intent('#8')).replaceAll("'", '&#39;')), lang)
  }
})

test('view data containing </script> does not end the script', () => {
  const view = read('8.intent-gate.json') as Extract<View, { view: 'intent-gate' }>
  const tricky = { ...view, intent: { ...view.intent, title: 'a </script><script>alert(1)</script>' } }
  const html = renderLoader([tricky], 'en', built)
  assert.equal(html.match(/<\/script>/g)?.length, 1)
})
