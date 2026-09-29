import { git, tryGit } from './git.ts'
import type { Intent, PlanStep, RepoConfig } from './model.ts'

export interface Snapshot {
  intent: Intent
  steps: PlanStep[]
}

export interface Event {
  type: 'import' | 'create' | 'edit' | 'decide' | 'approve' | 'configure'
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

// The one place the plan ref prefix is spelled out; ref, listIds, and syncRefspecs all derive from it.
const PLAN_PREFIX = 'refs/plans/'
const ref = (id: string) => `${PLAN_PREFIX}${id}`
const json = (v: unknown) => `${JSON.stringify(v, null, 2)}\n`
const zeroOid = (repo: string) => '0'.repeat(git(repo, ['rev-parse', '--show-object-format']) === 'sha256' ? 64 : 40)

export const tip = (repo: string, id: string): string | null => tryGit(repo, ['rev-parse', '--verify', '-q', ref(id)])

export function listIds(repo: string): string[] {
  const depth = PLAN_PREFIX.split('/').filter(Boolean).length
  const out = git(repo, ['for-each-ref', `--format=%(refname:lstrip=${depth})`, PLAN_PREFIX])
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

function commitTree(repo: string, refName: string, tree: string, event: Event, expectedTip: string | null): string {
  const trailers = { Event: event.type, ...event.trailers, Actor: event.actor }
  const message = `${event.subject}\n\n${Object.entries(trailers)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')}\n`
  const parent = expectedTip ? ['-p', expectedTip] : []
  const sha = git(repo, ['commit-tree', tree, ...parent, '-F', '-'], message)
  // The expected old value makes this a compare-and-swap: a concurrent writer fails instead of being overwritten.
  git(repo, ['update-ref', refName, sha, expectedTip ?? zeroOid(repo)])
  return sha
}

// Each event is one commit whose tree is the full validated snapshot; the trailers say what happened.
export const commit = (repo: string, id: string, snapshot: Snapshot, event: Event, expectedTip: string | null): string =>
  commitTree(repo, ref(id), writeTree(repo, snapshot), event, expectedTip)

// The repo's config lives next to the plans, so it works on repos you don't own, with the same event history.
export const CONFIG_REF = 'refs/ldd/config'

// No "+" on plan or config refspecs: they only move forward, so a ref that diverged on two machines is
// rejected instead of overwritten, the same compare-and-swap rule the write path follows locally.
// Once any remote.origin.push is set, git push sends only those, so branches are listed too.
export function syncRefspecs(): { fetch: string[]; push: string[] } {
  const plans = `${PLAN_PREFIX}*:${PLAN_PREFIX}*`
  const config = `${CONFIG_REF}:${CONFIG_REF}`
  return { fetch: [plans, config], push: ['refs/heads/*:refs/heads/*', plans, config] }
}

// Adds only what's missing, so running it again changes nothing.
export function setup(repo: string, remote = 'origin'): string[] {
  if (!tryGit(repo, ['remote', 'get-url', remote])) throw new Error(`setup: ${repo} has no remote named ${remote}`)
  const added: string[] = []
  const { fetch, push } = syncRefspecs()
  for (const [key, specs] of [['fetch', fetch], ['push', push]] as const) {
    const current = (tryGit(repo, ['config', '--get-all', `remote.${remote}.${key}`]) ?? '').split('\n')
    for (const spec of specs)
      if (!current.includes(spec)) {
        git(repo, ['config', '--add', `remote.${remote}.${key}`, spec])
        added.push(`${key} ${spec}`)
      }
  }
  return added
}

export const configTip = (repo: string): string | null => tryGit(repo, ['rev-parse', '--verify', '-q', CONFIG_REF])

export function readConfig(repo: string): RepoConfig | null {
  const head = configTip(repo)
  return head ? JSON.parse(git(repo, ['show', `${head}:config.json`])) : null
}

export function commitConfig(repo: string, config: RepoConfig, event: Event, expectedTip: string | null): string {
  const blob = git(repo, ['hash-object', '-w', '--stdin'], json(config))
  const tree = git(repo, ['mktree'], `100644 blob ${blob}\tconfig.json\n`)
  return commitTree(repo, CONFIG_REF, tree, event, expectedTip)
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
