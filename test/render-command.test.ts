import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { publishRenderer } from '../src/publish.ts'
import { renderCommand } from '../src/render-command.ts'
import { renderLoader } from '../src/render/loader.ts'
import { clone } from './helpers.ts'

const file = (name: string) => fileURLToPath(new URL(`./golden/${name}`, import.meta.url))
const files = [file('8.intent-gate.json'), file('8.plan-gate.json')]
const read = (f: string) => JSON.parse(readFileSync(f, 'utf8'))

test('with no format, render emits a loader for the published renderer, in the given language', () => {
  const repo = clone()
  const cdn = publishRenderer(repo)
  assert.equal(renderCommand(files, { repo, lang: 'ko' }), renderLoader(files.map(read), 'ko', cdn))
})

test('an unpublished or stale renderer fails the loader and says what to do', () => {
  assert.throws(() => renderCommand(files, { repo: clone(), lang: 'en' }), /no renderer has been published: run node src\/cli\.ts publish, or render with --format widget/)
})

test('widget and page render several view files in order, as before', () => {
  const html = (f: string) => readFileSync(f.replace(/\.json$/, '.html'), 'utf8')
  assert.equal(renderCommand(files, { format: 'widget', repo: clone(), lang: 'en' }), files.map(html).join(''))
  assert.equal(renderCommand([files[0]], { format: 'page', repo: clone(), lang: 'en' }), readFileSync(file('8.intent-gate.page.html'), 'utf8'))
})

test('an unknown format fails with the formats there are', () => {
  assert.throws(() => renderCommand(files, { format: 'pdf', repo: clone(), lang: 'en' }), /unknown format pdf: use loader, widget, or page/)
})
