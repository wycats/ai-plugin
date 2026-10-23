---
name: rfc-writing
description: Use when developing or revising an RFC or design proposal,
  assessing its readiness for a decision, or reconciling it with implementation
  and experience. Carry the design's reasoning and commitments through the work.
metadata:
  wycats.kind: workflow
  wycats.user-invocable: "true"
  wycats.invocation: contextual
---

# RFC Writing

An RFC carries a design's reasoning and commitments across the work that
shapes it. Readers need to understand the proposed change, why it is worth
making, and what they can already rely on. As implementation and use reveal
more, revise the account so it remains useful for the decisions ahead.

[Write for people who will encounter the design without this conversation](../../stances/public-design-reasoning/SKILL.md "composition:load context=activity").
As discoveries change your understanding,
[reconsider what earlier evidence and decisions now mean](../../stances/interpretive-synthesis/SKILL.md "composition:load").

## Find the decision the document needs to support

Read the proposal, its discussion, and the project's process. Establish what
has been agreed, what remains open, and who will use the next revision to make
a decision. An exploratory proposal may need a concrete example before anyone
can judge its direction. An accepted design may need an account of what
implementation revealed before maintainers can judge release readiness.

Look for the project's RFC README and template, and read a recently accepted
proposal. Use them to understand what its stages mean, what reviewers expect,
and who approves advancement. Follow that process when shaping the document
and proposing its next step.

If the project has no staged process, describe the decision and its basis in
ordinary language. Agree with the user before introducing formal stages.
When the design depends on their priorities or experience,
[develop that part of the account with them](../../stances/collaborative-grounding/SKILL.md "composition:load"). A passage or example
can give them something specific to correct or develop.

## Match the work to what remains uncertain

A stage tells participants what has been agreed and what still needs to be
learned. The activity alone does not establish the stage: a prototype can help
choose a direction long before anyone commits to supporting it.

These decisions recur in staged processes. Use them to interpret the project's
requirements and choose useful work.

**Is the problem worth pursuing?** Show who encounters it, what they are trying
to do, and where current approaches fall short. Explore enough alternatives to
make the choice meaningful. A sketch or small experiment may reveal that the
problem needs to be framed differently.

**Can we commit to this direction?** Explain the proposed behavior and the
tradeoffs behind it. Make the remaining questions explicit enough that people
can judge whether to begin implementation. Distinguish details implementation
can settle from uncertainties that could overturn the direction.

**Can we support what was built?** Compare the implementation with the design,
including compatibility and the material people need to use it. Establish
which interfaces and behaviors the project is prepared to support. Use its
release criteria to determine what evidence is still needed.

**Has it reached users?** Verify where the change is available and to whom.
Record the relevant release, deployment, or publication. This gives later
reports of use a concrete version to refer to.

**Should people adopt it?** Examine experience with the feature and the support
around it. A feature may be available while migration, tooling, or related
features still make adoption difficult. When several RFCs contribute to one
practice, evaluate whether people can use and learn that practice as a whole.

As the design develops, identify questions that another prose revision cannot
settle. Use [PER](../per-cycle/SKILL.md "composition:reference")
to organize implementation or an experiment around those questions. PER develops
and tests understanding through a particular episode of work. The RFC preserves
what that episode changes about the design and its commitments.

## Write the design people need to understand

Build the account around the behavior someone should be able to understand,
use, and implement. Show it in examples before requiring the reader to follow
its machinery. Explain alternatives where they clarify why this design was
chosen, and drawbacks where they expose a cost the project is accepting.

Use each template section for the question it helps readers answer. When a
section has little to contribute, keep it brief. Put investigation logs and
execution details in supporting records, with links where they substantiate a
claim or preserve an unresolved question.

After drafting, read from the position of someone encountering the proposal
for the first time. Can they see why the change matters and how it would work?
Where a sentence adds another claim, decide whether the reader needs it there.
Explain the relationship when it matters, and remove the claim when it adds
nothing to the decision.

## Return discoveries to the design

When implementation or use changes your understanding, identify which
assumptions deserve another look. Share the evidence with people who can help
interpret it, including those whose work relies on the decision. The exchange may change what the
observation means before it changes the design.

For example, a proposal gives an investigator tools to delegate work. A trial
reveals that its workers also need to initiate conversations, although they
should remain unable to create agents. The design now needs to distinguish
communication from delegation. That finding changes both the capability model
and what must be checked in older configurations.

Trace the consequences through the proposal. Revise the behavior, examples, and
rationale that depended on the earlier assumption. Preserve a brief account of
why an agreed decision changed, following the project's amendment practice.
For a change to commitments others rely on, bring the affected decision back
to the people authorized to make it. Keep the existing commitment visible while
its replacement is being considered.

```text
when a finding calls the design into question:
  examine it with the relevant evidence and participants
  identify which assumptions and commitments it affects
  develop the revision and seek any required decision
  check the affected work and update the design account
```

## Bring the next decision with its evidence

[Assess what the work establishes against its expectations](../../stances/hypothesis-evaluating/SKILL.md "composition:load"). A successful build supports different
claims from observed use. Explain which requirements for the next stage are
satisfied and which remain open, with evidence appropriate to those claims.
Request a stage transition when the user has explicitly asked for it or has
confirmed it after seeing the readiness evidence. Follow the project's review
and approval process for the transition itself.

As implementation becomes available, connect the RFC to the documentation that
teaches its use. Keep the rationale and consequential revisions available to
future readers while directing everyday usage questions to the maintained
documentation.
