# Reading release progress

2 November 2026 · local preview for review

The first finishing pass combines a frozen Fellowhand candidate, a compact
passage reminder in Contents, and a quiet route to plugin setup. The public site
remains unchanged. The governing direction is
[Website and plugin release orientation](website-and-plugin-release.md).

## Current implementation

The isolated branch is `wycats/reading-release`, based on upstream `db76152`.
Its checkout is
`/Users/wycats/Code/vscode-ai-plugin.worktrees/reading-release`.
The original plugin and Fellowhand checkouts remain separate.

- **Font:** `fellowhand-reading-2026-11-02-t-release.woff2` freezes the integrated
  candidate with the reconstructed t baseline correction. Coverage and scaled vertical metrics match the shipped
  face; provenance and remaining design questions are in
  [the asset record](../../site/assets/README.md). The shipped font remains
  available for comparison, along with the preceding `le-shared` snapshot.
  Only t's outline differs from that snapshot; metrics and shaping tables are
  identical. The integration consumes the generated pen-release export and
  leaves Fellowhand's source studies unchanged.
- **Contents:** opening it on the story captures the passage at the reading
  line. References retain that origin and show its opening eight words beside
  the return action. Explicit annotation use carries a separate note marker;
  ordinary passage returns locate and focus the prose without reopening a note.
- **Route to use:** reading footers link to the repository's actual Setup
  heading and its source/documentation. README Setup now puts the published
  Codex package before local development. The setup guide connects installation,
  hook trust, and a fresh chat to a concrete first Recon investigation. These
  documentation edits are local drafts; the public destination is unchanged.

Two delegated tasks supplied font provenance/integration and navigation/source
review/implementation. Codex reviewed the combined source and browser behavior,
including correcting the proposed installation fragment to the actual heading.

## Review evidence

Resource validation passes. The four site tests pass, including compact source
excerpts and the setup destination. The candidate builds 22 pages; the site
checker passes 1,257 links. These checks do not exercise external installation.

An actual Opus review traced the published Codex route. In a disposable
`CODEX_HOME` under `.runtime/release-review/installation/`, marketplace add and
plugin add both returned success, and plugin listing reported `wycats@wycats`
installed and enabled at version 0.1.0. Codex independently read that receipt
and the installed manifest, hook configuration, and Recon skill. Existing user
profiles were not changed. This establishes installation and package contents.
The original Opus investigation did not finish its optional hook check. Its
control connection was recovered and that optional action skipped; the obsolete
investigation now remains at a further read-only approval. The completed native
Codex session below supplies the startup-delivery evidence.

A separate Opus source review found no blocking navigation defect and recommended
adopting the implementation. Its two material observations were to disclose the
prompt's explicit annotation-context direction and to distinguish manual browser
coverage from automated markup checks; both are reflected below. The saved report
is `.runtime/release-review/review/REVIEW.md`. Native turn state reached complete,
but no final prose message was captured and the report-writing tool entry was
marked skipped/cancelled despite the file existing. Treat the report as a saved
review artifact, rather than a clean final-message receipt. Codex independently
checked its material observations and retains integration acceptance.

Browser inspection covered the opening and Contents at the normal desktop
width, 390-pixel narrow layouts, light paper, and dark-paper Contents. The
passage → Interpretive Synthesis → Gap Reading → Contents → passage journey
preserved the origin. In that earlier annotation-return check, Tab selected the
new return link and Enter restored the annotated passage and note focus. The new lettering fits the observed
headings and navigation without a layout change.

An additional local specimen doubles CSS text sizes while keeping layout
lengths fixed. At 390 pixels, Contents and the map dialog remain within the
viewport with no page overflow. Enlarged map artwork scrolls within its own
frame. Keyboard switching of Whole map and Larger lettering works; Escape
restores the opener's focus. The enlarged reminder was checked on an annotation-origin journey and restored
the passage and note focus. This is a simulated text-enlargement stress check,
not qualification of native browser text-only zoom.

The user liked the assembled edition and authorized comparing the newer t.
The updated export was reviewed in paired title, section-heading and navigation
specimens and in the actual opening page. Its subtler lower landing fits the
existing rhythm. The previous snapshot remains available for the user's
comparison; no further font research is required for this edition.

## First installed-use session

The published package was exercised through Codex CLI 0.160.1's native
app-server in the isolated installation profile. Its default model resolved to
`gpt-6.1-sol`. The exact installed SessionStart hook was reviewed, matched to
the marketplace artifact and trusted through the host configuration API; no
hook-trust bypass was used. The temporary account credential copy was removed
when the session completed. Existing profiles were not changed.

The saved native transcript contains the full 16,105-character persistent
story exactly once as developer context. The agent read Recon and its supporting
stances from the installed package. The prompt explicitly asked it to distinguish
reading position from annotation context. In that guided investigation, it
located where the source used passage identity to infer annotation use and
recommended carrying those facts separately. Codex independently checked
the source before implementing the recommendation.

Contents now captures the paragraph at the reading line when it opens. The
origin survives subsequent reference navigation, and a separate validated note
marker preserves explicit annotation use. Browser checks covered Contents →
Interpretive Synthesis → Gap Reading → paragraph, the equivalent annotation
journey with note reopening, recapture after a section jump, and the generic
return with its reminder hidden for an invalid origin. Generated-link
tests distinguish prose links from annotation/map links. The existing four site
tests and the 22-page/1,257-link build pass. Runtime capture, propagation, note
reopening, and focus are qualified by the manual browser checks above; they do
not yet have automated interaction coverage. Those browser checks are the
accepted evidence for this bounded change. Resource validation also passes.

Evidence lives in `.runtime/release-review/first-use/`: the prompt, native event
log, saved session, hook trust before/after, delivery verification, and the
agent's recommendation. This establishes startup delivery and a useful bounded
investigation. It does not establish a causal improvement over an unassisted
model, automatic skill selection, or current compaction behavior. The prompt
explicitly requested Recon, identified the navigation problem, and directed
attention to passage versus annotation context.

The hook reports `additionalContextLimit: 16000`, while the full verified story
has 16,105 characters. The current host delivered it intact; this check does not
establish the limit's units or enforcement. Recheck full delivery when the story
or host changes. Trust was exercised through the native configuration API; the
documented `/hooks` interaction was not itself exercised in this run.

## Preview and restart

Local review entry: <http://127.0.0.1:8881/>.

- [Candidate](http://127.0.0.1:8881/candidate/) uses current Fellowhand.
- [Snapshot comparison](http://127.0.0.1:8881/font-comparison.html) shows the
  preceding snapshot beside the refined t, with links to both full editions.
- [Published font control](http://127.0.0.1:8881/published-font/) uses the same
  new navigation with the shipped font, isolating the lettering change.
- [Doubled-text stress specimen](http://127.0.0.1:8881/text-200/) enlarges text
  without enlarging the surrounding layout.
- [Reminder example](http://127.0.0.1:8881/candidate/reference-1.html?from=result-understanding)
  shows the new return reminder when Contents is opened.

Generated previews live in `out/release-review/`; screenshots and the preview
build script live in `.runtime/release-review/`. These are local review material.
The server is a retained local Python process, bound only to loopback on port
8881. It is not a managed service and will need restarting after process exit or
machine restart. From this checkout:

```sh
python3 .runtime/release-review/build-preview.py
python3 -m http.server 8881 --bind 127.0.0.1 --directory out/release-review
```

Check the port first and reuse the existing owned server if it is running.
The script builds the candidate and creates a control differing only in its
font source. It does not modify the original font studies or their servers.

## Next decision

The accepted font snapshot and first reading-to-installed-use route now give us
a coherent release candidate. The independent source review is complete and its
material evidence corrections are incorporated. Prepare the combined website
and setup changes for repository review, keeping broader causal evaluation and supporting-context composition
as explicit follow-up inquiries. Publication follows the repository review
process and user approval. The candidate is being submitted for review; merge
and production deployment remain pending.
