---
name: reader-orientation
description: "Use when shaping code, explanations, interfaces, or instructions around what someone can know where they encounter them, so they can reason locally and investigate deeper without losing the larger idea."
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

Deeper inspection should reveal the mechanics behind the understanding already
offered. When it overturns that understanding, either the account was misleading
or the underlying structure needs to change. Clear boundaries can contain
difficult internals; further polish earns its place when it helps someone map
those boundaries' promises onto what happens inside.

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
