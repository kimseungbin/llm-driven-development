import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import { dirname, join, relative } from 'node:path'

const src = 'src'
const out = 'dist'

// The renderers and the model they read (kinds and categories); nothing else runs in a browser.
const files = [
  'model.ts',
  ...(await readdir(join(src, 'render'), { recursive: true, withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith('.ts'))
    .map((entry) => relative(src, join(entry.parentPath, entry.name))),
]

for (const file of files) {
  const from = join(src, file)
  const to = join(out, file).replace(/\.ts$/, '.js')
  const js = stripTypeScriptTypes(await readFile(from, 'utf8'))
    // Browsers resolve specifiers literally, so the .ts extensions Node needs must become .js.
    .replace(/(from\s+['"]\.{1,2}\/[^'"]+)\.ts(['"])/g, '$1.js$2')
  await mkdir(dirname(to), { recursive: true })
  await writeFile(to, js)
}
