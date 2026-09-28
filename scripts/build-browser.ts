import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import { dirname, join, relative } from 'node:path'

const src = 'src/render'
const out = 'dist/render'

for (const entry of await readdir(src, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith('.ts')) continue
  const from = join(entry.parentPath, entry.name)
  const to = join(out, relative(src, from)).replace(/\.ts$/, '.js')
  const js = stripTypeScriptTypes(await readFile(from, 'utf8'))
    // Browsers resolve specifiers literally, so the .ts extensions Node needs must become .js.
    .replace(/(from\s+['"]\.{1,2}\/[^'"]+)\.ts(['"])/g, '$1.js$2')
  await mkdir(dirname(to), { recursive: true })
  await writeFile(to, js)
}
