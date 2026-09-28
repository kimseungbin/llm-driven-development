import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { AREAS, type Intent, type PlanStep } from './model.ts'
import type { IntentGateView } from './render/intent-gate.ts'
import type { PlanGateView } from './render/plan-gate.ts'
import { commit, lastApproval, listIds, read, type Snapshot } from './store.ts'

// Key order must not affect the hash, or reformatting a file would invalidate an approval.
const canonical = (v: unknown): unknown =>
  Array.isArray(v)
    ? v.map(canonical)
    : v && typeof v === 'object'
      ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canonical((v as Record<string, unknown>)[k])]))
      : v

const hash = (v: unknown) => createHash('sha256').update(JSON.stringify(canonical(v))).digest('hex').slice(0, 7)
const intentRev = (s: Snapshot) => hash(s.intent)
const planRev = (s: Snapshot) => hash({ intent: s.intent, steps: s.steps })
const same = (a: unknown, b: unknown) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b))

type Need = (ok: unknown, message: string) => void

function collect(check: (need: Need) => void): string[] {
  const errors: string[] = []
  check((ok, message) => void (ok || errors.push(message)))
  return errors
}

// Mirrors the structure-request and propose-plan skills: they guide authors, this rejects what slips through.
const validateIntent = (intent: Intent) =>
  collect((need) => {
    need(intent.schemaVersion === 1, 'intent: schemaVersion must be 1')
    need(/^\d+$/.test(intent.id ?? ''), 'intent: id must be a number written as a string, like "7"')
    need(intent.request, "intent: request (the human's words, verbatim) is required")
    need(intent.problem, 'intent: problem is required')
    need(
      intent.areas?.length && intent.areas.every((a) => (AREAS as readonly string[]).includes(a)),
      `intent: areas needs one or more of ${AREAS.join(', ')}`,
    )
    need(intent.acceptance?.length, 'intent: acceptance needs at least one criterion')
    need(!('outOfScope' in intent), 'intent: outOfScope was split into deferred (future work) and nonGoals (never)')
    for (const [i, d] of (intent.deferred ?? []).entries())
      need(d?.item && d?.reason && d?.followUp, `intent: deferred[${i}] needs item, reason, and followUp`)
    for (const [i, n] of (intent.nonGoals ?? []).entries()) need(n?.item && n?.reason, `intent: nonGoals[${i}] needs item and reason`)
    need(Array.isArray(intent.openQuestions), 'intent: openQuestions is required (empty when nothing is open)')
    for (const q of intent.openQuestions ?? []) {
      need(q?.id && q?.text && q?.proposal, `intent: question ${q?.id ?? '?'} needs id, text, and proposal`)
      need(!q?.origin || q.origin === 'request' || q.origin === 'code', `intent: question ${q?.id} origin must be request or code`)
    }
    for (const d of intent.decisions ?? []) need(d?.id && d?.question && d?.answer, `intent: decision ${d?.id ?? '?'} needs id, question, and answer`)
    const ids = [...(intent.openQuestions ?? []), ...(intent.decisions ?? [])].map((x) => x?.id)
    need(new Set(ids).size === ids.length, 'intent: question and decision ids must be unique')
  })

const validateSteps = (intent: Intent, steps: PlanStep[]) =>
  collect((need) => {
    const ids = new Set(steps.map((s) => s.id))
    const pattern = new RegExp(`^${intent.id}\\.\\d+$`)
    for (const s of steps) {
      need(pattern.test(s.id) && s.parent === intent.id, `${s.id}: step ids look like ${intent.id}.<n>, with parent ${intent.id}`)
      need(s.kind && s.summary, `${s.id}: kind and summary are required`)
      need(s.evidence?.length, `${s.id}: evidence is required`)
      for (const d of s.dependsOn ?? []) need(ids.has(d), `${s.id}: dependsOn ${d} is not a step in this plan`)
    }
  })

// Anything askable without the code belongs to the intent gate; planning starts only once it's settled.
const validatePlanStart = (intent: Intent) =>
  collect((need) => {
    for (const q of intent.openQuestions)
      need(q.origin === 'code', `intent: ${q.id} must be settled at the intent gate before planning`)
  })

function assertValid(where: string, errors: string[]) {
  if (errors.length) throw new Error(`invalid plan ${where}:\n  ${errors.join('\n  ')}`)
}

const validate = (where: string, s: Snapshot) => assertValid(where, [...validateIntent(s.intent), ...validateSteps(s.intent, s.steps)])

function readDir(dir: string): Snapshot {
  const intent = JSON.parse(readFileSync(join(dir, 'intent.json'), 'utf8'))
  const stepsDir = join(dir, 'steps')
  const files = existsSync(stepsDir) ? readdirSync(stepsDir).filter((f) => f.endsWith('.json')) : []
  const steps: PlanStep[] = files.map((f) => JSON.parse(readFileSync(join(stepsDir, f), 'utf8')))
  steps.sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }))
  return { intent, steps }
}

export function nextId(repo: string): string {
  return String(Math.max(0, ...listIds(repo).filter((id) => /^\d+$/.test(id)).map(Number)) + 1)
}

// Creating with no expected tip only succeeds if the ref doesn't exist yet, so racing creators can't share an ID.
export function create(repo: string, dir: string): string {
  const draft = readDir(dir)
  for (let attempt = 0; attempt < 3; attempt++) {
    const id = nextId(repo)
    const snapshot = { intent: { ...draft.intent, id }, steps: [] }
    validate(`#${id}`, snapshot)
    try {
      commit(repo, id, snapshot, { type: 'create', actor: 'agent', subject: `create #${id}: ${snapshot.intent.title}` }, null)
      return id
    } catch (error) {
      if (attempt === 2) throw error
    }
  }
  throw new Error('unreachable')
}

export function importDir(repo: string, dir: string): string {
  const snapshot = readDir(dir)
  validate(`#${snapshot.intent.id}`, snapshot)
  const subject = `import #${snapshot.intent.id} from ${dir}`
  const trailers = { Note: 'content recorded before git storage existed; earlier edits have no history' }
  commit(repo, snapshot.intent.id, snapshot, { type: 'import', actor: 'agent', subject, trailers }, null)
  return snapshot.intent.id
}

export function exportTo(repo: string, id: string, dir: string): void {
  const { snapshot } = read(repo, id)
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(join(dir, 'steps'), { recursive: true })
  writeFileSync(join(dir, 'intent.json'), `${JSON.stringify(snapshot.intent, null, 2)}\n`)
  for (const s of snapshot.steps) writeFileSync(join(dir, 'steps', `${s.id}.json`), `${JSON.stringify(s, null, 2)}\n`)
}

// Agent edits go through here. Decisions are the human's, so an edit may not add, drop, or reword one.
export function edit(repo: string, id: string, dir: string, message: string): void {
  const { snapshot: current, tip } = read(repo, id)
  const next = readDir(dir)
  assertValid(`#${id}`, [
    ...(next.intent.id === id ? [] : [`edit: intent id changed from ${id} to ${next.intent.id}`]),
    ...(same(current.intent.decisions ?? [], next.intent.decisions ?? []) ? [] : ['edit: decisions can only change through decide']),
  ])
  validate(`#${id}`, next)
  commit(repo, id, next, { type: 'edit', actor: 'agent', subject: `edit #${id}: ${message}` }, tip)
}

// Records the human's answer. Callers pass what the human chose; agents never supply answers of their own.
export function decide(repo: string, id: string, questionId: string, answer: string): void {
  const { snapshot, tip } = read(repo, id)
  const intent = structuredClone(snapshot.intent)
  const index = intent.openQuestions.findIndex((q) => q.id === questionId)
  if (index < 0) throw new Error(`#${id}: no open question ${questionId}`)
  const [q] = intent.openQuestions.splice(index, 1)
  ;(intent.decisions ??= []).push({ id: q.id, question: q.text, answer, origin: q.origin ?? 'request' })
  const next = { intent, steps: snapshot.steps }
  validate(`#${id}`, next)
  commit(repo, id, next, { type: 'decide', actor: 'human', subject: `decide ${questionId} on #${id}`, trailers: { Question: questionId } }, tip)
}

// A human decision. The rev must match what's current, so an approval always covers exactly what the human saw.
// `via: 'agent'` means an agent ran it on the human's explicit instruction; the trailer keeps that visible.
export function approve(repo: string, id: string, gate: 'intent' | 'plan', rev: string, via?: 'agent'): void {
  const { snapshot, tip } = read(repo, id)
  const current = gate === 'intent' ? intentRev(snapshot) : planRev(snapshot)
  const problems: string[] = []
  if (rev !== current) problems.push(`approve: you approved ${gate} rev ${rev}, but the current rev is ${current}`)
  if (snapshot.intent.openQuestions.length) problems.push(`approve: ${snapshot.intent.openQuestions.length} open question(s) must be decided first`)
  if (gate === 'plan') {
    if (!snapshot.steps.length) problems.push('approve: the plan has no steps')
    const approvedIntent = lastApproval(repo, id, 'intent')
    if (approvedIntent !== intentRev(snapshot))
      problems.push(`approve: intent rev ${intentRev(snapshot)} isn't approved (last approved: ${approvedIntent ?? 'never'})`)
  }
  assertValid(`#${id}`, problems)
  const trailers = { Gate: gate, Rev: rev, ...(via ? { Via: via } : {}) }
  commit(repo, id, snapshot, { type: 'approve', actor: 'human', subject: `approve ${gate} rev ${rev} on #${id}`, trailers }, tip)
}

export function loadIntentGate(repo: string, id: string): IntentGateView {
  const { snapshot } = read(repo, id)
  assertValid(`#${id}`, validateIntent(snapshot.intent))
  return { schemaVersion: 1, view: 'intent-gate', intentRev: intentRev(snapshot), approvedRev: lastApproval(repo, id, 'intent'), intent: snapshot.intent }
}

export function loadPlanGate(repo: string, id: string): PlanGateView {
  const { snapshot } = read(repo, id)
  validate(`#${id}`, snapshot)
  assertValid(`#${id}`, validatePlanStart(snapshot.intent))
  return {
    schemaVersion: 1,
    view: 'plan-gate',
    intentRev: intentRev(snapshot),
    planRev: planRev(snapshot),
    approvedIntentRev: lastApproval(repo, id, 'intent'),
    approvedPlanRev: lastApproval(repo, id, 'plan'),
    intent: snapshot.intent,
    steps: snapshot.steps,
  }
}
