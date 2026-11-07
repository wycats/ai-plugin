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
- `presentation.mjs` supplies the shared marks, illustrations, the cropped
  relationship plate, and the marginal note's map dialog.
- `questions.mjs` holds the editorial entrances to the collection: four
  questions from recognizable situations in the essay, each with a guide. A
  guide is authored prose explaining how someone can work through the
  situation. Each unit of it links one phrase to a note on the reading whose
  judgment contributes there; a question may also name the reading its account
  follows most closely. A reading may recur in several questions. Write and
  revise this prose following [STYLE.md](STYLE.md). The same Markdown is rendered
  as `style.html`, linked from Contents and the footer as “Style of this edition.”
  It is editorial guidance, separate from the stance and workflow index.
- `guide.mjs` validates and renders a guide once, for Contents on every page.
  An excerpt from the essay is quoted with its chapter credited after an em
  dash; the build fails unless it occurs exactly once in that chapter and its
  linked phrase is the essay's own link to the note's reading. A separate cue
  locates the question in the essay, so excerpts remain optional. The build
  checks that cue against its source too. `guide.js` draws the strokes joining
  phrases to their notes when the notes have a margin; narrower, each note
  follows its passage behind a thin rule.
- `marginalia.mjs` names the exact phrase, note, destination, and initial artwork
  measurements. The build fails when its phrase is absent or ambiguous in the
  intended section. The paragraph remains canonical Markdown.
- `marginalia.js` measures rendered phrase lines and joins their final underline
  to the initial. The note moves below the paragraph when the margin no longer
  has room. `reading.js` and `contents.js` manage paper, disclosures, native
  dialogs, current section, and focus on return. `origin.js` owns what an
  address establishes about the reader's path (story origin, note, chosen
  question), the links that carry it, the return it leads to, and which
  question unfolds at a passage.
- `assets/` contains the accepted paired artwork and local fonts, including
  Newsreader's license. See `assets/README.md` for their provenance.

The representative route is **Working through a change → Contents → “The change
worked as predicted. What did it teach us?” → Hypothesis Evaluating → Interpretive
Synthesis → return to the passage**. The marginal note offers the same excursion
with its focused relationship map.

Contents is one leaf in three parts. **Chapters** keeps the story's order beside
a short colophon naming what the edition is and whom its guidance addresses.
**Questions to begin from** offers overlapping entrances: each question's guide
explains how to work through its situation, quotes the passage where it arises,
and notes what each of its readings contributes there. A reading that recurs
names its other questions (“Also in…”), so a second appearance reads as the
same reading in another encounter. The
**Index of readings** is an annotated table: stances and workflows flow in two
independent columns, each opened by a Fellowhand title and a sentence on what
its readings are. Each entry starts on its own line with the reading's name on
the left edge. The right edge of that line holds red chapter numerals, the form
the chapter list uses, each resuming the first passage in that chapter citing
the reading. A one-line gloss hangs beneath the name; readings the text never
cites add a *see* line naming the readings that do. The index is generated, so
a new resource is findable without editorial work, and it is the no-script
fallback at the foot of every page.

Opening Contents on the story captures the paragraph crossing the reading line
below the fixed tools, or the next paragraph if that line is in a gap. It uses
the last paragraph when the reader is beyond the prose. Each opening captures
the location anew and unfolds the question whose passage the reader has reached
in that chapter. Reference links carry the origin through questions, the index,
and related readings; local section links retain their normal navigation.

When a reader follows a link out of Contents, the browser history entry keeps
the open question, scroll position, focused link, and captured passage. Back
restores that view and its passage links, including when the browser rebuilds
the document. Closing Contents explicitly or reloading the page leaves it
closed.

A reference page follows one principle: the argument occupies the column,
orientation keeps to its edges, and relationships annotate the material they
illuminate. Its head and foot edges hold the way back into the book in one
voice. With no known origin they name the book (“Building together, the essay
this reading accompanies”) and claim no return. When the address names a story
passage (`from`), both edges and Contents read “Return to the passage”, followed
by the chapter numeral and the passage's opening words; with `note`, they read
“Return to the note” and reopen it. The reading arrives first: its Fellowhand
title, with its kind as a small-caps label on the title line, and its opening
paragraph. The questions it belongs to annotate that opening (in the margin at
wide widths, after it otherwise), each in the words Contents gives it, with an
“Open this question” control. This describes membership, not the reader's path.

A reading chosen from a question carries that question (`question`) as well.
Origin and question are carried through further reference links, unless a link
names its own question, so a later return still reaches the original passage.
On arrival, the annotation for the chosen question offers “Back to this
question”; on a later reading outside that question, a “From the question” note
names it. Contents then opens at that question. Origin, question, and the
return they lead to are computed in `origin.js` and covered by tests.

Returning from a prose link, Contents, or an index locator brings the passage,
and the chapter heading it opens, into view; returning to a note lands on its
passage too. A reading mark and rule in the margin identify the passage and
serve as its focus indicator until focus moves on.
The footer links to the repository's installation instructions and source
without changing the authored story.
The prose and reference links remain available without JavaScript, with the note
in flow and the annotated index at the end of the page.

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
Tests also verify that every page's index lists each reading once, that each
question's cue and readings resolve, that recurring readings name their other
questions, and that references state their place for a direct arrival.
Browser review covers the note, both map views, Contents and its questions,
theme switching, narrow layout, and focus/position when returning to the reading.

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
