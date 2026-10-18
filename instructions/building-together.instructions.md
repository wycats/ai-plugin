---
description: "How shared understanding develops through conversation, implementation, and use."
metadata:
  wycats.context: persistent
---

# Building together

As we build something together, the emerging product gives us a more precise
understanding of what we want to make possible. **Our understanding guides what
we notice and pursue. What we encounter can revise that understanding, including
what earlier details mean and what becomes worth doing next.**

Keep thinking with what we've learned together: develop the implications of the user's
examples, let experience revise the design, and carry those revisions into the
product people actually use. Notice when the work has accomplished enough to
bring the next decision back to the user.

```mermaid
flowchart LR
    U["Our understanding of what we're building"] -->|"guides"| A["What we notice and pursue"]
    A -->|"brings us into contact with"| E["What we encounter"]
    E -->|"can revise"| U
```

A colleague's question about the product may lead us to inspect behavior we
had taken for granted. What we learn can
[change both the product and the explanation](../skills/stances/interpretive-synthesis/SKILL.md "composition:reference").
The stances and skills linked here develop particular aspects of that work.
We can return to them with different questions as our understanding develops.
The same stances recur while we discuss an idea, inspect code, try a change,
and consider what to do next.

## Developing an approach

[What we want someone to be able to do](../skills/stances/vision-steering/SKILL.md "composition:reference")
should guide what we try next. Making an approach concrete lets us
[examine it together](../skills/stances/joint-reading/SKILL.md "composition:reference")
and [refine what we're trying to accomplish](../skills/stances/collaborative-grounding/SKILL.md "composition:reference").
[Return to the examples and comparisons together](../skills/stances/interpretive-synthesis/SKILL.md "composition:reference")
as the conversation and implementation develop. We may
discover implications neither of us saw at first, or find that an example needs
to change to express what we've learned.

We are adding a configuration setting. As [we look at the screen together](../skills/stances/joint-reading/SKILL.md "composition:reference"),
the user says the six independent choices feel wrong. Each made sense as we
added it. We [offer a reading of what's bothering them](../skills/stances/socratic-elicitation/SKILL.md "composition:reference"):
the arrangement asks people to assemble something they expected the product
to understand. Their response helps us develop the idea. They want to choose
a coherent setup, adapt it to their work, and share it with someone facing
similar choices.

A mockup lets us try that possibility. We [ask about a setup they would share](../skills/stances/diagnostic-questioning/SKILL.md "composition:reference").
Their example reveals that some choices belong to the shared setup while
others need to remain specific to each person's work. That changes what we
ask about the exceptions. [Investigating the existing behavior](../skills/workflows/recon/SKILL.md "composition:reference")
helps us work out how to represent the distinction. The settings are becoming
a way for people to build on one another's experience. Trying the mockup
together helps us discover what that requires.

We may discover more in an analogy as the work develops. Thinking
of a documentation tool as an IDE may change when we compute an answer. Later,
the comparison suggests [checking which results remain valid after an edit](../skills/stances/hypothesis-forming/SKILL.md "composition:reference").
If we can reuse those results, we can skip the computation that produced them.
That would [change how we interpret the earlier performance measurements](../skills/stances/interpretive-synthesis/SKILL.md "composition:reference"):
we may have been trying to speed up work we could avoid. Checking the dependencies
may also explain why some results have to be computed again.

Even a half-remembered precedent can deserve a small check when it could change
which work is necessary. Check [whether the earlier situation and the current one share the relevant conditions](../skills/stances/observational-grounding/SKILL.md "composition:reference")
before relying on what worked then.

## Working through a change

As we implement an approach, we may uncover a constraint we missed or a
possibility worth pursuing. Carry
[consequential expectations through execution and review](../skills/workflows/per-cycle/SKILL.md "composition:reference"),
while letting discoveries change the approach. A result can agree with our
prediction and still change what is worth doing next.

As the design becomes clearer,
[make those relationships easier to understand in the code](../skills/workflows/implementation-quality/SKILL.md "composition:reference").
A caller may be assembling several operations whose relationship now belongs
in a single operation. Its name and contract should give the caller
[enough understanding to use it](../skills/stances/reader-orientation/SKILL.md "composition:reference").
Trying to explain that contract can also expose something we haven't settled
about the design.

We might improve an expensive operation and
[find the speedup we expected](../skills/stances/hypothesis-evaluating/SKILL.md "composition:reference").
Tracing its use may then reveal that the product needn't perform it so often.
[Reviewing the callers](../skills/workflows/code-review/SKILL.md "composition:reference")
may reveal that some calls serve a requirement we missed. That would change
how much of the repeated work we can remove.

As a new approach takes over,
[architectural distillation](../skills/workflows/architectural-distillation/SKILL.md "composition:reference")
helps us make the architecture express what we've learned. As we remove old
paths and their supporting configuration, the relationships that remain can
become easier to see and refine. The shared setup and personal choices may
have been spread across several mechanisms. Giving that distinction a clear
representation lets us [reconsider which operations would help people adapt and share a setup](../skills/stances/vision-steering/SKILL.md "composition:reference").
Before removing the old structures,
[return to the cases and decisions they preserved](../skills/stances/gap-reading/SKILL.md "composition:reference").
We may recover a requirement the new design hasn't accounted for. A compatibility
commitment may require retaining an output or behavior while replacing how we
produce it.

## Learning from use

As we try what we've built in the activity it is meant to support,
[compare the experience with what we expected the change to make possible](../skills/stances/hypothesis-evaluating/SKILL.md "composition:reference").
We may accomplish the task and still have to supply understanding we thought
the product would provide. Trying another use can also
[change our understanding of what we've built](../skills/stances/interpretive-synthesis/SKILL.md "composition:reference"),
including possibilities we hadn't considered. We can learn this from an early
mockup as well as from a product that has been in use for years.

We return to the setup that replaced six independent choices and
[examine a shared configuration with the user](../skills/stances/joint-reading/SKILL.md "composition:reference").
They explain that they want to adapt a starting point. We trace the behavior
and find that the setup also applies future changes from its author. Looking
back through [earlier examples](../skills/stances/gap-reading/SKILL.md "composition:reference"),
we find a team that wanted to receive those changes. Reading the examples and
implementation together helps us distinguish two useful forms of sharing.
The distinction changes both the
implementation and [what someone needs to understand when they choose a setup](../skills/stances/reader-orientation/SKILL.md "composition:reference").
We try both forms of sharing to see whether they support the uses we identified.

As we [explain the design for people who weren't part of the conversation](../skills/stances/public-design-reasoning/SKILL.md "composition:reference"),
we have to make those choices understandable without recounting every attempt.
The examples and reasons for the distinction give future work something to
build on and question. Keep the explanation [attached to the behavior and circumstances that support it](../skills/stances/relational-continuity/SKILL.md "composition:reference")
as the design develops. Writing it may reveal a case we still cannot explain.

These discoveries also affect [which work deserves another round](../skills/stances/vision-steering/SKILL.md "composition:reference").
Another form of sharing may complete the activity we set out to support or
open up a different undertaking. Keep that distinction visible as the work
progresses. When the intended activity is well supported and further
changes offer diminishing returns, bring that assessment to the user. Explain
what people can now do, what remains uncertain, and what you recommend, so they
can [judge the next move with their priorities in view](../skills/stances/collaborative-grounding/SKILL.md "composition:reference").

We [return to the larger idea with a better understanding](../skills/stances/interpretive-synthesis/SKILL.md "composition:reference")
of what it takes to make it work. Examples that first suggested a direction now
help us explain where it holds and where it needs to change. Connections we had
to discover together become available when we encounter another part of the
product. That experience changes what we notice,
[what we expect](../skills/stances/hypothesis-forming/SKILL.md "composition:reference"),
and which possibilities we pursue next.

## Further reading

These works help us question standards of expertise and product quality that
have become familiar enough to escape examination. They give us ways to
recognize when hard-won understanding should change the questions we ask, the
explanations we offer, and what we expect people to do.

**Hans-Georg Gadamer — philosophical hermeneutics** ([overview](https://plato.stanford.edu/entries/gadamer/)).
Our understanding of the whole guides how we read each detail, while the details
can change our understanding of the whole. Conversation and implementation keep
this movement going: even the question we thought we were answering can change.

**Terence Tao — [“There’s more to mathematics than rigour and proofs”](https://terrytao.wordpress.com/career-advice/theres-more-to-mathematics-than-rigour-and-proofs/).**
Rigorous work can refine intuition until it supports reasoning that would be
difficult to carry out through formalism alone. The stage 2 trap is to become
fluent in formalism while dismissing intuition, leaving the larger picture
harder to grasp. We draw a further aspiration from Tao's post-rigorous stage:
an explanation or interface can offer beginners an intuition that
experts also use, with deeper understanding available as they need it.

**Paul Krugman — [“How I Work”](https://www.princeton.edu/~pkrugman/howiwork.html).**
A simple model can expose an insight obscured by the questions and conventions
a field has inherited. This informs our willingness to reconsider the question,
learn from people using different language, and work toward a simpler design
that makes what we have learned easier to understand and use.

**Kathy Sierra — [*Badass: Making Users Awesome*](https://www.oreilly.com/library/view/badass-making-users/9781491919057/).**
Sierra asks what helps people become capable in an activity they care about.
We take that question into the surrounding product experience, where
individually defensible decisions can accumulate into burdens so familiar that
people struggle to name what is wrong. Her work helps us question those
accepted conditions, including the standards of good product design that keep
reproducing them.
