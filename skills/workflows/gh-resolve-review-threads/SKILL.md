---
name: gh-resolve-review-threads
description: Use when asked to address PR review or diff comments, including
  comments supplied through a review UI. Investigate the concern, establish
  what the published PR supports, and resolve threads when the evidence and
  project conventions support closure. Read-only review leaves threads open.
metadata:
  wycats.kind: workflow
  wycats.user-invocable: "true"
  wycats.invocation: contextual
---

# GH Resolve Review Threads

A review thread records a concern about a proposed change. Addressing it means
understanding what the reviewer noticed, correcting the work where needed, and
establishing what the published PR now supports. Resolution tells other readers
that this concern no longer needs attention.

[Keep evidence connected to the revision and conditions it describes](../../stances/observational-grounding/SKILL.md "composition:load context=activity")
as work moves from a local checkout to the PR. A local test can
support a correction while the reviewer still sees the earlier code.

## Recover the concern

Read the thread and its replies alongside the relevant code and diff. Identify
the PR, thread ID, author, current resolution state, and the behavior or design
judgment under discussion. Use the thread's URL and location to distinguish it
from nearby comments on the same code.

Treat the reviewer's explanation as something to investigate. A suggested edit
may reveal a broader problem, or the current code may already address the
concern. When a finding changes your understanding of the problem,
[revisit earlier comments whose meaning depended on the explanation being revised](../../stances/interpretive-synthesis/SKILL.md "composition:load"). An outdated
diff location still needs examination if the underlying behavior remains.
Apply the same scrutiny to automated and human findings.

## Work out what addresses the concern

Trace the behavior the reviewer is concerned about and establish what would
address it. That may require changing the behavior, clarifying its contract,
or bringing a design choice back for discussion. When review points conflict,
examine the assumptions behind them.
[Work through the choice with the user](../../stances/collaborative-grounding/SKILL.md "composition:load")
when it depends on their intended behavior or accepted tradeoffs.

For work that benefits from collaborating agents, give each participant the
thread, the relevant revision, and a question to investigate. Let findings
reach whoever can help interpret them as the work develops. The coordinator
brings the contributions back to the original concern and evaluates the result.
[PER](../per-cycle/SKILL.md "composition:reference") provides a
fuller approach when a correction needs preparation and independent review.

When a change is needed, implement it and check the affected behavior.
[Judge whether the evidence supports the expected behavior](../../stances/hypothesis-evaluating/SKILL.md "composition:load"),
including when the existing implementation appears to satisfy the requirement. Explain how
the evidence supports that conclusion and which cases it leaves unexamined.

[Examine what the reviewer could understand](../../stances/reader-orientation/SKILL.md "composition:load")
where they encountered the code.
A correct implementation may depend on a guarantee visible only elsewhere.
Identify what the code or documentation should explain at that point so the
next reader can reason about the behavior.

## Establish what the PR contains

Record which revision and conditions the checks covered. When you have made a
correction, publish it within the user's authorization. Read the PR's current
head and inspect the relevant published code or diff to establish that it
contains the correction you verified. A successful push alone leaves this
comparison unfinished if it went to a different branch or the PR changed
meanwhile.

When the published revision differs from the one checked, examine the intervening
changes. Reuse evidence that still applies and repeat checks where those changes
could affect the conclusion. If publication is outside the task's scope, report
the correction as locally verified and leave the thread open for that step.
When no change is needed, check that your explanation applies to the code
currently in the PR.

## Decide whether the concern is resolved

Return to the concern and any questions developed in the replies. Compare them
with what the published PR and its verification now establish. A correction may
be present while the reviewer still needs to judge the tradeoff it introduces.
Keep that decision visible when assessing whether the thread is ready to close.

Acting on supplied review feedback normally includes resolving a thread once
the concern is addressed. Apply the repository's conventions and the user's
authorization for resolution. When a design choice, missing check, or reviewer
judgment remains, leave the
thread open and identify what is needed to continue.

If investigation shows that no code change is needed, bring the explanation
and evidence through the project's review process. The reviewer may have
noticed a consequence your account has yet to explain.

## Update the review conversation

Replies attributed to the user are communications on their behalf.
[Draft any necessary explanation with them in words that carry their judgment](../../stances/authorial-continuity/SKILL.md "composition:load")
and obtain the required approval before posting. Permission to edit code or resolve a thread does not itself
authorize a reply.

Before resolving, refresh the thread and PR state. Reconsider closure if new
replies or code changes affect the concern. Resolve by thread ID, then verify
the resulting state. An already-resolved thread needs no further mutation.
Report which threads were resolved, which remain open, and the evidence or
decision behind each outcome, with links for the user to inspect.

## Reading and updating GitHub threads

Prefer a connector that preserves review-thread identity and replies. When that
surface is unavailable, GitHub GraphQL's `pullRequest.reviewThreads` connection
provides the threads. Follow pagination through the relevant results.

The `resolveReviewThread` mutation takes a `PullRequestReviewThread` ID.
Individual review-comment IDs identify comments within the conversation and
cannot substitute for the thread ID. `gh api graphql` can perform these reads
and authorized mutations when the connector lacks them.
