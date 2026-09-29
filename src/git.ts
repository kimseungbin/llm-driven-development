import { execFileSync } from 'node:child_process'
import { catalog, type Lang } from './render/lang/index.ts'

export const git = (repo: string, args: string[], input?: string): string =>
  execFileSync('git', ['-C', repo, ...args], { input, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trimEnd()

export function tryGit(repo: string, args: string[]): string | null {
  try {
    return git(repo, args)
  } catch {
    return null
  }
}

// The view language is the person's own setting, so only their user-level config is read, never a repo's.
export function personalLang(): Lang {
  const lang = tryGit('.', ['config', '--global', '--get', 'ldd.lang']) ?? 'en'
  catalog(lang)
  return lang as Lang
}
