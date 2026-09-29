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

// Runs the loader's module script the way a widget would, with stand-ins for the elements it touches.
async function run(html: string): Promise<{ html: string; failed: boolean }> {
  const body = html.match(/<script type="module">\n([\s\S]*)<\/script>$/)?.[1]
  const data = html.match(/<script type="application\/json" id="v-data">([\s\S]*?)<\/script>/)?.[1]
  const start = html.match(/^<div id="v-root">([\s\S]*?)<\/div>\n<script/)?.[1]
  assert.ok(body && data !== undefined && start, 'loader has a root, a data element, and one module script')
  const classes: string[] = []
  const root = { innerHTML: start, classList: { add: (c: string) => classes.push(c) } }
  const elements: Record<string, unknown> = { 'v-root': root, 'v-data': { textContent: data } }
  const AsyncFunction = (async () => {}).constructor as new (...args: string[]) => (doc: unknown) => Promise<void>
  await new AsyncFunction('document', body)({ getElementById: (id: string) => elements[id] ?? null })
  return { html: root.innerHTML, failed: classes.includes('v-failed') }
}

const built = pathToFileURL(writeBuilt()).href

test('the loader draws views exactly like the widget format, in the given language', async () => {
  const some = [read('8.intent-gate.json'), read('8.plan-gate.json'), read('krw-12.1.result-gate.json')]
  for (const lang of ['en', 'ko'])
    assert.equal((await run(renderLoader(some, lang, built))).html, some.map((v) => renderView(v, lang)).join(''))
})

test('every golden view survives the trip through the loader', async () => {
  assert.equal((await run(renderLoader(views, 'ko', built))).html, views.map((v) => renderView(v, 'ko')).join(''))
})

test('when the renderer can not be loaded, the fallback says so in the viewer language with a redraw button', async () => {
  for (const lang of ['en', 'ko'] as const) {
    const t = CATALOGS[lang]
    const { html, failed } = await run(renderLoader([read('8.intent-gate.json')], lang, 'file:///nonexistent'))
    assert.ok(failed, lang)
    assert.ok(html.includes(t.loader.failed.replaceAll("'", '&#39;')), lang)
    assert.ok(html.includes(`>${t.loader.redraw} ↗</button>`), lang)
    assert.ok(html.includes(t.loader.redrawPrompt(t.title.intent('#8')).replaceAll("'", '&#39;')), lang)
  }
})

test('the output holds no backslash, and no "<" outside its tags, so retyping it changes nothing', () => {
  const view = read('8.intent-gate.json') as Extract<View, { view: 'intent-gate' }>
  const tricky = { ...view, intent: { ...view.intent, title: 'a </script> b \\u003c ~t ~ \n "q"' } }
  const html = renderLoader([tricky, ...views], 'ko', built)
  assert.ok(!html.includes('\\'), 'no backslash')
  const data = html.match(/id="v-data">([\s\S]*?)<\/script>/)?.[1] ?? ''
  assert.ok(!data.includes('<'), 'no < in the data')
  assert.equal(html.match(/<\/script>/g)?.length, 2)
})

test('data with ~, backslashes, quotes, newlines, and </script> round-trips through the loader', async () => {
  const view = read('8.intent-gate.json') as Extract<View, { view: 'intent-gate' }>
  const tricky = { ...view, intent: { ...view.intent, title: 'a </script> b \\u003c ~t ~b ~ \n "q"', request: 'x\ny\\z' } }
  assert.equal((await run(renderLoader([tricky], 'en', built))).html, renderView(tricky, 'en'))
})
