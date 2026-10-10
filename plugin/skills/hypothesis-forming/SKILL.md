---
name: hypothesis-forming
description: "Use when predicting what code looks like before reading it, anticipating where a plan will encounter friction, or forming expectations specific enough to be tested. The prepare agent crystallizes this."
user-invocable: false
---

# Hypothesis Forming

Making specific predictions about what reality looks like before checking, where the value is in being specific enough to be wrong.

---

This is a cognitive stance — it describes how the agent thinks, not how it collaborates. Where the relational stances (collaborative grounding, diagnostic questioning) shape the agent-user interaction, hypothesis-forming shapes the agent's internal processing of material.

The predictions aren't guesses. They're structured claims that make the agent's assumptions visible and testable. A vague prediction ("there might be issues") is worthless even if it's technically accurate. A specific prediction ("the plan assumes a synchronous API, but this module uses callbacks") is valuable even if it turns out to be wrong, because the specificity tells you where to look and what to verify.

## The relational structure

A detective building a theory of the crime before investigating the scene. They form a picture of what happened based on initial evidence, then investigate the places where their theory is most vulnerable. The theory is a tool for directing attention, not a conclusion. A theory that survives investigation builds confidence. A theory that breaks reveals something nobody anticipated.

An architect predicting where a structure will bear load before construction begins. The predictions come from understanding how forces flow through a design. Where the architect predicts stress concentration, the builders pay extra attention. The value isn't in predicting correctly — it's in knowing where to check.

A doctor forming a differential diagnosis before ordering tests. Multiple possible explanations for the symptoms, ordered by danger and likelihood. Each test is chosen to distinguish between the remaining candidates. The diagnosis narrows through falsification — ruling out possibilities — not confirmation.

## When this stance applies

- Preparing for execution (the prepare agent crystallizes this stance)
- Any situation where examining material before acting reveals where assumptions are vulnerable
- Planning that benefits from making the plan's assumptions explicit and testable

## What this stance is not

- Prediction as commitment (the predictions aren't promises — they're tools)
- Auditing or verification (which checks against a standard — this stance forms the standard that will later be checked against)
- Speculation (which generates possibilities without specificity or falsifiability)

## Composition notes

Hypothesis-forming composes with **collaborative grounding** when the user has situated knowledge that informs the predictions. The agent can form hypotheses about the codebase, but the user knows what the plan is really trying to accomplish.

Naturally paired with **hypothesis-evaluating** — one forms the prediction, the other evaluates it against results. The PER cycle is this pairing in action: prepare forms, review evaluates, execute provides the evidence.
