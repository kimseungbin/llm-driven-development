import { git, tryGit } from './git.ts'
import type { Intent, PlanStep } from './model.ts'

export interface Snapshot {
  intent: Intent
  steps: PlanStep[]
}

export interface Event {
  type: 'import' | 'create' | 'edit' | 'decide' | 'approve'
  actor: 'human' | 'agent'
  subject: string
  trailers?: Record<string, string>
}

export interface LoggedEvent {
  sha: string
  type: string
  gate?: string
  rev?: string
  actor?: string
}

const ref = (id: string) => `refs/plans/${id}`
const json = (v: unknown) => `${JSON.stringify(v, null, 2)}\n`
const zeroOid = (repo: string) => '0'.repeat(git(repo, ['rev-parse', '--show-object-format']) === 'sha256' ? 64 : 40)

export const tip = (repo: string, id: string): string | null => tryGit(repo, ['rev-parse', '--verify', '-q', ref(id)])

export function listIds(repo: string): string[] {
  const out = git(repo, ['for-each-ref', '--format=%(refname:strip=2)', 'refs/plans/'])
  return out ? out.split('\n') : []
}

export function read(repo: string, id: string): { snapshot: Snapshot; tip: string } {
  const head = tip(repo, id)
  if (!head) throw new Error(`no ${ref(id)} in ${repo}`)
  const intent = JSON.parse(git(repo, ['show', `${head}:intent.json`]))
  const files = git(repo, ['ls-tree', '--name-only', head, 'steps/'])
  const steps: PlanStep[] = (files ? files.split('\n') : []).map((f) => JSON.parse(git(repo, ['show', `${head}:${f}`])))
  steps.sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }))
  return { snapshot: { intent, steps }, tip: head }
}

function writeTree(repo: string, snapshot: Snapshot): string {
  const blob = (content: string) => git(repo, ['hash-object', '-w', '--stdin'], content)
  const entries = [`100644 blob ${blob(json(snapshot.intent))}\tintent.json`]
  if (snapshot.steps.length) {
    const stepEntries = snapshot.steps.map((s) => `100644 blob ${blob(json(s))}\t${s.id}.json`)
    entries.push(`040000 tree ${git(repo, ['mktree'], `${stepEntries.join('\n')}\n`)}\tsteps`)
  }
  return git(repo, ['mktree'], `${entries.join('\n')}\n`)
}

// Each event is one commit whose tree is the full validated snapshot; the trailers say what happened.
export function commit(repo: string, id: string, snapshot: Snapshot, event: Event, expectedTip: string | null): string {
  const trailers = { Event: event.type, ...event.trailers, Actor: event.actor }
  const message = `${event.subject}\n\n${Object.entries(trailers)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')}\n`
  const parent = expectedTip ? ['-p', expectedTip] : []
  const sha = git(repo, ['commit-tree', writeTree(repo, snapshot), ...parent, '-F', '-'], message)
  // The expected old value makes this a compare-and-swap: a concurrent writer fails instead of being overwritten.
  git(repo, ['update-ref', ref(id), sha, expectedTip ?? zeroOid(repo)])
  return sha
}

export function events(repo: string, id: string): LoggedEvent[] {
  const field = (key: string) => `%(trailers:key=${key},valueonly,separator=%x2C)`
  const out = git(repo, ['log', `--format=%H%x1f${['Event', 'Gate', 'Rev', 'Actor'].map(field).join('%x1f')}`, ref(id)])
  return out.split('\n').map((line) => {
    const [sha, type, gate, rev, actor] = line.split('\x1f')
    return { sha, type, gate: gate || undefined, rev: rev || undefined, actor: actor || undefined }
  })
}

export const lastApproval = (repo: string, id: string, gate: 'intent' | 'plan'): string | null =>
  events(repo, id).find((e) => e.type === 'approve' && e.gate === gate)?.rev ?? null
