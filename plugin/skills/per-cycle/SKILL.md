---
name: per-cycle
description: Use when organizing a consequential change into preparation,
  implementation, and independent evaluation, or when the user asks for PER.
  Preserve expectations so the result can revise the understanding that guided
  the work.
user-invocable: true
---

# PER Cycle

Prepare an approach with expectations the implementer can test against the
work. As implementation exposes details that preparation could not settle,
bring them back to the people whose understanding may help. Review examines
whether the resulting change serves its purpose, including assumptions that
preparation and implementation may have come to share.

As discoveries change the approach,
[return to earlier observations whose meaning depended on the explanation being revised](../interpretive-synthesis/SKILL.md "composition:load context=activity").

## Establish the change and arrange the contributions

As coordinator, decide which questions need another participant's attention.
An implementer who encounters an unfamiliar protocol may need someone to
investigate its guarantees while implementation continues elsewhere. A small
correction to reviewed work may already have enough preparation to proceed
directly to an edit and another review.

Give participants the intended outcome, relevant evidence, constraints and the
question their contribution should resolve. Carry decisions with their reasons
and distinguish assumptions they may need to revisit. Establish who owns edits
and other effects, so exchanging an idea leaves responsibility for acting clear.
Choose agents and tools available in the application running the work.

Keep the person who developed an expectation available to discuss the reasoning
behind it. For review, bring in a reader who can examine the artifacts before
adopting the implementer's explanation. Where a separate reader is unavailable,
state who performed the evaluation so the caller can judge how much independent
examination the change has received.

## Prepare enough to act and recognize a surprise

[Make consequential expectations explicit](../hypothesis-forming/SKILL.md "composition:load"). Explain what you expect to
encounter, why you expect it, and how that expectation supports the proposed
change. A calculation may be as expensive as predicted, yet turn out to run
unnecessarily. Knowing that the purpose was to remove a pause lets execution
reconsider whether to make the calculation faster or change when it runs.

Identify how execution and review can observe the intended improvement. If a
check depends on a launcher, service, account or fixture, establish that it can
reach the behavior being changed. Try an inexpensive experiment when an uncertain
dependency would otherwise leave substantial work resting on an untested assumption.

Preparation is sufficient when execution can make a useful advance and recognize
evidence that deserves reconsideration.

## Develop the approach through the work

Implement the prepared approach, checking its expectations against what you
find. When a detail puzzles you, share it with someone whose understanding
could help. You can investigate what it means together.

While adding a cache, an implementer notices repeated calls with identical
inputs. The preparer had assumed they came from separate edits. Comparing that
assumption with the trace leads them to distinguish edits from the consumers
responding to them. Several consumers need the same result for one edit, so
sharing that result may solve the problem without a longer-lived cache.

When agents can message one another, let them investigate together directly.
Keep work that does not depend on the open question moving. If the approach
changes, tell the coordinator and anyone relying on it what changed your
understanding. Keep that evidence with the original expectation for review.

When a check's result is hard to interpret,
[establish what the attempt actually reached](../observational-grounding/SKILL.md "composition:load"). A failure to launch the application
leaves the changed behavior untested. Establish where the attempt stopped
before deciding what to fix or try next.

## Review with an account of your own

Give the reviewer the intended outcome, constraints, original expectations and
access to the artifacts and execution evidence. Ask it to trace consequential
behavior and examine the assumptions on which the change depends. Let it record
questions from that examination before discussing the implementer's rationale.
That gives the discussion an account grounded in the reviewer's own inspection,
including details the implementation story may have left out.

[Compare the result with the expectations that guided the work](../hypothesis-evaluating/SKILL.md "composition:load"). Investigate
uncertainties with the people who prepared and implemented the change.

In the calculation example, review might find a consumer that runs outside the
edit transaction. Asking how it obtains a result can expose a limit of sharing,
even though the measured interaction improved. The implementer can address that
path. After the exchange, the reviewer returns to the artifact and determines
which concerns the evidence resolves and which remain.

Apply the project's review criteria and reporting conventions. Distinguish evidence
for implementation readiness from evidence for the intended benefit. A build
may pass while ordinary use remains unobserved. Explain what the available
evidence supports before recommending whether to proceed.

## Continue at the level the finding requires

```text
when a detail raises a question:
  examine it in the current account
  seek another perspective where it could help
  let the exchange clarify what, if anything, needs reconsidering
  follow that implication and evaluate the affected result
```

A local correction can receive focused review. When a finding changes the
approach, identify which expectations now need to be worked out before proceeding.
Earlier evidence may still apply, even if its significance has changed. Return
to participants who can explain how it was obtained and what they made of it.
If the difficulty is an assumption those participants have come to share, invite
someone to examine its grounds afresh. When an agent cannot receive a follow-up,
carry the relevant evidence and open question into the next assignment.

Use [steer by vision](../steer-by-vision/SKILL.md "composition:reference")
when findings create a choice among project directions. Keep the user's purpose
and any agreed conditions for reconsideration attached to the cycle.
When a consequential choice depends on their intent or experience,
[work through that choice with them](../collaborative-grounding/SKILL.md "composition:load").

Finish when the intended change has adequate support, or explain the specific
evidence or decision still needed. Keep a working record when it lets participants
resume with the reasons for the current approach and the unresolved questions.
