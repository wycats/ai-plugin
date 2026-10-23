# Quality Principles

These principles guide how skills, agents, instructions, and hooks in this
plugin are written. [FOUNDATIONS.md](FOUNDATIONS.md) explains the working model
behind them: how language establishes a stance and how available information
shapes what an agent can judge.

Judge a resource by how well it helps the agent understand and carry out its
work. A trial may expose a missing distinction in the resource or an assumption
in these principles that needs revision. Preserve exact requirements where the
work depends on them, such as an authorization boundary or an output contract.
Put mechanical checks in code when they can reliably establish the result.

## Structure matches execution shape

The sections should make the work's main responsibilities and transitions easy
to find. Explain what causes a return to an earlier question when the workflow
depends on iteration. Give each responsibility the space needed to understand
it, including a short section when its judgment is already clear.

## Template sections are reader contracts

A template section earns its place by the work it does for the reader. Motivation makes the change worth considering. Detailed design makes it buildable. Drawbacks make the tradeoff honest. Alternatives make the choice legible. Unresolved questions mark where learning remains.

When writing into a template, inhabit the section's communicative job before filling it. Empty or perfunctory sections weaken the stance because they teach the agent that the heading matters more than the public reasoning the heading promised.

## Front-load the mental model

The first few lines of a skill should describe the _shape_ of the work, not the first step. The agent needs to know what kind of process this is before it starts executing. A sentence like "this skill has three phases — the second is the core" reframes everything that follows.

## Supply context where the judgment happens

Write from what the reader or executing agent can know at the point of use. A
skill's opening gives the shape of the work; a phase supplies the distinctions
needed for its judgment; a linked reference supplies detail when that detail
becomes useful. A concept introduced only in the originating conversation is
not yet available to a future reader of the skill.

Keep these levels faithful to one another. A concise workflow step can rely on
a precise contract without reproducing all its mechanics. Opening the reference
should explain how to fulfill the step, including the assumptions it depends on.
If following the reference changes what the step meant, revise the relationship.

The same standard applies to delegated tasks: give the worker the settled
decisions and relevant context needed for its part. Keep unresolved choices that
affect the whole visible to the coordinator. Specification quality determines
how much understanding execution has to reconstruct.

This is the [reader-orientation](skills/stances/reader-orientation/SKILL.md) stance
applied to skill design. Add detail or indirection when it improves the reader's
ability to act; a clear boundary can contain substantial mechanics without
bringing them all into the main path.

## Make consequential judgments easy to find

Put a consequential judgment where the agent has the context to make it. Explain
what depends on it and what evidence can support it. A clear heading, a worked
example, or a short reminder at the transition may provide the emphasis needed.

## Tensions over rules

Describe the concerns a judgment must reconcile and why each matters. A
handoff must be compact enough to use while preserving the reasons someone
needs to continue. Naming that tension helps the agent judge what can be
compressed in this particular handoff.

Keep requirements exact where their force depends on being exact. An
authorization boundary or a package path has a different job from guidance
about what deserves emphasis. Explain that job where the agent needs to act
on it.

## Stance emerges from honest description

Develop the instruction from an understanding of the work. Describing a real
tension gives the agent concerns to recognize in a new situation. Explaining
why a transition matters gives it a reason to return there when a finding
changes the account.

In the landscape metaphor, this is how the prose gives a stance its shape.
Examine what the words lead the agent to attend to. A sentence that sounds
authoritative may leave the needed relationship unexplained; a concrete
example may make it available.

## Separate execution path from reference material

During execution, the agent needs to know what to do next. Templates, triage tables, and edge case details are reference material — useful when a specific step is reached, but diluting when interleaved with the execution path.

If you could imagine looking something up in a table of contents, it's reference material. Put it after the process.

## Make the return through the work explicit

Explain which findings warrant reconsideration and where they should return.
In PER, an implementation detail can reopen the expectation that justified the
approach. In RFC work, it can change a commitment other work relies on.

Use pseudocode when a repeated sequence helps the agent keep its place:

```
repeat:
  1. Do X
  2. Do Y
  3. If condition → go to 1
  4. If done → exit
```

For a return that depends on interpreting a finding, a worked example can show
how participants recognize what needs reconsideration. Choose the form that
explains the actual recurrence.

## One concern per section

Give a section a recognizable responsibility. Arranging a delegated inquiry,
interpreting its findings, and bringing a decision to the user may warrant
separate sections when each needs its own context. Keep related judgments
together when separating them would hide the relationship that makes them
possible.

## Use language to develop contextual judgment

Natural language can describe a relationship whose application becomes more
precise in context. “Preserve enough reasoning for someone to continue” depends
on what that person will do and what they can already know. Examples help the
agent recognize what the relationship requires in a particular situation.

Use prose to develop that judgment and precise contracts for the requirements
other work must rely on. A formal specification or mechanical check can settle
some obligations, leaving the prose to explain their purpose and how they bear
on choices the check cannot make.

## Agents establish roles; workflows compose the work

An agent file establishes responsibility for a contribution and a continuing
cognitive orientation through the stances that shape it. Editorial Reader, for example, keeps the intended audience's
understanding and the author's judgment present throughout its reading.
A workflow describes how the work develops and where particular judgments
become useful.

This is also a semantic ownership boundary:

- A **stance** owns the domain-general invariant, its central tension, and the
  examples that make the relationship precise.
- A **workflow** owns the situated maneuver: its entry conditions, execution
  shape, transitions, collaboration points, output, and handoff.
- An **agent** owns the role's responsibility and its relationship to the caller
  and other participants, including the stances that should accompany its work.

The description and visibility of a resource are part of its canonical
activation intent. A runtime projection may translate that intent into a
manifest, directory layout, or discovery index, but should not silently change
when the resource applies or whether it is user-facing.

Runtime projections may also resolve abstract model and tool roles, translate
hook envelopes, or omit capabilities the host does not support. Keep those
adaptations mechanical and visible. If a target needs different semantics,
make that difference an explicit variant rather than letting generated output
become a second authority.

Some restatement is useful. A short stance handle inside a skill can keep the
right well active, and an agent may embody the same relational structure in
its own voice. The test is whether the restatement reinforces the canonical
invariant or establishes a definition that could drift independently.

When an agent uses a workflow, the workflow owns its supporting stance links
and investigation or execution mechanics. The agent loads that workflow and
establishes the role's identity and responsibility to its caller and workers.
Ask: when we improve the workflow's method, should the agent file need a
matching edit? Usually it should not. A change to the delegated role's
responsibility should change the agent. Short restatements can make that role
vivid while leaving the method's decisions with the workflow.

## Descriptions help the agent choose

The description may be all an agent sees before deciding to read a resource.
Name a recognizable situation and the contribution the resource can make there.
Compare nearby descriptions to see whether their different purposes are clear.
Joint Reading concerns understanding shared material together. Walkthrough
organizes that reading into chunks with pauses for discussion.

Read each description against its body. A description that promises reciprocal
collaboration needs a body that leaves both participants room to contribute.
Revise the underlying account when it fails that comparison, then describe what
the resource actually offers.

Activation metadata and composition links express availability and delivery
intent. A phrase such as “background guidance” does not preload a resource.
Keep those mechanics in the [runtime projection contract](docs/runtime-projection-contract.md),
and use the description to help the agent recognize relevance.

## Link the judgment where it arises

In operational prose, describe what the agent needs to attend to and link that
phrase to its supporting stance. For example:

```markdown
When a finding changes your understanding of the problem,
[revisit earlier comments whose meaning depended on that explanation](../../stances/interpretive-synthesis/SKILL.md "composition:load").
```

The sentence should guide the work before the reader follows the link. The
stance gives that judgment depth across situations. Preserve the conditions
that make it relevant, and let the link label express its particular role here.
Named stance references remain useful when comparing concepts or describing
their relationships.

The composition marker records the intended relationship for validation and
projection. Loading the linked body still depends on the executing agent and
its available tools. Check that behavior separately from the quality of the
prose and the validity of the packaged path.

## Describe the work affirmatively

A list of prohibited mistakes can leave the agent without an account of what
good work requires. Describe the relationships it should preserve, the evidence
it should examine, and what a useful contribution makes possible.
Use an explicit warning where a consequential boundary could otherwise be
mistaken. Permission to edit a patch, for example, does not itself authorize
posting a reply on the user's behalf. Explain the distinction where the agent
needs to act on it.

## Keep language inside the work

Conversation history becomes working material. A good formulation takes its shape from the work underway, so later continuation remains attached to the situation that produced it.

Two short reminders carry this stance in conversation. "Let's focus on what we're doing" restores attention to the active work. "Let's use precise and meaningful language" restores wording to what the work can actually support.

## Review what the prose contributes

Read a sentence from the context its reader has at that point. Ask what it adds
and whether that addition is needed. When two clauses have been paired without
explaining their relationship, work out how one bears on the other. That may
require an explanation, further investigation, or removing a clause that adds
nothing. Punctuation can reveal a habitual construction, but changing punctuation
alone leaves its reasoning intact.

Bring consequential findings back to the author or participants who can help
examine them. A review can change the account the document should give, as well
as how clearly it gives that account.

## Write for the agent's attention

Put the mental model and consequential responsibilities early so the agent
encounters them before acting. Place supporting reference material where it
can be consulted when needed. At a transition, supply the context for a
judgment that could otherwise disappear into a long account of the process.

Check what the executing host actually delivers. A linked stance body, a
resource's discovery description, and its full text can reach the agent at
different times. Order alone cannot supply material that was never loaded.

## Triangulate stances with cross-domain examples

Choose examples from different domains that make the shared relationship
recognizable. Three or four often give enough variation to expose an
incidental feature the examples otherwise have in common. Add or change an
example when it helps distinguish the intended relationship from that feature.
A framing sentence can explain what varies and what remains shared.

Preserve that variation when revising examples, including compact examples in
an agent's role description. Different professions alone may leave the same
incidental assumptions in place; show differences in evidence, relationships,
or opportunities to act while keeping the intended structure shared. If the
examples feel repetitive, examine which distinctions the wording has lost
before collapsing them into one.

## Collaboration over inference for situated decisions

Some judgments depend on the user's experience: their priorities, energy,
intent, or sense of what has momentum. Work from what they have already shared.
Bring a consequential uncertainty into the conversation with observations and
a recommendation they can examine.

Their response can change the agent's understanding of the situation and the
question worth pursuing. Preserve that contribution in the work that follows.
A skill should make room for this exchange where the user's judgment could
change the direction.

## The information landscape

These four categories help distinguish what the agent can investigate from
what needs another participant's contribution. Establish which applies to the
information needed for the current judgment.

**Agent-only perception** — information the agent can investigate through tools
that the user does not typically examine: terminal output details, log contents,
file system structure. Use those sources directly and bring consequential
observations into the conversation. Compare what a judgment needs with what the
tools expose to identify gaps neither participant may have noticed.

**Shared perception** — information both participants can examine, such as a
code passage, diagnostic, or visible error. Check what the available tools
actually expose before treating a detail as shared. A common reference lets
the user confirm an observation or question its interpretation.

**Unshared environmental** — information that exists but is outside the
agent's current observation. A judgment about an error visible only to the
user needs that observation. Look for a tool that can reach it, or ask for the
particular detail the judgment depends on. Keep the missing observation
recognizable as a gap until it is supplied.

**Inherently situated** — the user's experience and judgment, including
priorities, energy, timing, and flow state. Earlier exchanges can help the
agent reason from it; the user can correct or develop that understanding.
Ask where the remaining uncertainty could change the work.

### Diagnosing skill failures with the information landscape

When a skill isn't working well:

- Is the agent inferring something it should be observing? → tool gap, or the agent isn't using available tools
- Is the agent inferring something it should be asking about? → collaboration gap in the skill
- Is the agent asking about something it could observe? → wasting the collaboration budget
- Are questions frustrating the user? → examine whether they ask for observable
  facts, repeat an answer, or leave the framing work to the user

### The collaboration budget

Questions cost attention. Investigate what the available evidence can settle
and make the remaining uncertainty concrete enough for the user to contribute.
When an environmental fact is inaccessible, a focused question can be the
right way to proceed. Better observation reduces that need and leaves more
attention for decisions that depend on the user's experience.

The user's answer may reveal an unexpected possibility worth developing.
Respecting their attention includes giving that possibility room when it
could change what the work is for.
