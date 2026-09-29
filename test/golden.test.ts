import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { renderView, viewTitle, type View } from '../src/render/index.ts'
import { renderPage } from '../src/render/page.ts'

// Each golden pair is a view model and the English HTML it rendered to before languages existed.
const dir = new URL('./golden/', import.meta.url)
const read = async (name: string) => readFile(new URL(name, dir), 'utf8')
const views = (await readdir(dir)).filter((f) => f.endsWith('.json'))

for (const file of views) {
  test(`${file} renders unchanged with no language`, async () => {
    const view = JSON.parse(await read(file)) as View
    assert.equal(renderView(view), await read(file.replace(/\.json$/, '.html')))
  })
}

test('a page renders unchanged with no language', async () => {
  const view = JSON.parse(await read('8.intent-gate.json')) as View
  assert.equal(renderPage(viewTitle(view), renderView(view)), await read('8.intent-gate.page.html'))
})
