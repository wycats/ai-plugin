---
name: diagnostic-questioning
description: "Use when investigating unfamiliar territory, narrowing possibilities through targeted questions, or diagnosing a problem by updating your own model of the situation."
user-invocable: false
---

# Diagnostic Questioning

Adaptive sequential questioning where each answer reshapes the questioner's model and determines the next question.

---

The questioner has done their homework — they have a preliminary model of the space. The questions test that model against the other party's knowledge, targeting the specific places where the questioner's understanding is most likely to be wrong.

The sequence matters. Early questions establish the frame — the broad shape of what matters. Later questions probe within that frame. The questioner doesn't ask about details before understanding the big picture, and doesn't ask about the big picture after the details have already revealed it.

## The relational structure

These examples span trivial to intimate stakes. The questioning structure is the same in each — the stakes determine how much sequencing matters, not whether it applies.

A sommelier helping someone choose a wine. "Do you tend toward red or white? How do you feel about tannins? What's a wine you've really enjoyed recently?" The customer can't fully articulate what they want. Each answer narrows the space and determines the next question. The sommelier isn't exploring randomly — they have a model of the flavor space and are converging on the region the customer will enjoy.

An experienced interviewer assessing a candidate. The first question is broad: "Tell me about the hardest technical decision you made last year." The answer reveals what the candidate considers hard, which tells the interviewer where to probe. "You mentioned the team disagreed about the migration approach — how did you handle that?" Each question is chosen based on what the previous answer revealed about where to look next.

A therapist in a session. They have a clinical model. Each question tests it. But the sequencing is trust-constrained: the right question asked too early closes the door rather than opening it. Each question must be one the client is ready to answer. The therapist is also reading cognitive capacity, fatigue, and emotional readiness — the _order_ of questions matters not just for information gain but because some paths close off others.

A parent sensing their teenager is struggling. "How did the presentation go today?" is specific, grounded, and safe. The answer — or the way it's deflected — reshapes the model. Ask too directly and the teenager retreats. Ask too indirectly and the window passes. Unlike the therapist, the parent and teenager live together — a question that lands wrong at dinner changes the relational context for every interaction after.

## The key property

Each question is designed to be easy to answer but hard to predict. "Do you want to continue the refactor?" is easy to predict (probably yes) and wastes the collaboration budget. "The refactor touched the request builder but stopped before the response handler — was that a natural boundary or did you run out of time?" is easy to answer but reveals something the agent couldn't know.

## Relationship to pregnant tensions

High-variance threads often arise from pregnant tensions — situations where competing concerns create a real decision point. These are the most important threads to ask about, because they represent genuine choices the user needs to make. The diagnostic sequence should prioritize pregnant tensions over simple information gaps.

## When this stance applies

- Triaging dangling threads during a handoff
- Understanding the user's priorities before starting work
- Any situation where the agent needs to elicit the user's intent and the intent isn't obvious from the observable context

## What this stance is not

- A survey (presenting all questions at once)
- A checklist (confirming known items)
- Open-ended exploration (the agent has a specific uncertainty to resolve)
- Investigation of systems (that's recon — adaptive investigation of code, not questioning of people)

## Tension with Socratic elicitation

Diagnostic questioning is efficient — it wants to maximize information gain per question. Socratic elicitation is generative — it wants to help the user discover what they think, which sometimes means following a thread that isn't the highest-variance one but is the one the user's energy is on.

In practice, the user may respond to a high-variance question by going somewhere unexpected. The diagnostic stance says to get back to the highest-variance thread. The Socratic stance says to follow the user's energy. This is a real tension in interview practice — do you follow the interviewee's energy or stick to your diagnostic sequence?

Resolve this in context. When the user's energy is revealing something the diagnostic sequence wouldn't have found, follow it. When the user is drifting away from a decision that needs to be made, gently return to the diagnostic thread.

## Composition notes

Diagnostic questioning is [collaborative grounding](../collaborative-grounding/SKILL.md "composition:reference") structured around uncertainty reduction. The agent uses its perception to identify where uncertainty is highest, then asks the user to contribute the situated knowledge that resolves it.

Composes naturally with **Socratic elicitation** (diagnostic questioning identifies _what_ to ask; Socratic elicitation shapes _how_ to ask it — but see the tension above). Composes with [interpretive synthesis](../interpretive-synthesis/SKILL.md "composition:reference") (the coherent account of the session reveals where the high-variance threads are). The handoff skill uses diagnostic questioning to triage dangling threads.
