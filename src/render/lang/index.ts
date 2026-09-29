import { en, type Messages } from './en.ts'

export type { Messages }

// Each language is one catalog here; the views read every fixed text from the catalog they're given.
export const CATALOGS = { en } satisfies Record<string, Messages>

export type Lang = keyof typeof CATALOGS

export const LANGS = Object.keys(CATALOGS) as Lang[]

export function catalog(lang: string): Messages {
  if (!Object.hasOwn(CATALOGS, lang)) throw new Error(`no catalog for language "${lang}" (available: ${LANGS.join(', ')})`)
  return CATALOGS[lang as Lang]
}
