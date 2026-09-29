import { execFileSync } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { git, tryGit } from './git.ts'

const SRC = fileURLToPath(new URL('.', import.meta.url))
const BRANCH = 'renderer'
const REMOTE_BRANCH = `refs/remotes/origin/${BRANCH}`

// The renderers and the model they read (kinds and categories); nothing else runs in a browser.
export function buildRenderer(): Map<string, string> {
  const files = [
    'model.ts',
    ...readdirSync(join(SRC, 'render'), { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.ts'))
      .map((entry) => relative(SRC, join(entry.parentPath, entry.name))),
  ].sort()
  return new Map(
    files.map((file) => [
      file.replace(/\.ts$/, '.js'),
      stripTypeScriptTypes(readFileSync(join(SRC, file), 'utf8'))
        // Browsers resolve specifiers literally, so the .ts extensions Node needs must become .js.
        .replace(/(from\s+['"]\.{1,2}\/[^'"]+)\.ts(['"])/g, '$1.js$2'),
    ]),
  )
}

// The tree the renderer branch holds when it matches the current source, built in a scratch index.
function rendererTree(repo: string, files: Map<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'ldd-renderer-'))
  try {
    const env = { ...process.env, GIT_INDEX_FILE: join(dir, 'index') }
    const lines = [...files].map(([path, content]) => `100644 ${git(repo, ['hash-object', '-w', '--stdin'], content)}\t${path}`)
    execFileSync('git', ['-C', repo, 'update-index', '--add', '--index-info'], { env, input: `${lines.join('\n')}\n` })
    return execFileSync('git', ['-C', repo, 'write-tree'], { env, encoding: 'utf8' }).trim()
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

// jsDelivr serves a public GitHub repo at a commit SHA, so a view drawn against it never changes later.
function cdnBase(repo: string, sha: string): string {
  // The configured URL, before any insteadOf rewrite: jsDelivr serves the repo it names.
  const url = git(repo, ['config', '--get', 'remote.origin.url'])
  const match = url.match(/github\.com[:/]([^/]+)\/(.+?)(?:\.git)?$/)
  if (!match) throw new Error(`origin (${url}) isn't a GitHub repo, so jsDelivr can't serve its renderer`)
  return `https://cdn.jsdelivr.net/gh/${match[1]}/${match[2]}@${sha}`
}

export function publishedRenderer(repo: string): { cdn: string } | { stale: string } {
  const sha = tryGit(repo, ['rev-parse', '--verify', '-q', `${REMOTE_BRANCH}^{commit}`])
  if (!sha) return { stale: 'no renderer has been published' }
  if (git(repo, ['rev-parse', `${sha}^{tree}`]) !== rendererTree(repo, buildRenderer()))
    return { stale: `the published renderer (${sha.slice(0, 7)}) is older than src/render` }
  return { cdn: cdnBase(repo, sha) }
}

export function publishRenderer(repo: string): string {
  const tree = rendererTree(repo, buildRenderer())
  const parent =
    tryGit(repo, ['rev-parse', '--verify', '-q', `refs/heads/${BRANCH}`]) ?? tryGit(repo, ['rev-parse', '--verify', '-q', REMOTE_BRANCH])
  let sha = parent
  if (!parent || git(repo, ['rev-parse', `${parent}^{tree}`]) !== tree) {
    const source = git(repo, ['rev-parse', '--short', 'HEAD'])
    sha = git(repo, ['commit-tree', tree, ...(parent ? ['-p', parent] : []), '-m', `renderer: built from ${source}`])
    git(repo, ['update-ref', `refs/heads/${BRANCH}`, sha, ...(parent ? [parent] : [])])
  }
  git(repo, ['push', 'origin', `refs/heads/${BRANCH}:refs/heads/${BRANCH}`])
  // A push doesn't always update the remote-tracking ref, and the staleness check reads it.
  git(repo, ['update-ref', REMOTE_BRANCH, sha as string])
  return cdnBase(repo, sha as string)
}
