import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { buildRenderer } from '../src/publish.ts'

export const git = (cwd: string, ...args: string[]) => execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8' }).trim()

// A clone whose origin looks like a GitHub repo but pushes to a local bare repo.
export function clone(): string {
  const dir = mkdtempSync(join(tmpdir(), 'ldd-publish-'))
  git(dir, 'init', '-q', '--bare', 'remote.git')
  git(dir, 'init', '-q', 'work')
  const work = join(dir, 'work')
  git(work, 'remote', 'add', 'origin', 'https://github.com/owner/tool.git')
  git(work, 'config', `url.${join(dir, 'remote.git')}.insteadOf`, 'https://github.com/owner/tool.git')
  git(work, 'commit', '-q', '--allow-empty', '-m', 'init')
  return work
}

// The built renderer written to disk as an ES module package, so Node can import it like a browser would.
export function writeBuilt(): string {
  const dir = mkdtempSync(join(tmpdir(), 'ldd-built-'))
  writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n')
  for (const [path, js] of buildRenderer()) {
    mkdirSync(dirname(join(dir, path)), { recursive: true })
    writeFileSync(join(dir, path), js)
  }
  return dir
}

