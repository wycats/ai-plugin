# Reading artwork and fonts

The artwork and original fonts were promoted from accepted local studies into
the canonical reading build on 20 October 2026. The dated Fellowhand snapshot
below is a candidate for the next reading edition. The generated site reproduces
the reading without the ignored `.runtime` studies.

## Illustrations

`illustrations/diagram-recomposed-{light,dark}.png` is the opening composition
accepted during the visual-identity pass. The same composition returns after the
story. `return-map-{light,dark}.png` is the accepted map after the local gloss
composite and drawing-reconciliation pass. `initial-i-{light,dark}.png` preserves
the authored letter, foliage, and incoming strand on a transparent canvas.
Light companions were drawn against the identity's paper and ink roles rather
than obtained by filtering the dark drawings.

The drawings were made with the built-in image generator and reviewed in the
local manuscript studies. Earlier sources, prompts, and comparison records are
located through `WORK-STACK.md`. Those working records are not deployed.
The map's wording is editorial illustration copy; the opening diagram's meaning
must stay aligned with the canonical Mermaid diagram in Building together.

`reading-mark.svg` is the current-location mark. `understanding-cycle.png` is the
older opening illustration retained from the preceding implementation; the
current build's templates use the paired recomposed drawings.

## Fonts

`fonts/newsreader-roman.ttf` and `fonts/newsreader-italic.ttf` are the variable
Newsreader fonts used in the accepted body-face study. They carry weight and
optical-size axes. `fonts/newsreader-OFL.txt` contains their SIL Open Font License
and copyright attribution. The reading uses automatic optical sizing, 400 for
body text, and 600 for emphasis.

`fonts/manuscript.woff2` is the accepted custom font from the batch-three spacing
and curve-refinement study. It remains unchanged as the shipped comparison font
(SHA-256 `10ee0db7ac504149c3fdbfd9a4ddfdc6917de4b8d100cb5668c6960506eb5674`).

### Fellowhand reading candidate

`fonts/fellowhand-reading-2026-11-02-t-release.woff2` is the current frozen
snapshot used by the CSS family `Manuscript`. It is copied byte-for-byte from
`out/reading-site/spacing-audit/pen-t-release/t-generated.woff2` in the isolated
Fellowhand workspace below. SHA-256:
`7e57d1d98f52e4932aa7c34345f4e14e009c98ab4db9267e7b93715cfc8fc284`.

The update reconstructs the preferred +6 optical correction to t's lower turn
with a rotating physical edge and narrowing contact. Direct comparison against
the earlier snapshot confirms that only t's outline changes: glyph order,
cmap, horizontal metrics, GSUB, GPOS, hhea and OS/2 are identical. The source
receipt is `.runtime/manuscript-spacing-audit-2026-10-23/pen-t-release/receipt.json`
(SHA-256 `cbc614474b67ce6a6b8c809e268f585aa8d83f5ef263b513017455bbd9b96438`).
It records 2,732 shaping checks and TTF/WOFF2 equivalence. This integration
consumes that export without rebuilding or changing Fellowhand's sources.
The construction is reference-calibrated; physical ease and a complete t
stroke sequence remain open research questions.

`fonts/fellowhand-reading-2026-11-02.woff2` preserves the earlier `le-shared`
snapshot for comparison. Its SHA-256 is
`eea01ec7469c3216ea27a12b4049762f32be8e8fcbffe014e14bade246ac8df8`.
The internal font name is **Fellowhand l Shared Exit Trial**. The dated asset and
hash identify this snapshot; the inherited internal version remains `0.1`.

It was copied without modification from the isolated Fellowhand workspace:

```text
/Users/wycats/Applications/GladePlanningDelegation/workspace/fellowhand-w/
  out/reading-site/spacing-audit/pen-l-exit-spacing/le-shared.woff2
```

Its source chain is `le-shared` ← `bk-proposed` ← `tl-proposed` ← `t-rhythm` ←
`encounter-contact` ← `spacing-base` ← the integrated polygon trial, faired a,
and candidate w. The source receipt is under that workspace's
`.runtime/manuscript-spacing-audit-2026-10-23/pen-l-exit-spacing/receipt.json`
(SHA-256 `fc6cc0b5b99fb2561b8983042bb11f656cce35794a604207ea4ddee4ef131e81`).
Its direct source hashes and the copied output hash were verified on integration.
The saved receipt records TTF/WOFF2 outline and shaping equivalence; the site
integration does not regenerate the font.

Coverage matches the shipped font: space, lowercase a–z and capitals B, O, S, W.
The existing CSS unicode range preserves fallback for other characters. Units
per em increase from 1,000 to 16,000, with ascent, descent and line gap scaled
exactly by 16, preserving their proportions at the same CSS size. Normal kerning,
ligatures and contextual alternates carry the intended shaping.

This is a reading-preview candidate, not final acceptance of the alphabet.
Incoming l joins, cl/local rhythm, apparent l/t baseline alignment, and jk/fk
encounters remain review points; a and w also retain provisional design choices.
Judge those where they occur in the site's actual headings and navigation.
The site's candidate uses the generated t release rather than the raw optical
target experiments. The remaining limits above continue to apply.
Fellowhand's source studies and ongoing font development remain independent.
