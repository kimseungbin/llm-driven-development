import { execFileSync } from 'node:child_process'

export const git = (repo: string, args: string[], input?: string): string =>
  execFileSync('git', ['-C', repo, ...args], { input, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trimEnd()

export function tryGit(repo: string, args: string[]): string | null {
  try {
    return git(repo, args)
  } catch {
    return null
  }
}
