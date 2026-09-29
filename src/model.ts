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

export const STEP_KINDS = ['data-shape', 'signature-change', 'behavior-change', 'feature', 'instructions', 'docs', 'non-semantic', 'other'] as const
export type StepKind = (typeof STEP_KINDS)[number]

// Prose kinds name files and sections; code kinds name symbols.
export const PROSE_KINDS: readonly StepKind[] = ['instructions', 'docs', 'non-semantic']

// One shared list, so a word means the same thing in every kind (docs/model/categories.md).
export const CHANGE_CATEGORIES = [
  'added',
  'removed',
  'renamed',
  'moved',
  'type-changed',
  'nullability-changed',
  'value-changed',
  'behavior-changed',
  'content-changed',
] as const
export type ChangeCategory = (typeof CHANGE_CATEGORIES)[number]

// The categories each kind can produce; any other category on a change of that kind is a mislabel.
export const KIND_CATEGORIES: Record<StepKind, readonly ChangeCategory[]> = {
  'data-shape': ['added', 'removed', 'renamed', 'type-changed', 'nullability-changed'],
  'signature-change': ['added', 'removed', 'renamed', 'type-changed'],
  'behavior-change': ['behavior-changed', 'value-changed'],
  feature: ['added'],
  instructions: ['added', 'removed', 'moved', 'behavior-changed'],
  docs: ['added', 'removed', 'moved', 'content-changed'],
  'non-semantic': ['moved', 'renamed', 'content-changed'],
  other: CHANGE_CATEGORIES,
}

export const RISKS = ['low', 'medium', 'high'] as const
export type Risk = (typeof RISKS)[number]

// Prose can't be checked by machine, so it always says who checks it.
export interface Check {
  text: string
  checkedBy: 'test' | 'human'
}

// For prose the file is the identity: doc is a skill's name or a repo-relative path, section is the heading text.
export interface SectionRef {
  doc: string
  section: string
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
  sections?: SectionRef[]
  rules?: Check[]
  invariants?: Check[]
}

export const EXPECT_FIELDS = ['add', 'remove', 'change', 'unchanged', 'sections', 'rules', 'invariants'] as const

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
