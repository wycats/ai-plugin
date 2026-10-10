---
name: rfc-writing
description: "Use when drafting, revising, reviewing, or promoting RFCs and design proposals, including Exo-managed RFCs, staged RFC lifecycle work, Rust/Ember-style RFC prose, and canonization or recommendation work for related RFCs."
---

# RFC Writing

An RFC is durable public design reasoning. It makes a change understandable to
users, implementers, maintainers, educators, and future readers, and it keeps
the stage of the work visible as the design moves from idea to implemented
reality.

**Stances used:** Load **public-design-reasoning** for the prose, **collaborative-grounding**
and **socratic-elicitation** for the user's situated design intent,
**interpretive-synthesis** for the coherent account, **hypothesis-evaluating**
for stage readiness, and **relational-continuity** for precise and meaningful
language that stays attached to the work underway.

## Core stance

The tension is public argument vs. implementation memory.

Recent context often contains branch state, debugging notes, design fragments,
and half-formed decisions. An RFC turns that material into a public artifact.
Write from the design the project is trying to make true, grounded in observed
state and explicit evidence. Preserve tradeoffs, alternatives, and unresolved
questions because they help future readers understand the decision, not because
the template has empty boxes.

Template sections are reader contracts. Motivation helps readers understand why
the change is worth considering. Detailed design makes the change buildable.
Drawbacks make the tradeoff honest. Alternatives make the choice legible.
Unresolved questions show where learning remains. Let each section do its
reader-facing job in the current RFC.

## Exo-first workflow

When the repository is Exo-managed, treat Exo as the RFC source of truth.
Exo owns RFC identity, lifecycle state, current stage, related goals and tasks,
managed content, implementation evidence, and stage-transition readiness.

Discover the current RFC operations from the available Exo tool surface or the
workspace's Exo documentation before reading or changing RFC state. Then use
that managed surface to read lifecycle state, inspect the RFC artifact, update
managed content, and request stage transitions. The plugin supplies the
authoring stance and readiness judgment; Exo supplies the live operation
contract.

Request a stage transition only when the user explicitly asks for it or
confirms it after seeing the readiness evidence.

If Exo is unavailable, follow the repository's local RFC process and template.
Inspect the local README, template, or prior accepted RFCs before choosing
headings or format, and mark Exo-derived state as unavailable instead of
reconstructing it from memory.

## Stage-aware writing

Match the prose to the lifecycle stage. Stage names vary by project; use the
local process names and preserve these jobs.

**Stage 0: Idea.** Capture the live problem, affected audience, possible shape,
and questions that determine whether the idea should receive more design
attention. Keep the artifact light enough for exploration while making the
problem concrete.

**Stage 1: Proposal.** Make the public case for doing the work. Explain the
motivation, user and maintainer impact, design direction, drawbacks,
alternatives, and the questions that must be resolved before acceptance.

**Stage 2: Draft.** Make the design implementation-ready. Specify the system
contract, user-facing behavior, compatibility surface, migration path, testing
shape, and clear criteria for reaching implemented reality.

**Stage 3: Candidate.** Reconcile the RFC with what was built. Read code,
tests, docs, release notes, and Exo state before editing. The document should
reflect implemented reality, including meaningful deviations from the draft and
the evidence that supports readiness.

**Stage 4: Stable.** Align the RFC with shipped behavior and the living manual.
Check that docs, tests, and current project behavior tell one coherent story,
and that the RFC corpus remains mutually consistent.

## Canonization mode

Use canonization mode when a set of Stage 3 or Stage 4 RFCs together defines a
recommended idiom, product feature, or project practice.

Synthesize the group as a corpus, not a pile of individual decisions. Identify
the user-facing concept the RFCs now teach together, the implementation and
tooling support that makes the idiom practical, the learning path that should
appear in docs, and the migration or ecosystem state that makes broad use
reasonable.

The output may be a recommendation section, a canonization note, a docs/manual
update plan, or an RFC revision plan. In each case, make the recommendation
rest on current evidence: shipped behavior, docs, tests, tooling, migration
support, and consistency across the related RFCs.

## Writing loop

Use a generate-then-evaluate loop so prose quality and readiness judgment do
not collapse into each other.

```text
repeat:
  1. Observe the local process, stage, templates, existing RFCs, and evidence.
  2. Ground the user's design intent and any situated audience concerns.
  3. Draft or revise the RFC section by section according to each section's job.
  4. Evaluate stage readiness against the evidence and local process.
  5. Carry forward the concrete gaps, decisions, and next authoring work.
```

Ask the user for situated decisions: intent, priority, acceptable tradeoffs,
audience, and whether to request a stage transition. Use tools for observable
facts: RFC state, implementation status, tests, docs, git history, and local
templates.

## Exo design pressure

Exo currently models RFC Stages 0-4, with Stage 4 serving as the living canon.
Treat Stage 5-style "Recommended" work as canonization mode in this skill:
grouped, corpus-level work that may later deserve first-class Exo support.

Useful future Exo surfaces include recommendation groups, canonization checks,
stage-specific authoring prompts, and manual/docs coherence checks. When the
skill reveals one of those needs during real RFC work, name the Exo improvement
as design pressure rather than mixing tool-design proposals into the RFC body.
