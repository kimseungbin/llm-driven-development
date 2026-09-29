import { esc } from './html.ts'

// Stand-in for the tokens the chat widget host provides, so the same fragment renders outside chat.
const TOKENS = `
:root{color-scheme:light dark;--font-sans:system-ui,-apple-system,sans-serif;--font-mono:ui-monospace,SFMono-Regular,Menlo,monospace;--radius:8px;
--text-primary:#1f1e1d;--text-secondary:#5f5e5a;--text-muted:#888780;--text-accent:#185fa5;--text-success:#3b6d11;--text-warning:#854f0b;--text-danger:#a32d2d;
--bg-accent:#e6f1fb;--bg-success:#eaf3de;--bg-warning:#faeeda;--bg-danger:#fcebeb;--surface-0:#faf9f5;--surface-1:#f1efe8;
--border:rgba(0,0,0,.12);--border-strong:rgba(0,0,0,.22);--border-accent:#378add;--border-warning:#ef9f27}
@media (prefers-color-scheme:dark){:root{
--text-primary:#ecebe6;--text-secondary:#b4b2a9;--text-muted:#888780;--text-accent:#85b7eb;--text-success:#97c459;--text-warning:#ef9f27;--text-danger:#f09595;
--bg-accent:#0c447c;--bg-success:#27500a;--bg-warning:#633806;--bg-danger:#791f1f;--surface-0:#1f1f1d;--surface-1:#2c2c2a;
--border:rgba(255,255,255,.12);--border-strong:rgba(255,255,255,.22)}}
body{margin:0;background:var(--surface-0);color:var(--text-primary);font-family:var(--font-sans);line-height:1.5}
main{max-width:760px;margin:0 auto;padding:24px 16px}
button{font:inherit;font-size:13px;color:inherit;background:transparent;border:0.5px solid var(--border-strong);border-radius:var(--radius);padding:6px 12px;cursor:pointer}
button:hover{background:var(--surface-1)}
.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
`

export function renderPage(title: string, fragment: string, lang = 'en'): string {
  return `<!doctype html>
<html lang="${esc(lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont/dist/tabler-icons.min.css">
<style>${TOKENS}</style>
</head>
<body><main>${fragment}</main></body>
</html>
`
}
