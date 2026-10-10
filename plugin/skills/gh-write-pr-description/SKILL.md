---
name: gh-write-pr-description
description: "Use when drafting, updating, or reviewing a GitHub pull request title or body. Build the reviewer's intuition for the change, preserve the author's judgment and relationship with the readers, follow the repository template, and keep evidence at the strength it supports."
---

# GH Write PR Description

Carry the reasoning behind a change into review. Build the reviewer's intuition
for why the change exists, then explain how it works, what changes for users or
maintainers, and where its limits are.

Keep the author present through the judgment the description carries and the
way it addresses its readers.

This skill has three phases: recover the change's reasoning and the author's
position, draft and revise a coherent PR description with the author, then
evaluate the finished artifact from the reader's side.

**Stances used:** Keep **authorial-continuity** active throughout. It always
relies on **collaborative-grounding**. Use **interpretive-synthesis** during
recovery and **relational-continuity** during drafting. Add
**public-design-reasoning** when the change needs a durable design explanation.
During evaluation, use **gap-reading** for material the description may have
left out and **observational-grounding** when evidence from different surfaces
conflicts or may not describe the same phenomenon.

## Core tension

The reviewer needs enough context to build the right intuition, while every
additional sentence competes for their attention.

Working context accumulates commands, file inventories, false starts, private
shorthand, design discoveries, and evidence. Carry forward the history that
makes the decision intelligible and the evidence that shapes reviewer
confidence. Keep the rest in its useful working context.

Framing belongs to the whole description. An accurate detail can still weaken
it by competing with the central idea. Let complexity determine the length.
Each part earns its place by helping the reviewer understand or evaluate the
change.

## Phase 1: Recover the reasoning

Read the repository's PR template first. Keep its headings and make each
section do the work it promises the reviewer. If no template exists, use the
smallest useful reviewer-facing structure, usually `Why`, `What changed`, and
`Reviewer focus`.

Inspect the issue or request, the diff and relevant code, the surrounding
design, the evidence, and the parts of task history that explain the change.
Use **interpretive-synthesis** to recover reasoning in which the details and
the whole agree. When the material supports it, make this path visible:

```text
situation or force -> observation -> author's judgment -> change -> consequence
```

Preserve the design and learning history that makes the decision
understandable. Give private shorthand its meaning before asking the reviewer
to use it.

Use the current conversation and sources close to the PR to understand what the
author wants to say to its readers in this concrete situation. Keep user,
agent, and third-party language distinguishable while forming the description.

## Phase 2: Draft with the author for the reviewer

Write the title so the intended reviewer can understand the concrete change
before reading the body. Prefer ordinary behavior words. Use project terms that
already carry shared meaning for this audience. Let the title establish the
same change the body and evidence will explain.

Use `Why` to build the reader's intuition. Begin with the situation that made
the change necessary. Show what the author learned and why this change is the
right response. Explain enough that the implementation feels like a consequence
of the reasoning.

Use the remaining template sections to:

- Describe behavior and mechanism at the level needed to review the change.
- Put risks, tradeoffs, constraints, deferred work, and concrete review
  questions where they can guide attention.
- Describe user-facing changes in terms of the experience before and after the
  change. When the PR includes visual evidence such as a side-by-side video,
  use the same terms for the improvement in the title, body, and artifact.
- State evidence at the strength it supports. Include limitations when they
  change what a reviewer can conclude. Keep exhaustive command logs in CI
  output, comments, or the task closeout. Bring a result into the PR body when
  it matters to review.

Let the material determine the structure. Put a draft in front of the author
early, then work on the actual words together:

```text
repeat:
  1. Put the current title and body in front of the author.
  2. Revise what the description says and the actual words together so it
     carries the author's judgment in language they would use with these
     readers in this concrete situation.
until the author is ready to read the description from the reader's side
```

## Phase 3: Read it from the other side

Read the completed description as a reviewer who did not participate in the
work. It should give them an intuition they can use: why the change exists, why
it takes this form, and what matters when they encounter an unfamiliar detail.

Look for breaks in the account. The title, body, evidence, and visual artifacts
should describe the same change. The reviewer should be able to distinguish
what was observed from what the author concluded, understand how strongly the
evidence supports that conclusion, and see where confidence ends. When evidence
comes from different surfaces, establish that it bears on the same behavior
before combining it into one claim.

Return to the working material and look for anything the coherent description
left out that would change the review: a live tradeoff, limitation, deferred
piece of work, or decision the reviewer needs to make.

Read it again as a communication from this author to these readers. The
language should carry the author's judgment and fit the relationships and
current context around the review.

Run the slop-linter as a separate evaluator when available. Use its findings to
remove filler and identify missing substance. Bring any resulting revisions
back through the author before publication, then read the description again as
a whole.
