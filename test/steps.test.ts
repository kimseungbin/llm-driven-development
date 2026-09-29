import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import type { Expect, StepKind } from '../src/model.ts'
import { importDir } from '../src/plan.ts'

const intent = {
  schemaVersion: 1,
  id: '1',
  kind: 'intent',
  title: 'test intent',
  request: 'test',
  problem: 'test',
  areas: ['be'],
  acceptance: ['test'],
  openQuestions: [],
  decisions: [],
}

// Stores one step through the write path in a fresh repo, so validation runs exactly as it does for real plans.
function store(kind: StepKind, expect: Expect) {
  const repo = mkdtempSync(join(tmpdir(), 'ldd-steps-'))
  execFileSync('git', ['-C', repo, 'init', '-q'])
  const dir = join(repo, 'draft')
  mkdirSync(join(dir, 'steps'), { recursive: true })
  writeFileSync(join(dir, 'intent.json'), JSON.stringify(intent))
  const step = { schemaVersion: 2, id: '1.1', parent: '1', kind, origin: 'planned', summary: 'test step', risk: 'low', riskReason: 'test', expect, evidence: ['test'], dependsOn: [] }
  writeFileSync(join(dir, 'steps', '1.1.json'), JSON.stringify(step))
  return () => importDir(repo, dir)
}

const section = { doc: 'propose-plan', section: 'Steps' }
const rule = { text: 'agents now name sections', checkedBy: 'human' as const }

test('an instructions step needs sections and a rule', () => {
  assert.throws(store('instructions', { rules: [rule] }), /1\.1: an instructions step needs sections and at least one rule/)
  assert.throws(store('instructions', { sections: [section] }), /1\.1: an instructions step needs sections and at least one rule/)
  assert.doesNotThrow(store('instructions', { sections: [section], rules: [rule] }))
})

test('a docs step needs sections', () => {
  assert.throws(store('docs', {}), /1\.1: a docs step needs sections/)
  assert.doesNotThrow(store('docs', { sections: [{ doc: 'docs/model/steps.md', section: 'Format version 2' }] }))
})

test('a code-kind step with sections is rejected', () => {
  assert.throws(store('feature', { add: [{ symbol: 'x' }], sections: [section] }), /only instructions, docs, non-semantic steps name sections/)
})

test('each section needs doc and section', () => {
  assert.throws(store('docs', { sections: [{ doc: 'docs/goals.md', section: '' }] }), /each section needs doc and section/)
})
