// Each repo declares its own closed list in refs/ldd/config; this list applies until it does.
export const DEFAULT_AREAS = ['fe', 'be', 'db', 'infra'] as const

export interface RepoConfig {
  schemaVersion: 1
  areas: string[]
}

export interface Question {
  id: string
  text: string
  proposal: string
  // "code" marks an intent amendment found while planning; it needs the intent re-approved.
  origin?: 'request' | 'code'
  // Who must answer, when that isn't the approving human (for example, Finance confirming a tax rule).
  owner?: string
}

// A question the human has settled. The answer is theirs: an accepted proposal or their own words.
export interface Decision {
  id: string
  question: string
  answer: string
  origin: 'request' | 'code'
  owner?: string
}

export const RELATION_TYPES = ['blocks', 'duplicates', 'parent'] as const
export type RelationType = (typeof RELATION_TYPES)[number]

// Stored on one side only; the other side sees it through incomingLinks.
export interface Relation {
  type: RelationType
  target: string
}

// A link that another intent holds to this one, found by scanning the plan refs.
export interface IncomingLink {
  from: string
  type: RelationType | 'follow-up' | 'step-dependency'
  // For a step dependency: the dependent step and the step it depends on.
  step?: string
  on?: string
}

export interface Intent {
  schemaVersion: 1
  id: string
  kind: 'intent'
  title: string
  request: string
  problem: string
  areas: string[]
  acceptance: string[]
  deferred?: { item: string; reason: string; followUp: string }[]
  nonGoals?: { item: string; reason: string }[]
  relations?: Relation[]
  openQuestions: Question[]
  decisions?: Decision[]
}

export const STEP_KINDS = ['data-shape', 'signature-change', 'behavior-change', 'feature', 'non-semantic', 'other'] as const
export type StepKind = (typeof STEP_KINDS)[number]

export const RISKS = ['low', 'medium', 'high'] as const
export type Risk = (typeof RISKS)[number]

// Prose can't be checked by machine, so it always says who checks it.
export interface Check {
  text: string
  checkedBy: 'test' | 'human'
}

export interface SymbolRef {
  symbol: string
  type?: string
  signature?: string
  from?: string
  to?: string
}

// Symbol lists are what reconciliation checks against the observed diff; rules and invariants are prose.
export interface Expect {
  add?: SymbolRef[]
  remove?: string[]
  change?: SymbolRef[]
  unchanged?: string[]
  rules?: Check[]
  invariants?: Check[]
}

export const EXPECT_FIELDS = ['add', 'remove', 'change', 'unchanged', 'rules', 'invariants'] as const

export interface PlanStep {
  schemaVersion: 2
  id: string
  parent: string
  kind: StepKind
  origin: 'planned' | 'discovered'
  summary: string
  risk: Risk
  riskReason?: string
  expect: Expect
  evidence: string[]
  dependsOn: string[]
}
