// One-off migration of a stored plan from step format 1 to 2 (self-hosted #1, step 1.1):
//   node scripts/migrate-steps-v2.ts <repo> <intent id>
// The conversion is mechanical except for risk: steps that never had one get the agent's proposals below,
// which is why the migrated plan needs approving again.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { edit, exportTo } from '../src/plan.ts'

const proposedRisk: Record<string, [risk: string, reason: string]> = {
  '7.1': ['low', 'Adds a field that create() fills and nothing reads yet.'],
  '7.2': ['medium', 'Changes three read paths, though nothing sets deletedAt until delete becomes soft.'],
  '7.3': ['low', 'The new options are optional, so existing callers behave the same.'],
  '7.4': ['medium', "Switches the report's data source; totals have to stay identical."],
  '7.5': ['medium', 'Export contents have to stay identical, and the rule depends on Q2.'],
  '7.6': ['high', 'Turns the change on: every read path and the API now depend on deletedAt.'],
  '7.7': ['high', 'Hard-deletes data; a wrong cutoff destroys orders that should still be restorable.'],
  '7.8': ['medium', 'Adds endpoints that expose deleted orders, so they must stay admin-only.'],
}

type Old = Record<string, any>

function migrate(s: Old): Old {
  const e = s.expect ?? {}
  // Format 1 never said who checks prose, so steps whose evidence names tests default to tests.
  const by = s.evidence.some((ev: string) => /\btests?\b/i.test(ev)) ? 'test' : 'human'
  const check = (c: unknown) => (typeof c === 'string' ? { text: c, checkedBy: by } : c)
  const isProse = (x: string) => /\s/.test(x)
  const unchanged: string[] = e.unchanged ?? []
  const expect: Old = {}
  if (e.add) expect.add = e.add
  if (e.remove) expect.remove = e.remove
  if (e.change) expect.change = e.change.map((c: unknown) => (typeof c === 'string' ? { symbol: c } : c))
  if (unchanged.some((u) => !isProse(u))) expect.unchanged = unchanged.filter((u) => !isProse(u))
  const rules = [e.rule, ...(e.rules ?? [])].filter(Boolean)
  if (rules.length) expect.rules = rules.map(check)
  const invariants = [...unchanged.filter(isProse).map((u) => `${u} stay the same`), e.invariant, ...(e.invariants ?? [])].filter(Boolean)
  if (invariants.length) expect.invariants = invariants.map(check)

  const [risk, riskReason] = s.risk ? [s.risk, s.riskReason] : (proposedRisk[s.id] ?? [])
  if (!risk) throw new Error(`${s.id}: no risk to migrate to; add one to proposedRisk`)
  return { ...s, schemaVersion: 2, kind: s.kind === 'dto-shape' ? 'data-shape' : s.kind, risk, riskReason, expect }
}

const [repo, id] = process.argv.slice(2)
if (!repo || !id) throw new Error('usage: node scripts/migrate-steps-v2.ts <repo> <intent id>')
const dir = join('out', 'work', `migrate-${id}`)
exportTo(repo, id, dir)
for (const f of readdirSync(join(dir, 'steps'))) {
  const path = join(dir, 'steps', f)
  writeFileSync(path, `${JSON.stringify(migrate(JSON.parse(readFileSync(path, 'utf8'))), null, 2)}\n`)
}
edit(repo, id, dir, 'migrate steps to format version 2')
