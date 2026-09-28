import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { parseArgs } from 'node:util'
import { approve, create, decide, edit, exportTo, importDir, loadIntentGate, loadPlanGate, nextId } from './plan.ts'
import { renderView, viewTitle, type View } from './render/index.ts'
import { renderPage } from './render/page.ts'

const usage = `usage (plan data lives in the product repo, under refs/plans/<id>):
  node src/cli.ts next-id --repo <repo>
  node src/cli.ts create --repo <repo> --from <dir>                      agent: new intent from <dir>/intent.json; prints the id
  node src/cli.ts export <id> --repo <repo> --out <dir>                  working copy for editing
  node src/cli.ts edit <id> --repo <repo> --from <dir> --message <why>   agent: can't change decisions
  node src/cli.ts decide <id> <question id> --repo <repo> --answer <the human's answer>
  node src/cli.ts approve <id> --repo <repo> --gate intent|plan --rev <rev> [--via agent]
      a human decision; an agent runs it only on the human's explicit instruction, with --via agent
  node src/cli.ts import <dir> --repo <repo>                             one-time move from plan files
  node src/cli.ts intent-view <id> --repo <repo> [--out <file>]
  node src/cli.ts plan-view <id> --repo <repo> [--out <file>]
  node src/cli.ts render <view.json> [--format widget|page|loader] [--cdn <renderer base url>] [--out <file>]`

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    format: { type: 'string', default: 'widget' },
    cdn: { type: 'string' },
    out: { type: 'string' },
    repo: { type: 'string' },
    from: { type: 'string' },
    message: { type: 'string' },
    answer: { type: 'string' },
    gate: { type: 'string' },
    rev: { type: 'string' },
    via: { type: 'string' },
  },
})

const fail = (message: string): never => {
  console.error(message)
  process.exit(1)
}

async function emit(text: string) {
  if (!values.out) return void process.stdout.write(text)
  await mkdir(dirname(values.out), { recursive: true })
  await writeFile(values.out, text)
}

const attempt = <T>(fn: () => T): T => {
  try {
    return fn()
  } catch (error) {
    return fail((error as Error).message)
  }
}

const need = (value: string | undefined): string => value ?? fail(usage)

const [command, arg1, arg2] = positionals

if (command === 'render') {
  const view = JSON.parse(await readFile(need(arg1), 'utf8')) as View
  if (view.schemaVersion !== 1) fail(`${arg1}: expected schemaVersion 1`)
  if (values.format === 'widget') await emit(renderView(view))
  else if (values.format === 'page') await emit(renderPage(viewTitle(view), renderView(view)))
  else if (values.format === 'loader' && values.cdn) {
    // JSON.stringify leaves "</script>" intact, which would end the inline script early.
    const data = JSON.stringify(view).replaceAll('<', '\\u003c')
    await emit(`<div id="v-root"></div>
<script type="module">
import { renderView } from '${values.cdn}/render/index.js'
document.getElementById('v-root').innerHTML = renderView(${data})
</script>`)
  } else fail(usage)
} else {
  const repo = need(values.repo)
  if (command === 'next-id') await emit(`${nextId(repo)}\n`)
  else if (command === 'create') await emit(`${attempt(() => create(repo, need(values.from)))}\n`)
  else if (command === 'export') attempt(() => exportTo(repo, need(arg1), need(values.out)))
  else if (command === 'edit') attempt(() => edit(repo, need(arg1), need(values.from), need(values.message)))
  else if (command === 'decide') attempt(() => decide(repo, need(arg1), need(arg2), need(values.answer)))
  else if (command === 'approve') {
    const gate = values.gate === 'intent' || values.gate === 'plan' ? values.gate : fail(usage)
    const via = values.via === undefined ? undefined : values.via === 'agent' ? 'agent' : fail(usage)
    attempt(() => approve(repo, need(arg1), gate, need(values.rev), via))
  } else if (command === 'import') await emit(`${attempt(() => importDir(repo, need(arg1)))}\n`)
  else if (command === 'intent-view') await emit(`${JSON.stringify(attempt(() => loadIntentGate(repo, need(arg1))), null, 2)}\n`)
  else if (command === 'plan-view') await emit(`${JSON.stringify(attempt(() => loadPlanGate(repo, need(arg1))), null, 2)}\n`)
  else fail(usage)
}
