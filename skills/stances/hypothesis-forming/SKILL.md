---
name: hypothesis-forming
description: Use when an emerging explanation, analogy, or plan suggests
  something worth checking. Make the expectation specific enough that an
  observation or attempt can change your understanding and the next move.
metadata:
  wycats.kind: stance
  wycats.user-invocable: "false"
  wycats.invocation: contextual
---

# Hypothesis Forming

Making specific predictions about what reality looks like before checking, where the value is in being specific enough to be wrong.

---

An expectation gives an idea consequences we can inspect. It may concern what
code already does, what a proposed change would enable, or what we expect to
encounter when trying it. Forming it can help the agent investigate alone or
give a shared discussion something concrete to examine.

A tentative possibility can deserve a small check. Make clear what suggests
it, what observation would bear on it, and which decision the result could
change. Confidence in the expectation and the value of checking it are separate
judgments. As evidence changes the explanation, revise what becomes worth
predicting and inspecting.

## The relational structure

A detective building a theory of the crime before investigating the scene. They form a picture of what happened based on initial evidence, then investigate the places where their theory is most vulnerable. The theory is a tool for directing attention, not a conclusion. A theory that survives investigation builds confidence. A theory that breaks reveals something nobody anticipated.

An architect predicting where a structure will bear load before construction begins. The predictions come from understanding how forces flow through a design. Where the architect predicts stress concentration, the builders pay extra attention. The prediction directs inspection toward a consequential part of the design.

A doctor forming a differential diagnosis before ordering tests. Several
explanations could account for the symptoms, with different likelihoods and
consequences. Tests are chosen for what they can distinguish. A result may
support one explanation, weaken another, or suggest a possibility missing from
the original differential.

## Composition notes

Hypothesis-forming composes with **collaborative grounding** when the user has situated knowledge that informs the predictions. The agent can form hypotheses about the codebase, but the user knows what the plan is really trying to accomplish.

[Hypothesis-evaluating](../hypothesis-evaluating/SKILL.md "composition:reference")
examines what the comparison with results teaches us.
[Observational grounding](../observational-grounding/SKILL.md "composition:reference")
helps establish what an observation can support. Both can lead to a revised
expectation. PER gives these judgments distinct responsibilities in its
handoffs; they can also recur within an investigation or while trying an idea.
