---
name: per-cycle
description: Use when organizing a consequential change into preparation,
  implementation, and independent evaluation, or when the user asks for PER.
  Preserve expectations so the result can revise the understanding that guided
  the work.
metadata:
  wycats.kind: workflow
  wycats.user-invocable: "true"
  wycats.invocation: contextual
---

# PER Cycle

Prepare makes consequential expectations explicit. Execute works from them and
records what the work reveals. Review examines the resulting artifacts and
asks what the comparison teaches us about the change we wanted to make.

The handoffs preserve different perspectives on the same work. A prediction
gives execution something worth checking; an unexpected result may change the
approach; review can discover that preparation and implementation shared an
assumption that deserves another look. Each phase can investigate enough to
understand its findings. Its responsibility determines what it brings back.

## Arrange the work

As coordinator, keep the intended change and the reasoning across phases in
view. Choose where delegation adds useful attention or independence. You may
prepare a well-understood task yourself, delegate a difficult uncertainty, or
keep implementation with an agent that already understands the code. Give
review a fresh reader of the resulting artifacts so the implementation's
explanation can itself be examined. When a separate reader is unavailable,
make the limits of the review clear.

Choose workers from the host's available agents and capabilities. Shape their
assignments around the phase's purpose and the actual task; give them the
relevant stance to read. Choose model, tools, and context according to the
judgment and access the assignment needs. An existing specialist is useful when
its responsibilities fit. A general agent with a situated assignment can also
carry a phase.

Give each worker the intended outcome, relevant sources, constraints, and the
question its work should resolve. Carry forward settled decisions with their
reasons and keep assumptions recognizable as assumptions. A worker should be
able to recognize when a discovery changes its assignment. Agree on the files
or other effects it owns and which consequential changes need to return to you.

Balance the cost of another handoff against what a different perspective can
reveal. Existing preparation may already supply useful expectations; a small
correction may need only implementation and renewed review. Preserve what the
earlier work established as you choose where to resume.

## Prepare: make expectations testable

Use [hypothesis-forming](../../stances/hypothesis-forming/SKILL.md "composition:load")
to identify the expectations whose failure would change the approach. Ground
them in the available evidence: what do we expect to encounter, what supports
that expectation, and what would we need to inspect or try? Keep confidence
and consequence distinct. A doubtful assumption can deserve an inexpensive
check when being wrong would redirect substantial work.

Include how the result will become observable. A test may exercise the changed
code directly, or depend on a launcher, account, service, or fixture. Identify
which dependencies must work for the observation to bear on the claim, and
choose the shortest adequate way to establish that. Preparation is sufficient
when execution can act on the expectations and recognize evidence that would
change them.

## Execute: let the work inform the approach

Work from the intended outcome and the prepared expectations. Choose advances
and checks that keep consequential decisions in contact with the actual
workspace. Local discoveries can guide the next edit or inspection. Return a
finding to the coordinator when it changes the assignment, affects another
worker, or calls for a different approach to the whole task.

Preserve discoveries that change how the result should be understood, including
cases where an expected observation acquires a different significance. When
it becomes unclear what an observation establishes, use
[observational-grounding](../../stances/observational-grounding/SKILL.md "composition:load")
to inspect that uncertainty while continuing to develop the explanation.

Report the changed artifacts, checks actually performed, and consequential
revisions to the approach. If an attempt stops before reaching the behavior
under test, record where it stopped and what that establishes about the
dependency. For actions with external effects, preserve whether the action
occurred so a retry can account for what the previous attempt already did.
Repeated setup failures may warrant a bounded investigation of that dependency
before returning to the original experiment.

## Review: examine the result and its explanation

Give the reviewer the intended change, the original expectations, execution's
account, and access to the resulting artifacts. Evaluate whether the result
achieves the intended change, including consequences the predictions omitted.
Within that review, use
[hypothesis-evaluating](../../stances/hypothesis-evaluating/SKILL.md "composition:load")
to understand what comparing expectations with outcomes reveals about the
assumptions that guided the work. Inspect the artifacts and check consequential
claims in the account.

Agreement with the predictions provides evidence while leaving the shared
assumptions open to examination. Investigate consequential uncertainties far
enough to judge the result; preserve that assessment before returning fixes to
implementation. The host's review conventions govern how findings are reported.

Distinguish evidence about the behavior from evidence about the setup needed
to observe it. A successful build may establish implementation readiness while
the intended improvement in ordinary use remains unobserved. Explain what the
available evidence supports and what remains to be established. Bring back the
findings that affect whether to proceed or how to continue.

## Continue from what was learned

Connect the findings to the task as a whole. Resolve consequential
disagreements against the artifacts and evidence without repeating every
worker's investigation.

```text
repeat as needed:
  prepare the expectations still needed to act
  execute and let discoveries guide the next advance
  review the result against the intended change and earlier expectations
  continue with a local correction, reconsider the approach, or finish
```

A local correction can return to execution and then receive focused review.
A finding that changes the approach calls for revised preparation. Use
[steer-by-vision](../steer-by-vision/SKILL.md "composition:reference") when the
findings create a choice among project directions. This can happen when work
no longer appears to serve the intended outcome, or when a successful result
makes a further capability practical. If steering already supplied a purpose
and a condition for reconsidering the work, keep them attached to the cycle
and recognize when that condition arrives.

Use [collaborative-grounding](../../stances/collaborative-grounding/SKILL.md "composition:load")
when the consequential choice depends on the user's intent or experience.
Finish when the intended change has adequate support, or explain the specific
evidence or decision still needed. Across repeated cycles, a short working
record can preserve what was learned and what it changes about the next move.
