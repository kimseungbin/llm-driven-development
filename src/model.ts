export const AREAS = ['fe', 'be', 'db', 'infra'] as const
export type Area = (typeof AREAS)[number]

export interface Question {
  id: string
  text: string
  proposal: string
  // "code" marks an intent amendment found while planning; it needs the intent re-approved.
  origin?: 'request' | 'code'
}

// A question the human has settled. The answer is theirs: an accepted proposal or their own words.
export interface Decision {
  id: string
  question: string
  answer: string
  origin: 'request' | 'code'
}

export interface Intent {
  schemaVersion: 1
  id: string
  kind: 'intent'
  title: string
  request: string
  problem: string
  areas: Area[]
  acceptance: string[]
  deferred?: { item: string; reason: string; followUp: string }[]
  nonGoals?: { item: string; reason: string }[]
  openQuestions: Question[]
  decisions?: Decision[]
}

export interface PlanStep {
  schemaVersion: 1
  id: string
  parent: string
  kind: string
  origin: 'planned' | 'discovered'
  summary: string
  expect?: Record<string, unknown>
  evidence: string[]
  dependsOn: string[]
}
