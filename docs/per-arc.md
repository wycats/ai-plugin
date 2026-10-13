# PER Arc

A PER arc is the continuity layer around repeated PER cycles inside an already
selected current bet. The cycle separates prediction, action, and evaluation
for a bounded piece of work. The arc preserves the bet's relationship to
project vision so each new cycle can start situated without reopening project
selection.

The dashboard is the instrument panel for that arc. It tells the agent and the
user which experienced outcome the bet serves, what evidence has accumulated,
where reality diverged from the working model, which immediate gate has
momentum, and what signal will return the project to vision steering.

The tension to navigate is **purpose-attached continuity vs. ceremony**. The
dashboard earns its keep when it carries the smallest accurate project
orientation through real work. A dashboard that expands into a task tracker
steals momentum; a dashboard that omits the current bet leaves later cycles to
reconstruct or silently replace project purpose.

## Related context

This note sits between the repo's foundational theory and its executable workflow skills:

- [FOUNDATIONS.md](../FOUNDATIONS.md) explains the underlying mechanics: stances, generation vs. evaluation, and the boundary between observable state and situated judgment.
- [QUALITY.md](../QUALITY.md) turns those mechanics into principles for writing skills and agents without drifting into checklist ceremony.
- [skills/steer-by-vision/SKILL.md](../skills/workflows/steer-by-vision/SKILL.md) selects the current bet and names the evidence that will reopen project selection.
- [skills/per-cycle/SKILL.md](../skills/workflows/per-cycle/SKILL.md) defines the local `prepare → execute → review` loop that a PER arc surrounds.
- [skills/session-save/SKILL.md](../skills/workflows/session-save/SKILL.md), [skills/session-rest/SKILL.md](../skills/workflows/session-rest/SKILL.md), [skills/session-close/SKILL.md](../skills/workflows/session-close/SKILL.md), and [skills/session-load/SKILL.md](../skills/workflows/session-load/SKILL.md) preserve continuity across session boundaries; the PER arc preserves continuity across project cycles.

## What a PER arc is

A PER arc is the bet-level trajectory that emerges across one or more
`prepare → execute → review` cycles.

It holds the material that is too large for a single cycle handoff but too active to become permanent documentation:

- the source of the current project orientation
- the vision, experienced outcome, and current bet
- the organic proof, immediate gate, and next steering signal
- the hypotheses that are guiding the next move
- the evidence that has accumulated from execution and review
- the divergences that changed the model
- the tensions that still shape the route inside the bet
- valuable arcs kept warm with the signals that would return them to selection

The arc is the memory of what review taught the current bet, not another phase
after review. A single PER cycle asks, "Did this experiment match the
hypothesis?" The arc asks, "What did recent experiments teach us about this
bet, and has its next steering signal arrived?"

## What the dashboard preserves

The dashboard preserves purpose-attached continuity, not session reconstruction.

It should be enough for a future agent to feel the project's current motion without replaying the whole conversation. That means preserving the forces still acting on the work rather than every detail that produced them.

What belongs there:

- the recorded source of project orientation
- Vision and Experienced outcome
- Current bet, Organic proof, Immediate gate, and Next steering signal
- observable repo state when it matters: files changed, tests run, build status, known tool output
- the working hypothesis for the current move
- evidence gathered by execution or review
- divergences between expectation and reality
- live tensions where the route inside the bet depends on judgment
- kept-warm arcs and the return signal for each one

The information boundary matters. Repo and tool state should be observed and
used as evidence about the route. Project purpose comes from explicit user
steering or the recorded canonical source. Priorities, momentum, taste, and
timing remain situated in the user and need collaborative grounding when they
would change the experienced outcome. The dashboard makes that boundary
visible instead of letting live artifacts become an implicit purpose change.

## Relationship to `/per-cycle`

`/per-cycle` is the local experiment loop:

1. prepare forms a hypothesis
2. execute tests it against reality
3. review evaluates the distance between prediction and result

The PER arc is the continuity layer around that loop. It carries forward the
same steering context and what the loop learned so the next cycle begins with a
calibrated model of the current bet.

This preserves the generation/evaluation separation that makes PER useful:

- hypotheses and the next good move inside the current bet stay on the
  generative side
- evidence, test results, and divergences stay on the evaluative side
- live tensions mark places where neither side is enough without the user's situated judgment

The dashboard keeps these categories distinct. A hypothesis is not evidence. A
divergence is not automatically a problem. Implementation validation does not
establish Organic proof unless that validation experience is itself the
experienced outcome. Review records whether the cycle produced the current
bet's Organic proof, strengthened or qualified a necessary path toward that
proof, or left that proof pending, and whether the next steering signal was
reached.

While the bet remains active, a local divergence changes its implementation
route or immediate gate. When the named signal arrives, relationship-breaking
evidence appears, or the user revises project purpose, the arc returns its
evidence to `/steer-by-vision` rather than choosing the next project move.

## The shortest honest evidence path

Acceptance work stays attached to the current bet by choosing the smallest
experiment that can honestly support its claim. The observation path is part of
the hypothesis: the arc records not only what capability should become visible,
but also how the experiment will reach and observe it.

The tension is **evidence sufficiency vs. path expansion**. An observation path
often depends on a launcher, environment, account, fixture, or service. Each
dependency can invite broader qualification work. Qualify only the substrate
properties on which the claim depends, and make each necessary qualification a
bounded experiment. The qualifying work stays in service of the capability
claim rather than expanding into a general substrate-readiness project.

Within the Immediate gate, name the next effect boundary before crossing it. A
launch, mutation, spend, or external communication changes what the experiment
can affect and what its result can establish. Crossing one boundary at a time
keeps the evidence attributable to a specific attempt and makes retry semantics
explicit at the point where they matter.

The arc carries attempt disposition for every result and, when evidence exists,
its evidence layer. It keeps the dimensions separate:

- **Evidence layer:** capability, substrate, or both.
- **Attempt disposition:** effect boundary crossed, or precondition miss before
  the boundary.

**Capability evidence** directly bears on the claimed behavior. **Substrate
evidence** qualifies a dependency of the observation path. A **precondition
miss** means the required effect boundary was not crossed. It provides no
capability evidence but may provide substrate evidence.

When the substrate repeatedly diverges from the hypothesis, that divergence
becomes its own bounded qualification cycle. Once the dependency is qualified,
the arc returns to the capability experiment with a shorter, better-grounded
observation path.

## Relationship to session lifecycle skills

The session lifecycle skills preserve context across time. The PER arc preserves
current-bet motion across cycles. They overlap, but they answer different
questions.

`/session-save` keeps trajectory warm during ongoing work. A PER dashboard gives
it a compact projection of the current bet, proof, gate, signal, and kept-warm
arcs while the recorded orientation source remains authoritative for purpose.

`/session-rest` prepares a next session while the user is still a light bridge.
The dashboard reduces reconstruction cost by making the active bet and its
evidence visible. Rest interprets the session inside that bet unless its signal
arrived or the user reorients the project.

`/session-close` prepares for a colder restart. The dashboard anchors the close:
which bet was active, what evidence accumulated, which divergences mattered,
and which immediate gate should survive the gap.

`/session-load` restores momentum by resuming the immediate gate when the bet
remains active. It invokes `/steer-by-vision` when no bet exists, the named
signal has arrived, or project purpose has been explicitly revised.

This also explains why full save/restore can feel less central with stronger models. Heavyweight reconstruction is less necessary when the model can recover more from repo context and conversation. But situated continuity still matters: what has momentum, what feels tasteful, what the user considers live, and what kind of next move would preserve flow.

## Minimal candidate dashboard shape

The shape should be small enough to maintain during real work. A candidate dashboard could be one markdown file with these sections. Use only the sections that are carrying signal; empty sections should be omitted rather than maintained ceremonially.

### Project orientation

The recorded source, Vision, and Experienced outcome. This is the durable
purpose boundary the dashboard projects rather than recreates.

### Current bet

The selected evidence-bearing route, its Organic proof, and its Immediate gate.
Name how this bet is expected to produce the experienced outcome.

### Current phase / position

Where the work is in relation to PER: preparing a hypothesis, executing a bounded move, reviewing a result, or between cycles carrying forward what was learned.

### Hypothesis / current move

The active prediction or intended move. This is generative material: what the agent currently thinks is worth trying next, specific enough that reality can correct it.

### Evidence

Observable facts gathered so far: files inspected, commands run, test results,
review findings, or concrete behavior seen in ordinary use. Preserve both
evidence layer and attempt disposition when they matter, and record
implementation validation separately from Organic proof.

### Divergences

Where reality did not match the working model. These are calibration signals, not blame. Some divergences change the next move; others simply improve the map.

### Live tensions

Judgment-bearing questions still shaping the route inside the current bet.
Purpose-level tensions belong at the vision-steering boundary.

### Next good move

The next bounded action through the Immediate gate. It preserves momentum inside
the current bet rather than selecting among project-sized alternatives.

### Next steering signal

The evidence, divergence, stall, or milestone that returns selection to
`/steer-by-vision`.

### Kept-warm arcs

Valuable project continuations that remain visible without competing with the
current bet. Each one carries the signal that would return it to selection.

### Cycle log

A compact record of completed cycles: date or rough sequence, prepare hypothesis, execute result, review calibration, and any arc update that followed.

## Keeping the dashboard current

The dashboard is a rolling calibration artifact, not an accumulating narrative. Its live sections should read like current instruments, not a transcript of prior flights.

Update **Current phase / position**, **Evidence**, and **Next good move** at
natural boundaries: after review, after merge, before starting a new cycle, or
when a divergence changes the route. Refresh **Project orientation** and
**Current bet** when `/steer-by-vision` produces a new selection.

When the Next steering signal arrives, record the evidence and hand it to
`/steer-by-vision`. The dashboard waits for that selection instead of promoting
one of its own alternatives. Once the new bet is selected, refresh the live
sections and keep only the evidence that still shapes its route.

Completed cycles should be compressed once they stop shaping the next move.
Keep the cycle log as evidence of calibration, not as a place to preserve every
detail.

The useful question when editing the dashboard is: what does the next agent need
to know to move with the current bet? If a detail no longer changes the next
move, it can be summarized or dropped.

## Non-goals

The dashboard is not a task tracker. A task tracker optimizes for inventory and assignment. The PER arc optimizes for continuity of understanding.

It is not full session reconstruction. It should not preserve every conversation turn, decision path, or intermediate thought. If a future agent needs to replay the session to understand the project, the dashboard failed by preserving too much of the wrong thing and too little of the arc.

It is not a mandatory ritual. Some work does not need it. Some cycles are too small to justify updating it. The dashboard earns its keep only when it reduces reconstruction cost or improves calibration across cycles.

It is not a project-selection surface. Vision steering supplies the current bet;
the dashboard keeps execution and evidence attached to it.

It is not a gatekeeping protocol. Work does not wait for dashboard ceremony. The
dashboard is useful when it helps the agent read the instruments before moving.

## Reference-note boundary

PER arc remains a lightweight reference note. `/steer-by-vision`, `/per-cycle`,
and the session lifecycle skills own the executable transitions; this note gives
their shared continuity surface a coherent shape without introducing a new
`/per-arc` workflow.
