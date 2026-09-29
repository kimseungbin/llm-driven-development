import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { esc } from '../src/render/html.ts'
import { renderView, type View } from '../src/render/index.ts'
import { CATALOGS, LANGS } from '../src/render/lang/index.ts'

const { en, ko } = CATALOGS

// Every leaf of a catalog, keyed by its path; functions are compared by how many parameters they take.
function leaves(value: unknown, path = ''): Map<string, unknown> {
  if (typeof value !== 'object' || value === null) return new Map([[path, value]])
  return new Map(Object.entries(value).flatMap(([k, v]) => [...leaves(v, path ? `${path}.${k}` : k)]))
}
const shape = (m: Map<string, unknown>) => [...m].map(([k, v]) => [k, typeof v === 'function' ? `fn/${v.length}` : typeof v])

const dir = new URL('./golden/', import.meta.url)
const views = await Promise.all(
  (await readdir(dir)).filter((f) => f.endsWith('.json')).map(async (f) => JSON.parse(await readFile(new URL(f, dir), 'utf8')) as View),
)

test('the catalogs are en and ko', () => {
  assert.deepEqual(LANGS, ['en', 'ko'])
})

test('every catalog has exactly the English keys', () => {
  for (const lang of LANGS) assert.deepEqual(shape(leaves(CATALOGS[lang])), shape(leaves(en)), lang)
})

test('catalog text is safe to insert as markup', () => {
  for (const lang of LANGS)
    for (const [key, v] of leaves(CATALOGS[lang])) if (typeof v === 'string') assert.doesNotMatch(v, /[<>&"]/, `${lang} ${key}`)
})

test('a view rendered in ko shows none of the English fixed text', () => {
  const english = [...leaves(en)].filter(([k, v]) => k !== 'lang' && typeof v === 'string').map(([, v]) => v as string)
  for (const view of views) {
    const html = renderView(view, 'ko')
    // Text right after a <wbr> is the tail of an authored symbol, not fixed text.
    const text = html.replaceAll('<wbr>', '')
    for (const s of english) {
      assert.ok(!text.includes(`>${s}<`), `"${s}" in ${view.view}`)
      assert.ok(!text.includes(`> ${s}<`), `"${s}" in ${view.view}`)
    }
  }
})

test('a ko button message names the same intent, gate, and rev as the en one', () => {
  for (const gate of ['intent', 'plan'] as const) {
    const [e, k] = [en[gate].approvePrompt('#8', 'abc1234'), ko[gate].approvePrompt('#8', 'abc1234')]
    for (const part of ['#8', 'abc1234']) assert.ok(e.includes(part) && k.includes(part), `${gate}: ${part}`)
  }
  assert.match(ko.intent.approvePrompt('#8', 'abc1234'), /인텐트 게이트/)
  assert.match(ko.plan.approvePrompt('#8', 'abc1234'), /계획 게이트/)
})

test('authored text renders exactly as stored in every language', () => {
  const view = views.find((v) => v.view === 'intent-gate') as Extract<View, { view: 'intent-gate' }>
  const authored = [view.intent.request, view.intent.problem, ...view.intent.acceptance, ...view.intent.decisions.map((d) => d.answer)]
  for (const lang of LANGS) {
    const html = renderView(view, lang)
    for (const text of authored) assert.ok(html.includes(esc(text)), `${lang}: ${text.slice(0, 40)}`)
  }
})

test('an unknown language fails with the list of languages', () => {
  assert.throws(() => renderView(views[0], 'fr'), /no catalog for language "fr" \(available: en, ko\)/)
})

// Runs render with its user-level config in a temporary file, from inside a repo with its own config.
function renderCli(opts: { global?: string; local?: string; format?: string }) {
  const home = mkdtempSync(join(tmpdir(), 'ldd-lang-'))
  const globalConfig = join(home, 'gitconfig')
  writeFileSync(globalConfig, opts.global ? `[ldd]\n\tlang = ${opts.global}\n` : '')
  const repo = join(home, 'repo')
  execFileSync('git', ['init', '-q', repo])
  if (opts.local) execFileSync('git', ['-C', repo, 'config', 'ldd.lang', opts.local])
  const view = fileURLToPath(new URL('8.intent-gate.json', dir))
  const args = [cli, 'render', view, ...(opts.format ? ['--format', opts.format, '--cdn', 'https://cdn.example'] : [])]
  return spawnSync('node', args, { cwd: repo, encoding: 'utf8', env: { ...process.env, GIT_CONFIG_GLOBAL: globalConfig, XDG_CONFIG_HOME: home } })
}
const cli = fileURLToPath(new URL('../src/cli.ts', import.meta.url))

test('render uses the language in the user-level git config', () => {
  const out = renderCli({ global: 'ko' })
  assert.equal(out.status, 0, out.stderr)
  assert.match(out.stdout, /인텐트 게이트/)
})

test('render is English when the user-level config has no language', async () => {
  const out = renderCli({})
  assert.equal(out.stdout, await readFile(new URL('8.intent-gate.html', dir), 'utf8'))
})

test("a repo's own config never sets the language", async () => {
  const out = renderCli({ local: 'ko' })
  assert.equal(out.stdout, await readFile(new URL('8.intent-gate.html', dir), 'utf8'))
})

test('the page format is marked with the language and titled in it', () => {
  const out = renderCli({ global: 'ko', format: 'page' })
  assert.match(out.stdout, /<html lang="ko">/)
  assert.match(out.stdout, /<title>#8 인텐트<\/title>/)
})

test('the loader format passes the language to the renderer it calls', () => {
  const out = renderCli({ global: 'ko', format: 'loader' })
  assert.match(out.stdout, /renderView\(\{.*\}, "ko"\)/s)
})

test('a language with no catalog fails with the list of languages', () => {
  const out = renderCli({ global: 'fr' })
  assert.equal(out.status, 1)
  assert.match(out.stderr, /no catalog for language "fr" \(available: en, ko\)/)
})
