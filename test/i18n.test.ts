import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { esc } from '../src/render/html.ts'
import { renderView, type View } from '../src/render/index.ts'
import { CATALOGS, LANGS } from '../src/render/lang/index.ts'

const { en, ko } = CATALOGS

// Every leaf of a catalog, keyed by its path; functions are compared by how many parameters they take.
function leaves(value: unknown, path = ''): Map<string, unknown> {
  if (typeof value !== 'object' || value === null) return new Map([[path, value]])
  return new Map(Object.entries(value).flatMap(([k, v]) => [...leaves(v, path ? `${path}.${k}` : k)]))
}
const shape = (m: Map<string, unknown>) => [...m].map(([k, v]) => [k, typeof v === 'function' ? `fn/${v.length}` : typeof v])

const dir = new URL('./golden/', import.meta.url)
const views = await Promise.all(
  (await readdir(dir)).filter((f) => f.endsWith('.json')).map(async (f) => JSON.parse(await readFile(new URL(f, dir), 'utf8')) as View),
)

test('the catalogs are en and ko', () => {
  assert.deepEqual(LANGS, ['en', 'ko'])
})

test('every catalog has exactly the English keys', () => {
  for (const lang of LANGS) assert.deepEqual(shape(leaves(CATALOGS[lang])), shape(leaves(en)), lang)
})

test('catalog text is safe to insert as markup', () => {
  for (const lang of LANGS)
    for (const [key, v] of leaves(CATALOGS[lang])) if (typeof v === 'string') assert.doesNotMatch(v, /[<>&"]/, `${lang} ${key}`)
})

test('a view rendered in ko shows none of the English fixed text', () => {
  const english = [...leaves(en)].filter(([k, v]) => k !== 'lang' && typeof v === 'string').map(([, v]) => v as string)
  for (const view of views) {
    const html = renderView(view, 'ko')
    // Text right after a <wbr> is the tail of an authored symbol, not fixed text.
    const text = html.replaceAll('<wbr>', '')
    for (const s of english) {
      assert.ok(!text.includes(`>${s}<`), `"${s}" in ${view.view}`)
      assert.ok(!text.includes(`> ${s}<`), `"${s}" in ${view.view}`)
    }
  }
})

test('a ko button message names the same intent, gate, and rev as the en one', () => {
  for (const gate of ['intent', 'plan'] as const) {
    const [e, k] = [en[gate].approvePrompt('#8', 'abc1234'), ko[gate].approvePrompt('#8', 'abc1234')]
    for (const part of ['#8', 'abc1234']) assert.ok(e.includes(part) && k.includes(part), `${gate}: ${part}`)
  }
  assert.match(ko.intent.approvePrompt('#8', 'abc1234'), /인텐트 게이트/)
  assert.match(ko.plan.approvePrompt('#8', 'abc1234'), /계획 게이트/)
})

test('authored text renders exactly as stored in every language', () => {
  const view = views.find((v) => v.view === 'intent-gate') as Extract<View, { view: 'intent-gate' }>
  const authored = [view.intent.request, view.intent.problem, ...view.intent.acceptance, ...view.intent.decisions.map((d) => d.answer)]
  for (const lang of LANGS) {
    const html = renderView(view, lang)
    for (const text of authored) assert.ok(html.includes(esc(text)), `${lang}: ${text.slice(0, 40)}`)
  }
})

test('an unknown language fails with the list of languages', () => {
  assert.throws(() => renderView(views[0], 'fr'), /no catalog for language "fr" \(available: en, ko\)/)
})
