# Work stack

Updated 10 November 2026. This file records the work in progress, the follow-ups
deliberately left open, and where local working material lives. Git history
holds the earlier checkpoints; this file keeps only what still guides the next
move.

## In progress: the agent's contribution to collaboration

Branch `wycats/collaborative-contribution` drafts
[Building together](instructions/building-together.instructions.md) and
[Collaborative Grounding](skills/stances/collaborative-grounding/SKILL.md)
together. The proposal develops how the agent brings relevant knowledge and
craft to the user's examples and uncertainty, contributes something concrete
for the user to judge, and carries what they learn into later choices. The
introduction describes how stances remain useful as the work changes.

The user reviewed the draft and its editorial revision. Next: complete PR
checks and Codex review, then return for merge approval. The guidance has not
yet been evaluated in use; named expertise combinations and discovery remain
open follow-ups.

The continuing-agent experiments are parked for a dedicated effort. They
exposed useful contrasts between explaining an existing arrangement and
offering to reconsider it, without establishing a reliable guidance remedy.
The last two-case pilot observed successful local implementation after an
explicit concern and assent. Protocols, results, and reviews are preserved in
`.runtime/implications-followthrough-2026-11-10/` in the primary checkout
`/Users/wycats/Code/vscode-ai-plugin`. No new run is queued.

## Collaborative Rereading: merged

PR [#67](https://github.com/wycats/ai-plugin/pull/67) integrated
[Collaborative Rereading](skills/workflows/collaborative-rereading/SKILL.md)
and subsumed Dangling Thread Review. Its tactical use remains a brief invitation
inside the workflow. Callers using the old skill name or path should use
`collaborative-rereading`. The workflow connects original exchanges, later
learning, and a judgment about the present work, including unresolved ideas
whose place is still uncertain.

## Reading navigation polish: merged

PR [#66](https://github.com/wycats/ai-plugin/pull/66) merged the reading edition:

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

[site/STYLE.md](site/STYLE.md) records the editorial conventions these guides
follow. The site is <https://ai.wycats.dev/>.

Merging to `main` publishes the plugin and deploys the site, so a merge needs
the user's approval after checks and review.

## Open follow-ups

Each of these was deliberately left open. Where a tracked record explains what
is established, it is linked.

- **Expertise and shared vocabulary.** Investigate how naming relevant expertise
  and expressing confidence helps the current agent contribute possibilities
  and judgment within the user's uncertainty. Consider short, shared names for
  useful combinations: the primary use directs the same generalist's attention;
  briefing a separate agent is secondary. Names and meanings can develop through
  examples and corrections. This is a hypothesis to explore, not an established
  causal result or a selected persona system. The injected description and index
  are part of the inquiry into how those contributions become available in work.
- **Bookkeeping and tools.** Consider more generally what understanding should
  persist at workspace scope, user scope, or both; how those records should relate;
  and where tools would help agents discover, apply, and revise them. Named
  expertise combinations provide one case. The structure remains open, with
  lightweight use and useful judgment as the aims.
- **Supporting-context delivery.** The Copilot SDK bridge is programmatic and
  checkout-based. Installed-session integration and other hosts are not yet
  qualified. See the [runtime projection contract](docs/runtime-projection-contract.md).
- **Learning from consequential work.** The Demand Files episode has been
  reconstructed and the resulting experiments are parked above. The Glade
  ordinary-workflow example remains a possible further case when it could
  answer a different question about language, delivery, or discovery.
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
