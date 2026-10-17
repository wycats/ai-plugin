---
name: diagnostic-questioning
description: Use when the next move depends on another person's intent,
  priorities, or experience, and each answer will help you choose what to ask
  next. Ground questions in what you already know; inspect observable system
  behavior through tools.
metadata:
  wycats.kind: stance
  wycats.user-invocable: "false"
  wycats.invocation: contextual
---

# Diagnostic Questioning

Adaptive sequential questioning where each answer reshapes the questioner's model and determines the next question.

---

The questioner has done their homework. They have a preliminary understanding
and a consequential uncertainty that the other person's experience or intent
can help resolve. Each answer changes that understanding and what becomes
worth asking next. Use tools for questions the available evidence can settle.

A question about a detail can reveal that the larger question was mistaken.
An answer that seemed to settle the direction can acquire a different meaning
after a later example. Keep revising both the uncertainty and the questions
that could resolve it. The order develops through the exchange.

## The relational structure

These examples span trivial to intimate stakes. The questioning structure is the same in each — the stakes determine how much sequencing matters, not whether it applies.

A sommelier helping someone choose a wine. "Do you tend toward red or white? How do you feel about tannins? What's a wine you've really enjoyed recently?" The customer can't fully articulate what they want. Each answer narrows the space and determines the next question. The sommelier isn't exploring randomly — they have a model of the flavor space and are converging on the region the customer will enjoy.

An experienced interviewer assessing a candidate. The first question is broad: "Tell me about the hardest technical decision you made last year." The answer reveals what the candidate considers hard, which tells the interviewer where to probe. "You mentioned the team disagreed about the migration approach — how did you handle that?" Each question is chosen based on what the previous answer revealed about where to look next.

A therapist in a session. They have a clinical model. Each question tests it. But the sequencing is trust-constrained: the right question asked too early closes the door rather than opening it. Each question must be one the client is ready to answer. The therapist is also reading cognitive capacity, fatigue, and emotional readiness — the _order_ of questions matters not just for information gain but because some paths close off others.

A parent sensing their teenager is struggling. "How did the presentation go today?" is specific, grounded, and safe. The answer — or the way it's deflected — reshapes the model. Ask too directly and the teenager retreats. Ask too indirectly and the window passes. Unlike the therapist, the parent and teenager live together — a question that lands wrong at dinner changes the relational context for every interaction after.

## Ask from what you know

Make the uncertainty concrete enough that the user can contribute without
reconstructing the investigation. If the implementation permits two behaviors,
show the difference and ask about the experience each would support. Their
answer may select one, reveal a third, or change what the implementation should
make possible.

Choose questions whose answers could change the work. Several plausible
interpretations of the user's intent may deserve a question; an observable
detail may need inspection. An answer already given should inform the next
move. Once the uncertainty is sufficiently resolved, act on what we have
learned and let further work expose the next useful question.

## Composition notes

Diagnostic questioning is [collaborative grounding](../collaborative-grounding/SKILL.md "composition:reference") structured around uncertainty reduction. The agent uses its perception to identify where uncertainty is highest, then asks the user to contribute the situated knowledge that resolves it.

[Socratic elicitation](../socratic-elicitation/SKILL.md "composition:reference")
helps when the question surfaces an intuition the user wants to develop. Give
that emerging understanding room while keeping the concrete decision in view;
it may change which decision needs to be made. A more precise uncertainty may
in turn emerge from the reflective conversation.

[Interpretive synthesis](../interpretive-synthesis/SKILL.md "composition:reference")
relates each answer to the larger understanding, including when an answer
changes how we understand something the user said earlier.
[Joint reading](../joint-reading/SKILL.md "composition:reference") can make the
question concrete through a shared artifact. Dangling-thread review uses
diagnostic questioning when a thread's status depends on the user's situated
knowledge.
