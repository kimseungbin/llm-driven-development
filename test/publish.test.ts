import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { pathToFileURL } from 'node:url'
import { renderView, type View } from '../src/render/index.ts'
import { buildRenderer, publishedRenderer, publishRenderer } from '../src/publish.ts'
import { clone, git, writeBuilt } from './helpers.ts'

const golden = new URL('./golden/', import.meta.url)
const views = readdirSync(golden)
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(new URL(f, golden), 'utf8')) as View)

test('nothing published yet is stale', () => {
  assert.deepEqual(publishedRenderer(clone()), { stale: 'no renderer has been published' })
})

test('publish pins the CDN base to the renderer commit and matches the current source', () => {
  const repo = clone()
  const cdn = publishRenderer(repo)
  const sha = git(repo, 'rev-parse', 'refs/heads/renderer')
  assert.equal(cdn, `https://cdn.jsdelivr.net/gh/owner/tool@${sha}`)
  assert.deepEqual(publishedRenderer(repo), { cdn })
  assert.equal(git(repo, 'ls-remote', 'origin', 'refs/heads/renderer').split('\t')[0], sha)
})

test('the renderer branch holds only the built files', () => {
  const repo = clone()
  publishRenderer(repo)
  assert.deepEqual(git(repo, 'ls-tree', '-r', '--name-only', 'refs/heads/renderer').split('\n'), [...buildRenderer().keys()].sort())
})

test('publishing an unchanged renderer makes no new commit', () => {
  const repo = clone()
  const first = publishRenderer(repo)
  assert.equal(publishRenderer(repo), first)
  assert.equal(git(repo, 'rev-list', '--count', 'refs/heads/renderer'), '1')
})

test('a published renderer that differs from the source is stale', () => {
  const repo = clone()
  publishRenderer(repo)
  const tree = git(repo, 'rev-parse', 'refs/heads/renderer^{tree}')
  const other = git(repo, 'commit-tree', git(repo, 'mktree', '--missing'), '-m', 'older renderer')
  git(repo, 'update-ref', 'refs/remotes/origin/renderer', other)
  const status = publishedRenderer(repo)
  assert.ok('stale' in status && /older than src\/render/.test(status.stale), JSON.stringify(status))
  assert.notEqual(git(repo, 'rev-parse', `${other}^{tree}`), tree)
})

test('the built renderer draws every golden view exactly like the source renderer', async () => {
  const built = await import(pathToFileURL(join(writeBuilt(), 'render/index.js')).href)
  for (const lang of ['en', 'ko']) for (const view of views) assert.equal(built.renderView(view, lang), renderView(view, lang))
})
