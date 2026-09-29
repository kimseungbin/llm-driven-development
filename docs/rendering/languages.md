# Languages (decided)

Decided by #8 (2026-09-29), so a human can decide at the gates in their own language.

## What's translated

- The gate views' fixed text: labels, badges, buttons, status lines, and the chat messages buttons send (Q1, Q6).
- Authored text renders exactly as stored, in every language. The tool never machine-translates it, because every interpretation is checked against the human's own words.
- CLI messages and errors stay English: agents read them and fix against them (Q1).
- Step kinds, symbols, revs, and IDs stay as they are, since they're identifiers.

## Catalogs (Q2)

- `src/render/lang/` holds one catalog per language, `en` and `ko`. Every view reads its fixed text from the catalog it's given, and counts and plurals come from catalog functions.
- A language is added as one catalog registered in `CATALOGS`, with no view changes. `test/i18n.test.ts` checks it has exactly `en`'s keys and that none of `en`'s fixed text shows through.
- `test/golden/` pins the English output: every view renders byte-identical with no language given.

## Choosing a language (Q3, Q5)

- It's a personal setting in user-level git config, applying in every repo: `git config --global ldd.lang ko`. Unset means `en`.
- `render` reads only the user-level config, so a repo's own config never sets it and one person's choice never reaches anyone else. An unknown language fails with the list of languages.
- The loader embeds the language in the `renderView` call it emits, and its load-failure text is in that language too (#9).
- Per-viewer language in the team phase's coordinator views, read from the viewer's identity, is deferred to #4.

## Authored text and approvals (Q4, Q6)

- Agents write an intent's and a plan's authored fields in the request's language.
- An approval counts in any language when it says to approve and names the gate and the rev. In Korean, 인텐트 게이트 is `--gate intent` and 계획 게이트 is `--gate plan`, and each button message keeps the intent ID and rev.
