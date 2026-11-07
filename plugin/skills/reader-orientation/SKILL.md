---
name: reader-orientation
description: Use when shaping code, explanations, interfaces, or instructions
  around what someone can know where they encounter them, so they can reason
  locally and investigate deeper without losing the larger idea.
user-invocable: false
---

# Reader Orientation

Work from what someone can know where they encounter the artifact. Give them
the concepts and relationships needed to understand what they are seeing and
decide what to do next.

---

The person constructing something has context its reader may never receive.
They know why the pieces exist, which distinctions matter, and what lies behind
each name. A reader encounters a particular part: a call site, a paragraph, a
diagram, a step in a procedure. The artifact has to carry the understanding
needed there. Familiarity with the whole can make a missing connection invisible
to its author.

## The core tension

**Enough context to reason locally, while keeping the larger structure
comprehensible.** Making every part self-contained overwhelms the reader with
repetition and detail. Compressing every part into a name can require constant
navigation before anything means something.

Choose what belongs at the current level, what a reliable contract can carry,
and what becomes useful when someone deliberately investigates further. The
right amount of explanation depends on the reader's task and established
vocabulary. An experienced reader entering through an unfamiliar interface may
need a relationship explained that a beginner following the full tutorial
already encountered.

Readers also interpret the choice to explain something. A qualification can
supply a boundary they need, or draw attention to a boundary they already
assume. In the latter case, they may look for a further reason it was mentioned
and infer doubt or significance the author did not intend. Judge what the
explanation changes for these readers, including what its presence suggests.

Shared understanding depends on the particular audience and occasion. Prior
exchanges and familiar conventions offer evidence of it. A broad label such as
“experienced reader” leaves open which assumptions these people share here.

Deeper inspection should reveal the mechanics behind the understanding already
offered. When it overturns that understanding, either the account was misleading
or the underlying structure needs to change. Clear boundaries can contain
difficult internals; further polish earns its place when it helps someone map
those boundaries' promises onto what happens inside.

## Develop the reader's intuition through the details

An opening gives readers a situation they can reason about and an idea of what
is at stake. That intuition can be rich and sophisticated. “Migrate customer
records to a new database” tells readers what the work involves; “test the
migration assumptions” relies on them already knowing it. The concrete opening
gives later questions about preserving names and addresses something to refer
to. A clear explanation later may arrive too late for someone who lost the
thread at the beginning.

As examples and evidence accumulate, show how they bear on that central idea.
Each detail can make a relationship more concrete, explain why it holds, or
reveal a condition that changes it. Readers can then use their developing
understanding to interpret what follows. The writer has to make these
connections available throughout the account. Group details that help explain
each other. In advice to a choir, a proposed seating change belongs beside the
explanation that singers need to hear their neighbors to match their vowels.
Putting it under “unresolved questions” beside a concern about vocal health
would separate it from the problem it might solve.

In a conclusion, return to the central idea with the important findings behind
it. A migration discussion might begin with preserving what customers told us.
After examining names that cannot safely be split at a space, it can recommend
preserving full names and collecting separate parts where needed. Readers now
understand what preservation requires in this case and why. A sentence saying
that they now have enough information to decide adds little to that account.
When the evidence changes the idea, return to its revised form. If a decision
remains open, explain which finding would change it and how.

This applies the movement between parts and whole described in
[Interpretive synthesis](../interpretive-synthesis/SKILL.md "composition:reference")
to the reader's experience of an explanation. Terence Tao's
[account of intuition and rigour](https://terrytao.wordpress.com/career-advice/theres-more-to-mathematics-than-rigour-and-proofs/)
offers a related model: working through rigorous detail lets someone return to
intuition with the understanding to refine and reason with it. In prose, the
opening offers an intuition the reader can follow; the conclusion helps them
reason with it.

## What the reader has to work out

Within a sentence, readers need to understand who does what, what each phrase
refers to, and how the ideas relate. Examine what the words explain and what
the intended readers would have to supply from elsewhere.

Explain relationships through the things involved. “Give your colleague the
measured improvement, the untested condition, and the next check” names what
belongs in an explanation, but leaves the explanation to the reader. An account
of a shared-notes experiment can say: “Updates appeared sooner in the local
test. We haven't tested several people editing at once, so we don't yet know
how quickly their updates appear or whether they arrive in the right order.”
That tells the colleague what improved and why another test matters. The
category names can still be useful to someone planning the account.

Let readers follow a thought before asking them to change levels. Moving from
collaboration in general to a particular bug and then to a design principle
within one sentence can leave them unsure which claim the example supports.
Establish the case and explain what it shows. Longer wording earns its place
when it supplies a connection readers would otherwise have to reconstruct.

“The new structure answers to a written account of what was learned” leaves
readers to work out what “answers to” means here. In the design guide it came
from, the intended action was to check the proposed structure against the
account: does the design handle the cases described there? Asking readers only
to write the account would drop that check. Making the action explicit can also
reveal that the writer has not decided what it should be. Investigate the
source or ask the writer when the meaning remains unsettled.

Word order can make a relationship harder to follow even when the words are
familiar. “Keep separate the cases that need different behavior” tells readers
to keep something separate before naming the cases. “Keep the cases that need
different behavior separate from each other” names the cases first. The latter
was easier for this guide's reader to follow. Judge the sentence in its context:
an abstract subject can be clear, as in “A new detail can change your
explanation,” and familiar wording may need no revision. A contrast earns its
place when readers need to distinguish plausible choices. A warning about an
unintroduced mistake can make them wonder why that mistake matters here.

Names and examples depend on what readers already know. Calling one participant
“the daughter,” then “the family member,” then “the visitor” may suggest that
several people are involved. An example about “the six choices” needs an
introduction for someone who has not seen the setup screen. For someone who has
just read that story, the same phrase may be enough. “We” can invite shared
inquiry, as in “Where do we begin?”, when readers can tell who is included.

Compare a clearer version with the original: what it asks readers to do, which
cases it covers, its conditions, and its uncertainty. A revision can be easy to
read while changing any of these. [Authorial continuity](../authorial-continuity/SKILL.md "composition:reference")
helps examine what the revision would communicate about the writer's judgment
and relationship with these readers, beyond the explicit claims.

## The relational structure

These examples change the medium and the reader's task. Each makes a particular
level useful while preserving a faithful connection to what it leaves out.

A transit map distorts physical distances so a traveler can see routes and
connections. It preserves the relationships needed to choose a journey. A
station diagram supplies the exits and platforms when the traveler needs that
detail. A transfer drawn as effortless when it requires leaving the station
would break the understanding the first map offered.

A recipe lets a cook follow the sequence while keeping ingredient preparation
and optional technique explanations available where they are useful. "Fold in
the whites" can carry a familiar technique for an experienced baker. A recipe
introducing that technique gives enough explanation at that step to preserve
the air the rest of the recipe relies on. The author's familiarity cannot stand
in for the cook's available knowledge.

A mathematical exposition uses a lemma whose statement makes the main argument
possible to follow without holding its proof in mind. The proof is available
for inspection. The lemma must expose the assumptions its use depends on; a
hidden condition discovered only inside the proof would invalidate the reader's
reasoning at the point of use.

## Composition notes

[Interpretive synthesis](../interpretive-synthesis/SKILL.md "composition:reference")
revises the account as parts and whole illuminate each other. Reader orientation
asks what of that account is available at each encounter.

[Joint reading](../joint-reading/SKILL.md "composition:reference") reveals where
another person's reading differs from the author's expectation.
[Collaborative grounding](../collaborative-grounding/SKILL.md "composition:reference")
helps resolve which audience, task, or distinction matters when the user's
intent leaves several plausible directions.

[Public design reasoning](../public-design-reasoning/SKILL.md "composition:reference")
carries a design into durable public prose. Reader orientation attends to its
different entry points. [Relational continuity](../relational-continuity/SKILL.md "composition:reference")
keeps the language of the work attached to the concrete situation it describes.
