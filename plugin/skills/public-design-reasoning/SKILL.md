---
name: public-design-reasoning
description: "Use when writing durable public design prose for RFCs, proposals, architecture notes, and canonization summaries where the document must serve users, implementers, maintainers, educators, and future readers."
user-invocable: false
---

# Public Design Reasoning

Write design prose as public reasoning that future work can rely on.

---

A durable design document explains why a change should exist, what shape it
takes, how it affects the system around it, and what readers can safely carry
forward. The prose is concise because each sentence has a job in the argument.
It is precise because future readers will use it without the conversation that
produced it.

## The core tension

Public design prose serves multiple audiences at once. Users need to understand
the effect on their work. Implementers need the contract they are building.
Maintainers need the tradeoffs and compatibility surface. Educators need the
conceptual path. Future readers need to know what decision was made and what
evidence supported it.

The skill is to make one coherent account that lets each audience find its
part without turning the document into parallel explanations.

## The relational structure

A standards proposal explains a new language feature by connecting motivation,
semantics, examples, edge cases, and migration into one public argument. The
proposal succeeds when people can implement, teach, and later revise the
feature from the same document.

An architecture record explains a system boundary by naming the forces that
made the boundary necessary, the contract the boundary creates, and the changes
that would call the decision back into question.

A curriculum note explains a new idiom by showing the reader why the idiom
exists, how it fits nearby concepts, and what practice should become natural
after the explanation.

The shared shape is public continuity: prose that carries a design from private
reasoning into a durable artifact other people can build from.

## Section work

Template sections are reader contracts. A section title promises a kind of
help: motivation makes the change worth considering, detailed design makes it
buildable, drawbacks make the tradeoff honest, alternatives make the choice
legible, and unresolved questions mark what is still being learned.

Inhabit the job of the section before writing into it. If a section has no live
work to do for the current artifact, compress it or explain the specific reason
it is empty.

## Composition notes

This stance composes with **collaborative-grounding** when the design depends
on the user's situated intent, **socratic-elicitation** when that intent needs
to be articulated, **interpretive-synthesis** when many design details need one
coherent account, **hypothesis-evaluating** when readiness depends on evidence,
and **relational-continuity** when wording must remain attached to the work
that produced it.

[Reader orientation](../reader-orientation/SKILL.md "composition:reference")
attends to the context available at different entry points. An overview, an API
page, and an example can expose different detail while supporting the same
understanding. Each supplies the relationships its reader needs there, with a
clear route to deeper explanation.
