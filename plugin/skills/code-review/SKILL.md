---
name: code-review
description: "Use when reviewing git diffs, local changes, or pull requests for merge-relevant risks: correctness regressions, security/privacy, data integrity, performance, reliability, tests, UX, maintainability, and deployability. Produce evidence-backed findings, inline comments when available, and a reviewer-facing summary focused on findings, residual risk, questions, and readiness."
---

# Code Review

Code review is merge-risk evaluation, not diff narration. The job is to find
the issues that should change how a maintainer thinks about landing the
change: behavior that may break, security or data boundaries that may be
weakened, validation that no longer supports confidence, or design drift that
will make the next change harder.

Prefer a few grounded findings over many plausible comments. If a concern does
not change merge confidence, author action, or reviewer attention, leave it out.

**Stances used:** Load **hypothesis-evaluating** for judging the change against
its implied intent, **joint-reading** for anchoring claims to code, **gap-reading**
for missing paths and tests, **diagnostic-questioning** for unresolved intent,
**interpretive-synthesis** for the final readiness judgment, and
**collaborative-grounding** when user or author context would change the review,
and **relational-continuity** for reviewer-facing language.

## Core tension

**Risk signal vs. review noise.** Review comments are costly: they ask the
author to stop and reason. A useful comment earns that cost by pointing to a
specific risk, explaining the affected behavior, and giving the author a path
to resolve or validate it. A noisy comment restates the diff, expresses taste,
duplicates tooling, or turns weak suspicion into confident prose.

Validation belongs in the review as confidence context, not as a command diary.
Report the evidence that changes trust in the patch and route mechanical command
history to chat closeout, CI, or follow-up discussion.

## Workflow

1. Orient to the change.
   - Read the PR title/body, linked task, commit message, or user request when
     available.
   - Identify the intended behavior: what should be introduced, preserved, or
     removed?
   - Classify the change shape: small patch, large refactor, docs-only,
     generated/vendor, UI, infrastructure/config, security-sensitive, or mixed.

2. Inspect risk-relevant context.
   - Start with the diff, then read surrounding code only where it changes risk:
     callers, callees, tests, schemas, config, migrations, feature flags,
     generated sources, or prior conventions.
   - Skip line-by-line style review of generated/vendor output unless the
     source of truth, provenance, or public contract is itself in question.
   - For UI changes, inspect states that users experience: loading, empty,
     error, disabled, permission-denied, responsive, accessibility, and copy.
   - For security-sensitive changes, trace trust boundaries, authorization,
     validation, secret handling, injection surfaces, logging, and dependency
     risk.

3. Use validation to calibrate confidence.
   - Run targeted checks when they are appropriate, cheap enough, and likely to
     change review confidence.
   - Prefer narrow checks for the changed behavior over broad suites by default.
   - If validation is unavailable or not run, state the residual risk instead
     of implying confidence.

4. Generate candidate findings.
   - Look first for correctness regressions, build/deploy breakage, security or
     privacy issues, data integrity problems, performance/reliability risks,
     missing validation for changed behavior, UX/accessibility regressions, and
     maintainability problems that plausibly create near-term defects.
   - Treat style, naming, formatting, and broad cleanup as low-priority unless
     project rules or real maintainability risk make them material.

5. Apply the evidence gate before reporting.
   - If a candidate fails the gate, downgrade it to a question, move it to
     residual risk, or omit it.

## Evidence gate

Every reported finding must answer these questions:

- **Location:** What changed line or nearest relevant location anchors the
  concern?
- **Evidence:** What code path, invariant, test result, spec, or repository
  convention supports the claim?
- **Affected behavior:** What breaks, weakens, slows down, leaks, confuses, or
  becomes harder to maintain?
- **PR relationship:** Why does this change introduce, expose, or worsen the
  issue?
- **Severity and confidence:** How bad is the impact if true, and how well is it
  supported?
- **Fix direction:** What concrete change, validation, or author decision would
  resolve the concern?
- **Novelty:** Is this adding signal beyond the diff, existing tool output, and
  other review comments?

Low-confidence concerns are not findings. Ask a targeted question when the
answer would change review judgment; otherwise record the uncertainty as
residual risk or stay silent.

## Severity and confidence

Use severity for impact and confidence for proof. Keep them separate.

- **Critical:** security breach, auth bypass, secret exposure, destructive data
  loss, build/deploy failure, or severe outage risk. Blocks by default.
- **High:** likely user-visible regression, broken public contract, serious
  reliability issue, unsafe migration/rollback, or significant security/data
  risk. Usually blocks.
- **Medium:** real edge-case bug, meaningful missing validation, moderate
  performance risk, or maintainability issue likely to create near-term defects.
  Blocks only when confidence and context justify it.
- **Low:** localized readability, docs, polish, or minor test improvement.
  Non-blocking.
- **Nit/Info:** formatting, wording, preference, praise, or future note. Never
  blocks.

Confidence is **high** when directly supported by code, tests, traces, specs, or
changed invariants; **medium** when strongly inferred but dependent on an
assumption; **low** when plausible but unproven. Low-confidence claims belong as
questions or residual risk, not findings.

## Output

Lead with findings, ordered by severity. Use concise titles and file/line
references. A finding should usually have this shape:

```text
issue (severity: High, confidence: high, blocking: true): <specific claim>

<evidence from code, tests, or context>

<affected behavior and why this PR introduces or worsens it>

<suggested fix, validation, or decision needed>
```

Use inline comments only for localized, actionable findings tied to changed
lines. Put broad design concerns, repeated patterns, missing coverage, review
scope, and residual risk in the final summary.

When there are no findings, say so plainly without manufacturing comments:

```text
No blocking findings found.

Reviewed: <scope>
Residual risk: <untested paths, skipped validation, or assumptions>
```

## Review signal

A review observation belongs in the output when it can become one of four
signals.

**Finding:** The change appears to diverge from its intended behavior or from a
project invariant. Anchor it to the relevant code, explain the evidence and
affected behavior, and give a fix direction.

**Residual risk:** The patch may be fine, but an important path, assumption, or
validation surface remains unexamined. Keep this in the summary. Include
file/line references there when they help locate the unexamined path or
assumption.

**Question:** The code cannot answer something that would change review
judgment: product intent, acceptable risk, migration expectations, or author
context. Ask the narrowest question that would resolve the uncertainty.

**Readiness synthesis:** The local observations add up to a merge-readiness
judgment. Use the final summary for that synthesis, especially when there are no
blocking findings.

If an observation cannot become one of these signals, keep it out of the review.
Tool output, style preferences, repeated examples, and diff narration are useful
only when they support a finding, residual risk, question, or readiness
judgment.

## Boundaries

This skill reviews a patch or PR. It does not implement fixes; if the user asks
to address review feedback, use `gh-resolve-review-threads` when GitHub review
threads are involved. If the user wants to read code together interactively,
use `walkthrough` instead. If the review uncovers an unknown system behavior
that requires investigation before judgment, switch to `recon` and return to
review after the unknown is grounded.
