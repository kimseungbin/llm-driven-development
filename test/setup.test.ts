import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { setup, syncRefspecs } from '../src/store.ts'

const git = (cwd: string, ...args: string[]) => execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8' }).trim()

function clone(): string {
  const dir = mkdtempSync(join(tmpdir(), 'ldd-setup-'))
  git(dir, 'init', '-q', '--bare', 'remote.git')
  git(dir, 'init', '-q', 'work')
  git(join(dir, 'work'), 'remote', 'add', 'origin', join(dir, 'remote.git'))
  return join(dir, 'work')
}

const specs = (repo: string, key: string) => git(repo, 'config', '--get-all', `remote.origin.${key}`).split('\n')

test('setup configures every refspec exactly once, even when run twice', () => {
  const repo = clone()
  setup(repo)
  assert.deepEqual(setup(repo), [])
  const { fetch, push } = syncRefspecs()
  for (const s of fetch) assert.equal(specs(repo, 'fetch').filter((x) => x === s).length, 1)
  for (const s of push) assert.equal(specs(repo, 'push').filter((x) => x === s).length, 1)
})

test('setup keeps branches in git push', () => {
  const repo = clone()
  setup(repo)
  assert.ok(specs(repo, 'push').includes('refs/heads/*:refs/heads/*'))
})

test('plan and config refspecs never force', () => {
  const { fetch, push } = syncRefspecs()
  for (const s of [...fetch, ...push]) assert.ok(!s.startsWith('+'), s)
})

test('setup refuses a repo without the remote', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ldd-setup-'))
  git(dir, 'init', '-q')
  assert.throws(() => setup(dir), /no remote named origin/)
})
