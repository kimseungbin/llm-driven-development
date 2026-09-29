import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { DEFAULT_AREAS, EXPECT_FIELDS, type IncomingLink, type Intent, type PlanStep, RELATION_TYPES, RISKS, STEP_KINDS, type StepKind } from './model.ts'
import type { IntentGateView } from './render/intent-gate.ts'
import type { PlanGateView } from './render/plan-gate.ts'
import { commit, commitConfig, configTip, lastApproval, listIds, read, readConfig, type Snapshot } from './store.ts'

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
const validateIntent = (intent: Intent, areas: readonly string[]) =>
  collect((need) => {
    need(intent.schemaVersion === 1, 'intent: schemaVersion must be 1')
    need(/^\d+$/.test(intent.id ?? ''), 'intent: id must be a number written as a string, like "7"')
    need(intent.request, "intent: request (the human's words, verbatim) is required")
    need(intent.problem, 'intent: problem is required')
    need(
      intent.areas?.length && intent.areas.every((a) => areas.includes(a)),
      `intent: areas needs one or more of this repo's areas: ${areas.join(', ')}`,
    )
    need(intent.acceptance?.length, 'intent: acceptance needs at least one criterion')
    need(!('outOfScope' in intent), 'intent: outOfScope was split into deferred (future work) and nonGoals (never)')
    for (const [i, d] of (intent.deferred ?? []).entries())
      need(d?.item && d?.reason && d?.followUp, `intent: deferred[${i}] needs item, reason, and followUp`)
    for (const [i, n] of (intent.nonGoals ?? []).entries()) need(n?.item && n?.reason, `intent: nonGoals[${i}] needs item and reason`)
    for (const [i, r] of (intent.relations ?? []).entries()) {
      need((RELATION_TYPES as readonly string[]).includes(r?.type), `intent: relations[${i}] type must be one of ${RELATION_TYPES.join(', ')}`)
      need(/^\d+$/.test(r?.target ?? '') && r.target !== intent.id, `intent: relations[${i}] target must be another intent's id`)
    }
    const links = (intent.relations ?? []).map((r) => `${r?.type} ${r?.target}`)
    need(new Set(links).size === links.length, 'intent: each relation is listed once')
    need(Array.isArray(intent.openQuestions), 'intent: openQuestions is required (empty when nothing is open)')
    for (const q of intent.openQuestions ?? []) {
      need(q?.id && q?.text && q?.proposal, `intent: question ${q?.id ?? '?'} needs id, text, and proposal`)
      need(!q?.origin || q.origin === 'request' || q.origin === 'code', `intent: question ${q?.id} origin must be request or code`)
      need(q?.owner === undefined || (typeof q.owner === 'string' && q.owner.trim().length > 0), `intent: question ${q?.id} owner must be a name when set`)
    }
    for (const d of intent.decisions ?? []) need(d?.id && d?.question && d?.answer, `intent: decision ${d?.id ?? '?'} needs id, question, and answer`)
    const ids = [...(intent.openQuestions ?? []), ...(intent.decisions ?? [])].map((x) => x?.id)
    need(new Set(ids).size === ids.length, 'intent: question and decision ids must be unique')
  })

// A symbol is one token; anything with spaces is prose and belongs in rules or invariants.
const isSymbol = (s: unknown) => typeof s === 'string' && s.length > 0 && !/\s/.test(s)

// What each kind must state so that reconciliation has something to check.
const kindNeeds: Record<StepKind, [check: (e: PlanStep['expect']) => boolean, message: string]> = {
  'data-shape': [(e) => !!(e.add?.length || e.remove?.length || e.change?.length), 'needs add, remove, or change'],
  'signature-change': [(e) => !!e.change?.length && e.change.every((c) => c.from && c.to), 'needs change entries with from and to'],
  'behavior-change': [(e) => !!(e.change?.length && e.rules?.length), 'needs the changed symbols and at least one rule'],
  feature: [(e) => !!e.add?.length, 'needs add'],
  'non-semantic': [() => true, ''],
  other: [() => true, ''],
}

function validateExpect(s: PlanStep, need: Need) {
  const e = s.expect
  if (!e || typeof e !== 'object') return need(false, `${s.id}: expect is required`)
  for (const key of Object.keys(e))
    need((EXPECT_FIELDS as readonly string[]).includes(key), `${s.id}: expect.${key} isn't a field (${EXPECT_FIELDS.join(', ')})`)
  for (const r of [...(e.add ?? []), ...(e.change ?? [])]) need(isSymbol(r?.symbol), `${s.id}: "${r?.symbol}" isn't a symbol; prose goes in rules or invariants`)
  for (const x of [...(e.remove ?? []), ...(e.unchanged ?? [])]) need(isSymbol(x), `${s.id}: "${x}" isn't a symbol; prose goes in rules or invariants`)
  for (const c of [...(e.rules ?? []), ...(e.invariants ?? [])])
    need(c?.text && (c.checkedBy === 'test' || c.checkedBy === 'human'), `${s.id}: rules and invariants need text and checkedBy (test or human)`)
  const [check, message] = kindNeeds[s.kind] ?? [() => true, '']
  need(check(e), `${s.id}: a ${s.kind} step ${message}`)
}

const validateSteps = (intent: Intent, steps: PlanStep[]) =>
  collect((need) => {
    const ids = new Set(steps.map((s) => s.id))
    const pattern = new RegExp(`^${intent.id}\\.\\d+$`)
    for (const s of steps) {
      need(s.schemaVersion === 2, `${s.id}: steps use format version 2`)
      need(pattern.test(s.id) && s.parent === intent.id, `${s.id}: step ids look like ${intent.id}.<n>, with parent ${intent.id}`)
      need(s.summary, `${s.id}: summary is required`)
      need((STEP_KINDS as readonly string[]).includes(s.kind), `${s.id}: kind must be one of ${STEP_KINDS.join(', ')}`)
      need((RISKS as readonly string[]).includes(s.risk), `${s.id}: risk must be low, medium, or high`)
      need(s.risk !== 'high' || s.riskReason, `${s.id}: a high-risk step needs a riskReason`)
      need(s.evidence?.length, `${s.id}: evidence is required`)
      for (const d of s.dependsOn ?? [])
        need(ids.has(d) || (/^\d+\.\d+$/.test(d) && !d.startsWith(`${intent.id}.`)), `${s.id}: dependsOn ${d} is not a step in this plan or another intent's step`)
      validateExpect(s, need)
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

// Links reach into other intents' refs, so a link to an intent or step that doesn't exist is rejected here.
const validateLinks = (repo: string, s: Snapshot) =>
  collect((need) => {
    const known = new Set(listIds(repo))
    for (const r of s.intent.relations ?? []) need(known.has(r.target), `intent: relations ${r.type} #${r.target}: no such intent`)
    for (const step of s.steps)
      for (const d of step.dependsOn ?? []) {
        const target = d.split('.')[0]
        if (target === s.intent.id) continue
        need(known.has(target) && read(repo, target).snapshot.steps.some((t) => t.id === d), `${step.id}: dependsOn ${d}: no such step`)
      }
  })

const validate = (where: string, s: Snapshot, repo: string) =>
  assertValid(where, [...validateIntent(s.intent, loadAreas(repo)), ...validateSteps(s.intent, s.steps), ...validateLinks(repo, s)])

export const loadAreas = (repo: string): string[] => readConfig(repo)?.areas ?? [...DEFAULT_AREAS]

// The human confirms the list (the setup-areas skill proposes it); this records it as an event on refs/ldd/config.
// Intents that use an area outside the new list stay stored but fail validation until their areas are edited.
export function setAreas(repo: string, areas: string[]): string[] {
  assertValid('config', [
    ...(areas.length ? [] : ['config: areas needs at least one area']),
    ...(areas.every((a) => /^[a-z][a-z0-9-]*$/.test(a)) ? [] : ['config: an area is a short lowercase name, like be or cli']),
    ...(new Set(areas).size === areas.length ? [] : ['config: each area is listed once']),
  ])
  commitConfig(repo, { schemaVersion: 1, areas }, { type: 'configure', actor: 'human', subject: `configure areas: ${areas.join(', ')}` }, configTip(repo))
  return listIds(repo).filter((id) => read(repo, id).snapshot.intent.areas.some((a) => !areas.includes(a)))
}

// Reverse links are computed, never stored: every other intent's relations, follow-ups, and step dependencies that point here.
export function incomingLinks(repo: string, id: string): IncomingLink[] {
  const links: IncomingLink[] = []
  for (const other of listIds(repo)) {
    if (other === id) continue
    const { intent, steps } = read(repo, other).snapshot
    for (const r of intent.relations ?? []) if (r.target === id) links.push({ from: other, type: r.type })
    if ((intent.deferred ?? []).some((d) => d.followUp === id)) links.push({ from: other, type: 'follow-up' })
    for (const s of steps)
      for (const d of s.dependsOn ?? []) if (d.startsWith(`${id}.`)) links.push({ from: other, type: 'step-dependency', step: s.id, on: d })
  }
  return links
}

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
    validate(`#${id}`, snapshot, repo)
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
  validate(`#${snapshot.intent.id}`, snapshot, repo)
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
  validate(`#${id}`, next, repo)
  commit(repo, id, next, { type: 'edit', actor: 'agent', subject: `edit #${id}: ${message}` }, tip)
}

// Records the human's answer. Callers pass what the human chose; agents never supply answers of their own.
export function decide(repo: string, id: string, questionId: string, answer: string): void {
  const { snapshot, tip } = read(repo, id)
  const intent = structuredClone(snapshot.intent)
  const index = intent.openQuestions.findIndex((q) => q.id === questionId)
  if (index < 0) throw new Error(`#${id}: no open question ${questionId}`)
  const [q] = intent.openQuestions.splice(index, 1)
  ;(intent.decisions ??= []).push({ id: q.id, question: q.text, answer, origin: q.origin ?? 'request', ...(q.owner ? { owner: q.owner } : {}) })
  const next = { intent, steps: snapshot.steps }
  validate(`#${id}`, next, repo)
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
  assertValid(`#${id}`, validateIntent(snapshot.intent, loadAreas(repo)))
  return {
    schemaVersion: 1,
    view: 'intent-gate',
    intentRev: intentRev(snapshot),
    approvedRev: lastApproval(repo, id, 'intent'),
    intent: snapshot.intent,
    incoming: incomingLinks(repo, id),
  }
}

export function loadPlanGate(repo: string, id: string): PlanGateView {
  const { snapshot } = read(repo, id)
  validate(`#${id}`, snapshot, repo)
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
