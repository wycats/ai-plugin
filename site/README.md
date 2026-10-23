# Building together reading edition

Public URL: <https://ai.wycats.fun/>

The site renders `instructions/building-together.instructions.md` and the
repository Markdown pages reachable through its links. Canonical Markdown owns
the wording and source relationships. The reading edition adds navigation,
illustrations, and a small set of editorial annotations.

## Reading implementation

- `build.mjs` renders the canonical Markdown and resolves resource destinations.
  Contents and map links use those resolved sources, including the full catalog.
- `reading.css`, `contents.css`, and `marginalia.css` hold the accepted Newsreader,
  manuscript lettering, paired paper/ink roles, and responsive composition.
- `presentation.mjs` supplies the shared marks, illustrations, and relationship
  leaf. `relationships.mjs` supplies the nearby readings shown in Contents.
- `marginalia.mjs` names the exact phrase, note, destination, and initial artwork
  measurements. The build fails when its phrase is absent or ambiguous in the
  intended section. The paragraph remains canonical Markdown.
- `marginalia.js` measures rendered phrase lines and joins their final underline
  to the initial. The note moves below the paragraph when the margin no longer
  has room. `reading.js` and `contents.js` manage paper, disclosures, native
  dialogs, current section, and focus on return.
- `assets/` contains the accepted paired artwork and local fonts, including
  Newsreader's license. See `assets/README.md` for their provenance.

The representative route is **Working through a change → Interpretive Synthesis
→ return to the passage**, with a focused relationship map available from the
note. A return parameter is carried through subsequent reference navigation;
returning reopens the note and locates its paragraph. Contents opens a centered
leaf at every width, with an optional relationship view and expandable catalogs.
The prose and reference links remain available without JavaScript, with the note
in flow and a plain catalog at the end of the page.

The current manuscript face covers lowercase letters and B, O, S, W. Most
manuscript headings use lowercase while Building together keeps its authored B.
Quieter capitals and additional glyph coverage remain later font work.

## Build and check

```sh
pnpm install --frozen-lockfile
pnpm build:site
pnpm check:site
pnpm test:site
```

The generated site is in `out/reading-site/`. It contains static HTML, local
assets, small browser modules, and the Vercel configuration. Source paths,
conversation records, study screenshots, and the local reading copy's
`sources.json` are excluded.

For a separate local preview alongside the preserved identity studies:

```sh
node site/build.mjs --out out/reading-site/implementation
node site/check.mjs out/reading-site/implementation
python3 -m http.server 8878 --bind 127.0.0.1 --directory out/reading-site
```

Reuse the running server when available. The preview is at
<http://127.0.0.1:8878/implementation/>. The build only replaces top-level HTML
files in its selected output directory. The local studies under `type-study/`
remain separate. `WORK-STACK.md` records the accepted design and deferred cases.

Tests verify that all story paragraphs survive rendering, that annotation
phrases have an unambiguous match, and that generated destinations resolve.
Browser review covers the note, both map views, Contents, theme switching, narrow
layout, and focus/position when returning to the reading.

## Deployment

The validation workflow builds the site on Linux and Windows for pull requests
and pushes to `main`. It checks local links, images, and fragment destinations
in the rendered HTML. External links are not fetched during CI.

After the full validation matrix passes on `main`, the deployment job publishes
the validated Linux artifact to Vercel. The project is `building-together` in
`yehuda-katzs-projects`; it has no separate Git-triggered deployment. Changes to
generated plugin output alone do not trigger the workflow.

Deployment credentials live in the GitHub environment `reading-site-production`,
restricted to `main`. Its `READING_SITE_VERCEL_TOKEN` secret is scoped to this
Vercel project. Pull request validation does not use the environment or token.
The token expires October 18, 2027. Before then, create a replacement with the
same project scope and update that environment secret. The deployment supplies
`VERCEL_PROJECT_ID` and `VERCEL_ORG_ID` directly: the CLI's `--scope` lookup needs
account access unavailable to a project-scoped token.

To publish a reviewed build manually:

```sh
pnpm build:site
pnpm check:site
VERCEL_PROJECT_ID=prj_SMTCNO0JzmmzaOM4TXjwy3BiqLa5 VERCEL_ORG_ID=team_1A5hxCsAnX5KFLm69oklRZWB vercel deploy out/reading-site --prod --yes
```

Upload only the generated directory so local working records remain outside
the deployment. The original `building-together-ruby.vercel.app` URL remains
available alongside the custom domain.
