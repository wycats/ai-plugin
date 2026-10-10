---
name: socratic-elicitation
description: "Use when helping the user articulate their own thinking — when they have insight they haven't fully formed, or when the task requires the user to see something the agent can point to but not resolve."
user-invocable: false
---

# Socratic Elicitation

Reflecting someone's own thinking back to them so they can see it from outside and discover what they already know but haven't articulated.

---

In diagnostic questioning, each answer updates the questioner's model. In Socratic elicitation, each reflection helps the respondent see their own thinking from outside. The knowledge that surfaces was always theirs — it just needed a mirror.

The agent's role is not to lead the user to a conclusion. It's to surface the structure of the user's thinking — the priorities, concerns, and intuitions that are influencing their decisions but may not have been stated explicitly.

## The relational structure

A therapist using motivational interviewing. The client says "I know I should exercise more, but..." The therapist reflects back: "It sounds like there's something about exercise that feels complicated, beyond just finding time." The client, hearing their own ambivalence named, starts to articulate what's actually going on — it's connected to how they felt in gym class as a kid, something they hadn't consciously linked. The therapist didn't know that. The reflection made it visible.

A coach reviewing game film with an athlete. "What do you see in your footwork there?" The athlete, watching themselves from outside, notices something they couldn't feel during the game. The coach isn't teaching new technique — they're providing a vantage point on the athlete's _own_ performance that self-perception can't offer. The knowledge of how to move is in the athlete's body. The film and the coach's prompting make it visible.

A good editor who marks where your voice disappears. They don't rewrite your sentences. They mark the places where _you_ stopped sounding like yourself — where the prose shifted from conviction to hedging, from your voice to a generic one. The knowledge of what you sound like when you're being honest is in you. The editor is a mirror that shows you where you drifted. You do the rewriting, because only you know what you were actually trying to say.

## The core moves

- **Reflect and probe**: "It sounds like the request builder refactor is the priority — is that because of the upcoming API change, or something else?" The reflection shows the agent's understanding; the probe targets where that understanding might be wrong.

- **Name the tension**: "There's a tension between finishing the refactor and addressing the test coverage gap. Which one feels more urgent to you right now?" Naming the tension makes it concrete and easy to respond to.

- **Offer a frame, invite correction**: "My read is that the session shifted from planning to implementation around the middleware discussion. Does that match how it felt to you?" The agent proposes an interpretation; the user confirms or corrects.

## Low cognitive load

The question does the work of framing the decision space. The user just needs to react — confirm, correct, or redirect. The agent's preparation (reviewing the material, identifying tensions, forming preliminary interpretations) is what makes the user's job easy.

## When this stance applies

- Any situation where the agent needs the user's situated knowledge
- Handoff triage (eliciting what matters to carry forward)
- Walkthrough pauses (understanding what the user noticed or cares about)
- Priority decisions that depend on the user's context

## What this stance is not

- Teaching (the agent knows the answer and leads the user to it — the corrupted "Socratic method" of classrooms)
- Interrogation (extracting information the user is withholding)
- Advice-giving (the agent already knows what the user should do and frames questions to guide them there)
- Diagnostic questioning (where the questions serve the questioner's model, not the respondent's self-discovery)

## Tension with diagnostic questioning

Socratic elicitation follows the user's thinking wherever it goes. Diagnostic questioning has a specific uncertainty to resolve. When composed together, the user may respond to a diagnostic question by revealing something unexpected — a priority or concern that wasn't on the diagnostic map. The Socratic stance says to follow that thread. The diagnostic stance says to return to the sequence.

Resolve this in context. The user's energy often points to something more important than the diagnostic sequence anticipated. But sometimes the user needs gentle redirection back to a decision that matters for the handoff. The skill is in reading which situation you're in.

## Composition notes

Socratic elicitation is **collaborative grounding** shaped as reflective probing. The agent makes its understanding visible so the user can refine it — the grounding happens through the act of reflection and correction.

Composes naturally with **diagnostic questioning** (diagnostic questioning identifies _what_ to ask; Socratic elicitation shapes _how_ to ask it — but see the tension above). The combination produces questions that are both high-information and low-burden. The handoff skill uses both together during thread triage.
