# Work stack

Updated 6 November 2026. This file records the work in progress, the follow-ups
deliberately left open, and where local working material lives. Git history
holds the earlier checkpoints; this file keeps only what still guides the next
move.

## In progress: reading navigation polish

Branch `wycats/reading-navigation-polish` develops the next reading edition. Its
changes are being prepared for a pull request:

- Contents begins from four questions, each with an authored guide that explains
  how its readings bear on the situation.
- The index is an annotated table of stances and workflows.
- Reference pages open with the reading itself, and a return reaches the
  passage or note the reader left.

The local preview is <http://127.0.0.1:8882/composition/>, served from
`out/reading-site/`. Comparison studies are in `site/studies/` and beside the
preview in `out/reading-site/`. Review records are in
`.runtime/reading-polish-review-2026-11-03/`.

The four question guides have received the editorial pass and colleague review.
Citation credits stay together when they move below a quotation, and wrap
within the available width on narrow screens. Browser review covered wide and
narrow layouts, light and dark paper, and the reading-and-return journey. The
finishing review and validation records are in
`.runtime/reading-finish-2026-11-06/`.

Next: review the finished guides with the user and approve the PR description.
GitHub checks and Codex review follow once the PR is open.
[site/STYLE.md](site/STYLE.md) records the editorial conventions these guides
follow. The previous edition is published at <https://ai.wycats.fun/> (#65).

Merging to `main` publishes the plugin and deploys the site, so a merge needs
the user's approval after checks and review.

## Open follow-ups

Each of these was deliberately left open. Where a tracked record explains what
is established, it is linked.

- **Supporting-context delivery.** The Copilot SDK bridge is programmatic and
  checkout-based. Installed-session integration and other hosts are not yet
  qualified. See the [runtime projection contract](docs/runtime-projection-contract.md).
- **A consequential work episode.** Reconstruct an episode where the user
  supplied an important implication, such as the Glade ordinary-workflow
  example. Read it beside PER and Architectural Distillation to decide whether
  the missing relationship belongs in canonical language, delivery, or
  discovery.
- **Curated subsets.** [Leah's proposal](docs/curated-upstream-subset-consumption.md)
  awaits direction.
- **Writing and Revision.** The workflow remains a provisional draft, not a
  canonical resource.
- **Native Editorial Reader delivery.** Not yet qualified in an installed host;
  see the [evaluation notes](evals/README.md).
- **Situational discovery.** The prototype in
  [experiments/situational-discovery](experiments/situational-discovery/README.md)
  leaves installed discovery unchanged.
- **Later reading-edition work.** Quieter capitals and numerals (Fellowhand is
  developed separately), mid-paragraph annotations, multiple notes per page,
  additional initials, and a larger relationship map. Each returns when a
  reading needs it.

## Local working material

Ignored `.runtime/` directories hold local review evidence; a clean clone does
not contain them. In this checkout, `.runtime/reading-polish-review-2026-11-03/`
holds the current review and `.runtime/release-review/` holds the #65 release
review. The earlier visual identity guide and illustration studies were kept in
the checkout where that work began. This file's history before 5 November 2026
lists their paths, and
[illustration studies](.agents/skills/illustration-studies/SKILL.md) records the
working method.
