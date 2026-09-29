import assert from 'node:assert/strict'
import { test } from 'node:test'
import { prose, type ProseChange } from '../src/render/kinds/prose.ts'
import type { ReconItem, ResultGateView } from '../src/render/result-gate.ts'

const item = (category: ReconItem['category'], detail: ProseChange, extra: Partial<ReconItem> = {}): ReconItem => ({
  plan: 'matched',
  breaking: false,
  category,
  classifiedBy: 'inferred',
  detail,
  ...extra,
})

const view = (items: ReconItem[]): ResultGateView => ({
  schemaVersion: 1,
  view: 'result-gate',
  mode: 'planned',
  step: { id: '9.1', summary: 'test step', kind: 'docs', planRev: 'abc1234' },
  observed: { range: 'main..test', head: 'def5678' },
  items,
  invariants: [],
})

const moved = item('moved', { what: 'sectionA', from: 'a.md', to: 'b.md', why: 'grouped' })
const removed = item('removed', { what: 'sectionB', from: 'a.md', why: 'obsolete' }, { breaking: true })
const reworded = item('content-changed', { what: 'paragraphC', diff: '- old words\n+ new words', why: 'clearer' })

test('mechanical changes are table rows', () => {
  const html = prose.body(view([moved]))
  assert.match(html, /<th>What<\/th><th>Change<\/th><th>From<\/th><th>To<\/th><th>Plan<\/th><th>Why<\/th>/)
  assert.match(html, /<tr data-breaking="false"><td class="m">sectionA<\/td>.*<td>a\.md<\/td><td>b\.md<\/td>.*grouped<\/td><\/tr>/)
})

test('wording changes are diff blocks with marked lines and a why line', () => {
  const html = prose.body(view([reworded]))
  assert.ok(!html.includes('<table'))
  assert.match(html, /<pre class="v-diff"><span class="v-del">- old words<\/span>\n<span class="v-add">\+ new words<\/span><\/pre>/)
  assert.match(html, /Why: clearer/)
})

test('changes keep their order, and consecutive rows share a table', () => {
  const html = prose.body(view([moved, removed, reworded, moved]))
  assert.equal(html.match(/<table/g)?.length, 2)
  const order = ['sectionA', 'sectionB', 'paragraphC'].map((w) => html.indexOf(w))
  assert.deepEqual(order, order.toSorted((a, b) => a - b))
  assert.ok(html.lastIndexOf('sectionA') > html.indexOf('paragraphC'))
})

test('every row and block carries data-breaking', () => {
  const html = prose.body(view([moved, removed, reworded]))
  assert.equal(html.match(/data-breaking="(true|false)"/g)?.length, 3)
  assert.match(html, /<tr data-breaking="true"><td class="m">sectionB/)
  assert.match(html, /<div class="v-prose" data-breaking="false">/)
})
