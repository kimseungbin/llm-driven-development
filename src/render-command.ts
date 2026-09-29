import { readFileSync } from 'node:fs'
import { publishedRenderer } from './publish.ts'
import { renderView, viewTitle, type View } from './render/index.ts'
import { renderLoader } from './render/loader.ts'
import { renderPage } from './render/page.ts'

// The loader is the default: Claude passes on only the views' data, and the widget draws them with the
// published renderer. It refuses a stale renderer, which could draw new view data wrongly without a sign.
export function renderCommand(files: string[], opts: { format?: string; repo: string; lang: string }): string {
  if (!files.length) throw new Error('render needs at least one view file')
  const views = files.map((file) => {
    const view = JSON.parse(readFileSync(file, 'utf8')) as View
    if (view.schemaVersion !== 1) throw new Error(`${file}: expected schemaVersion 1`)
    return view
  })
  const { lang } = opts
  const drawn = () => views.map((view) => renderView(view, lang)).join('')
  switch (opts.format ?? 'loader') {
    case 'loader': {
      const published = publishedRenderer(opts.repo)
      if ('stale' in published) throw new Error(`${published.stale}: run node src/cli.ts publish, or render with --format widget`)
      return renderLoader(views, lang, published.cdn)
    }
    case 'widget':
      return drawn()
    case 'page':
      return renderPage(views.map((view) => viewTitle(view, lang)).join(', '), drawn(), lang)
    default:
      throw new Error(`unknown format ${opts.format}: use loader, widget, or page`)
  }
}
