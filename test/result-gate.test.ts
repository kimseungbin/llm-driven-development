import assert from 'node:assert/strict'
import { test } from 'node:test'
import { renderResultGate, type ReconItem, type ResultGateView } from '../src/render/result-gate.ts'

const item = (field: string, plan: ReconItem['plan'], extra: Partial<ReconItem> = {}): ReconItem => ({
  plan,
  breaking: false,
  category: 'added',
  classifiedBy: 'deterministic',
  detail: { field, before: null, after: 'string', impact: 'none' },
  ...extra,
})

const view = (items: ReconItem[]): ResultGateView => ({
  schemaVersion: 1,
  view: 'result-gate',
  mode: 'planned',
  step: { id: '9.1', summary: 'test step', kind: 'data-shape', planRev: 'abc1234' },
  observed: { range: 'main..test', head: 'def5678' },
  items,
  invariants: [],
})

const rowOrder = (html: string, fields: string[]) =>
  fields.toSorted((a, b) => html.indexOf(`<td class="m">${a}</td>`) - html.indexOf(`<td class="m">${b}</td>`))

const items = [
  item('fieldMatched', 'matched'),
  item('fieldInferred', 'matched', { classifiedBy: 'inferred', confidence: 0.6 }),
  item('fieldBreaking', 'matched', { breaking: true }),
  item('fieldMissing', 'missing'),
  item('fieldUnplannedBreaking', 'unplanned', { breaking: true }),
  item('fieldUnplanned', 'unplanned'),
]
const fields = items.map((i) => (i.detail as { field: string }).field)

test('result gate lists rows attention first', () => {
  assert.deepEqual(rowOrder(renderResultGate(view(items)), fields), [
    'fieldUnplannedBreaking',
    'fieldUnplanned',
    'fieldMissing',
    'fieldBreaking',
    'fieldInferred',
    'fieldMatched',
  ])
})

test('result gate renders every row', () => {
  const html = renderResultGate(view(items))
  for (const field of fields) assert.ok(html.includes(`<td class="m">${field}</td>`), field)
  assert.equal(html.match(/<tr data-breaking=/g)?.length, items.length)
})

test('result gate refuses a category the step kind can not produce', () => {
  const wrong = item('fieldMoved', 'matched', { category: 'moved' })
  assert.throws(
    () => renderResultGate(view([wrong])),
    /9\.1: fieldMoved is moved, which a data-shape step can't produce \(added, removed, renamed, type-changed, nullability-changed, or uncategorized\)/,
  )
})

test('result gate renders uncategorized changes in every kind', () => {
  const code = renderResultGate(view([item('fieldOdd', 'matched', { category: 'uncategorized' })]))
  assert.match(code, /<span class="v-pill ">uncategorized<\/span>/)
  const prose = renderResultGate({
    ...view([{ ...item('x', 'matched'), category: 'uncategorized', detail: { what: 'sectionOdd', from: 'a.md', why: 'unclear' } }]),
    step: { id: '9.2', summary: 'docs step', kind: 'docs', planRev: 'abc1234' },
  })
  assert.match(prose, /sectionOdd<\/td><td><span class="v-pill">uncategorized<\/span>/)
})

test('the breaking-only filter hides prose blocks as well as rows', () => {
  const html = renderResultGate({
    ...view([{ ...item('x', 'matched'), category: 'content-changed', detail: { what: 'paragraph', diff: '- a\n+ b', why: 'clearer' } }]),
    step: { id: '9.3', summary: 'docs step', kind: 'docs', planRev: 'abc1234' },
  })
  assert.ok(html.includes('.v:has(input[value=breaking]:checked) [data-breaking=false]{display:none}'))
  assert.match(html, /<div class="v-prose" data-breaking="false">/)
})
