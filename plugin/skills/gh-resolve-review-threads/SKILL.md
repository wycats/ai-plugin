---
name: gh-resolve-review-threads
description: "Use when PR review or diff comments are supplied as actionable feedback to implement, including UI flows that send comments without an explicit typed request. Completing this work includes verifying the fix and resolving matching GitHub/Copilot review threads; observation-only requests should leave threads open."
---

# GH Resolve Review Threads

PR review feedback has two surfaces: the code and the review thread. When the user or UI asks you to act on review comments, the work is complete only when the code addresses the concern and the review surface reflects that state. Resolve the matching thread after verification; leave it open when the task is only to observe, explain, plan, or when the fix is ambiguous.

**Stances used:** Load the **relational-continuity** stance for keeping review-thread language attached to the work, and **collaborative-grounding** when reviewer or user intent is ambiguous.

## Default stance

When the user or UI supplies PR review comments as work to perform, treat thread resolution as part of finishing that work. Fix the concern, verify the fix landed, then resolve the matching review thread unless there is a concrete reason to leave it open.

The important boundary is not whether the user said the word "resolve." The boundary is whether the user or UI asked you to act on PR review feedback. Observation-only requests leave the review surface unchanged.

## Workflow

1. Identify the PR and review comments the user or UI supplied.
   - Prefer thread-aware GitHub reads over flattened comment lists.
   - If the available GitHub connector does not expose review-thread IDs, use `gh api graphql` to read `pullRequest.reviewThreads`.
   - Collect enough context to distinguish sibling comments on the same file and line: thread ID, resolved state, file path, line or diff position, author, body, URL, and any replies.

2. Verify the fix landed.
   - Inspect the local diff, pushed commit, PR diff, or relevant test evidence.
   - Match the fix to the review thread's actual concern, not only to the file or line.
   - Treat Copilot comments like any other review comments: useful signal, but still verify the code behavior.

3. Resolve clear matches.
   - Use the thread ID, not a comment ID, when resolving review threads.
   - Prefer the GitHub connector when it supports review-thread resolution.
   - Otherwise use GitHub GraphQL, for example the `resolveReviewThread` mutation via `gh api graphql`.

4. Leave threads open when resolution would be misleading.
   - The requested thread is ambiguous or you cannot map it to a specific review thread.
   - The fix is not actually present in the PR branch.
   - The thread conflicts with another review point or the code changed in a way that needs reviewer judgment.
   - Resolving would hide a meaningful human-review decision, design tradeoff, or unresolved product question.
   - The thread is already resolved; record it as already resolved instead of resolving it again.

5. Report the outcome.
   - Summarize resolved threads with enough identifying context: file, reviewer, short concern, and URL when available.
   - Summarize left-open threads separately with the concrete reason each remains open.
   - Mention the evidence used to verify the fix, including tests or PR diff checks when relevant.

## Practical notes

GitHub's REST review-comment APIs often lose the thread boundary that matters for resolution. When in doubt, query the PR's GraphQL `reviewThreads` connection and resolve by `PullRequestReviewThread` ID.

Avoid resolving a thread merely because the changed line moved, the thread is outdated, or a bot comment looks low-risk. Outdated or bot-authored threads can still represent live feedback if the underlying concern remains.
