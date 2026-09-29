import { en,               } from './en.js'
import { ko } from './ko.js'

                        

// Each language is one catalog here; the views read every fixed text from the catalog they're given.
export const CATALOGS = { en, ko }                                   

                                        

export const LANGS = Object.keys(CATALOGS)          

export function catalog(lang        )           {
  if (!Object.hasOwn(CATALOGS, lang)) throw new Error(`no catalog for language "${lang}" (available: ${LANGS.join(', ')})`)
  return CATALOGS[lang        ]
}
