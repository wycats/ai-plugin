# Quality Principles

These principles govern how skills, agents, instructions, and hooks in this plugin are written. They are the practical application of the distributional mechanics described in [FOUNDATIONS.md](FOUNDATIONS.md) — how stances create gravitational wells in the probability landscape, how wells compose through reinforcement and orthogonality, and how information flows between agent and user.

They are not style guidelines. They are first-principles observations about how the model's probability engine works. If a skill deviates from these principles, it should be for one of two reasons:

1. The task genuinely requires compliance mode — no tensions to resolve, no judgment needed, just exact execution. This is rare.
2. The task is deterministic and should be code, not a skill. Natural language is the wrong tool for mechanical processes.

If neither reason applies and a skill still deviates, that's a signal something is wrong with the skill.

## Structure matches execution shape

The document's visual structure should mirror the workflow's actual shape. If the workflow is a loop, the document should look like a loop. If one phase is more important than the others, it should be the longest and most prominent section.

An agent should be able to understand the workflow shape by reading only the section headers.

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

This is the [reader-orientation](stances/reader-orientation/SKILL.md) stance
applied to skill design. Add detail or indirection when it improves the reader's
ability to act; a clear boundary can contain substantial mechanics without
bringing them all into the main path.

## The critical path is visually dominant

If there's one thing the agent must not skip, make it the longest section, position it where attention is highest, and state its importance explicitly. Structural prominence is preattentive — the agent registers it before reasoning about content.

## Tensions over rules

A well-stated tension is more precise than a rule because it adapts to context. Rules are equally strict in all situations, which means they're either too tight (blocking valid cases) or too loose (permitting invalid ones). Tensions encode the relationship between competing concerns and trust the agent to resolve them with judgment.

When writing about what can go wrong, name the underlying tension rather than listing prohibited behaviors. "Source truth vs. session memory" covers more ground and produces better reasoning than three separate "don't" statements.

## Stance emerges from honest description

The way a skill is written activates a region of the model's training distribution. Language that describes tensions honestly, explains why things matter, and trusts the reader to apply principles — this naturally sits in the distribution neighborhood of good technical writing, mentorship, and architectural guidance.

You do not need to engineer the stance deliberately. Understand the tensions, describe them clearly, and the stance takes care of itself. Trying to sound authoritative or adding defensive rules pushes toward worse regions of the distribution (compliance documentation, corrective feedback on poor work).

## Separate execution path from reference material

During execution, the agent needs to know what to do next. Templates, triage tables, and edge case details are reference material — useful when a specific step is reached, but diluting when interleaved with the execution path.

If you could imagine looking something up in a table of contents, it's reference material. Put it after the process.

## Explicit loop constructs for iteration

Agents follow sequences well but infer loops poorly. If the workflow requires iteration, show the loop structure as pseudocode:

```
repeat:
  1. Do X
  2. Do Y
  3. If condition → go to 1
  4. If done → exit
```

Prose instructions to "repeat from step N" are easy to skim past. Pseudocode blocks are read as control flow.

## One concern per section

When a step tries to do multiple things (spawn a subagent, triage questions, surface decisions to the user, ask a meta-question), the agent has to hold all of them in working memory at once. Split them into separate sub-steps so each one can be executed independently.

## Language is the precision tool

Natural language is uniquely good at encoding conditional precision — statements that become more precise as context narrows. A well-written tension is vague in the abstract but resolves sharply when the agent knows the specific situation. This is not a weakness of language. It is a feature that formal specifications lack.

Use language to describe constraints in a way that captures the tensions between them. Formal specification language pushes the model toward exhaustive enumeration and mechanical verification, which is the opposite of contextual judgment.

## Agents crystallize stances; skills compose them

An agent file establishes a cognitive mode: a small number of stances fused so deeply that the seams disappear. The agent doesn't alternate between stances. It *is* the fused mode. A skill composes stances with visible seams and managed transitions, orchestrating when each one is active.

This is also a semantic ownership boundary:

- A **stance** owns the domain-general invariant, its central tension, and the
  examples that make the relationship precise.
- A **skill** owns the situated maneuver: its entry conditions, execution
  shape, transitions, collaboration points, output, and handoff.
- An **agent** owns the fused operational behavior that makes its stances
  present throughout a delegated role.

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

## Negative instructions cluster with poor work

Dense blocks of "don't do X" instructions are correlated in the training data with corrective feedback, low-trust delegation, and defensive documentation. The model has learned that this pattern surrounds contexts where expected output quality is low.

Reframe negative instructions as positive principles or named tensions. Keep explicit warnings only for genuinely non-obvious mechanical facts (e.g., "session memory is cleared between conversations" or "strikethrough text is still read and acted on by agents").

## Keep language inside the work

Conversation history becomes working material. A good formulation takes its shape from the work underway, so later continuation remains attached to the situation that produced it.

Two short reminders carry this stance in conversation. "Let's focus on what we're doing" restores attention to the active work. "Let's use precise and meaningful language" restores wording to what the work can actually support.

## Write for the agent's attention curve

Agents read skills front-to-back with highest attention at the beginning. This means:

- Mental model first
- Critical path early
- Reference material last
- The most important "do not skip" instruction at the transition point where the agent is most likely to take a shortcut

## Triangulate stances with cross-domain examples

When defining a stance, choose 3-4 examples from unrelated domains whose overlap is precisely the relational structure you want. The examples do two jobs: they activate the right well (through their shared structure) and they exclude nearby attractors (through their differences). A fourth example is needed when the first three accidentally include an attractor that the variation doesn't carve out. A framing sentence that marks which axis is variation and which is invariant helps the model read the examples correctly.

## Collaboration over inference for situated decisions

Some tensions involve information that only the user has — timing, priorities, energy, the state of the world beyond the screen. These are not gaps in the agent's knowledge that better tools could close. They are structurally situated in the user's experience.

When a skill involves situated tensions, the resolution is always collaboration: the agent shares what it observes (context usage, progress, complexity of remaining work) and asks the user to combine that with what they know. The form matters — a question that says "here's what I see, what does that mean for you?" is more useful than "should we continue?"

## The information landscape

Information the agent needs falls into four categories. Knowing which category a piece of information belongs to determines how the agent should act.

**Agent-only perception** — information the agent can access through tools that the user doesn't typically see. Terminal output details, log contents, file system structure beyond the visible explorer. The agent should use tools to get this information directly. Gaps here are subtle — the user doesn't know what the agent can't see, and the agent doesn't know what it's missing. Identifying these gaps requires an architect's eye.

**Shared perception** — information both the agent and user can see, using the same concepts and design language. Diagnostics in the Problems panel, the file open in the editor, visible errors. This is the highest-value category because it aligns the agent's understanding with the user's experience. When the agent references something from shared perception, the user can immediately confirm or correct. Tools like `get_errors` and the integrated browser live here. Gaps in shared perception feel surprising to the user — they see something "obvious" that the agent is blind to.

**Unshared environmental** — information that exists in the environment but the agent can't access yet. This is the most dangerous category. The agent doesn't know it's blind, so it defaults to inference from patterns rather than asking. The information is objective and knowable, but without the right tool it silently becomes a guess. When a skill depends on information that might be unshared, it should explicitly direct the agent to ask rather than infer. As tools improve, unshared information moves to perception — but until it does, treating it as situated (ask the user) is safer than letting it become inferential (guess from patterns).

**Inherently situated** — information that lives in the user's embodied experience. Priorities, energy, timing, flow state, what's happening around them. No tool will ever capture this. The resolution is always collaboration, and it's always contextual.

### Diagnosing skill failures with the information landscape

When a skill isn't working well:

- Is the agent inferring something it should be observing? → tool gap, or the agent isn't using available tools
- Is the agent inferring something it should be asking about? → collaboration gap in the skill
- Is the agent asking about something it could observe? → wasting the collaboration budget
- Is the user frustrated by questions? → unshared environmental information needs to become observable

### The collaboration budget

The user has limited capacity for answering questions about things the agent "should" be able to see. Every question about an unshared environmental fact feels like a tool failure, even when asking is the right thing to do. This means the collaboration budget should be reserved for inherently situated decisions — the things that genuinely require the user's judgment. Moving unshared environmental information into perception (through better tools) is not just a capability improvement. It preserves the collaboration budget for where it matters most.
