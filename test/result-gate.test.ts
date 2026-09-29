import assert from 'node:assert/strict'
import { test } from 'node:test'
import { renderResultGate, type ReconItem, type ResultGateView } from '../src/render/result-gate.ts'

const item = (field: string, plan: ReconItem['plan'], extra: Partial<ReconItem> = {}): ReconItem => ({
  plan,
  breaking: false,
  classifiedBy: 'deterministic',
  detail: { field, before: null, after: 'string', change: 'added', impact: 'none' },
  ...extra,
})

const view = (items: ReconItem[]): ResultGateView => ({
  schemaVersion: 1,
  view: 'result-gate',
  mode: 'planned',
  step: { id: '9.1', summary: 'test step', kind: 'data-shape', planRev: 'abc1234' },
  observed: { kind: 'data-shape', range: 'main..test', head: 'def5678' },
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
