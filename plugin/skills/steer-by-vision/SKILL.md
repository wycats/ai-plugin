---
name: steer-by-vision
description: "Reorient a project by recovering its durable thesis and experienced outcome, reading live plans/tasks/PRs/substrate as candidate bets, and selecting one smallest meaningful end-to-end move with organic proof. Use when the user asks to steer or prioritize by vision, several technically valid gates compete without an active bet, an active bet's named steering signal has arrived, a closed milestone leaves no current bet, the user revises project purpose or outcome, or useful local work has lost its relationship to the project experience."
---

# Steer by Vision

Reorient the project from durable purpose to one evidence-bearing bet.

Project vision is the selection function over locally valid work. Plans, tasks,
pull requests, and infrastructure are hypotheses about how to advance it. This
workflow is **vision-first** when choosing the bet and **vision-steered** when
evidence changes the route.

**Stance composition:** Load **vision-steering** throughout. Compose
**interpretive-synthesis** while recovering the project thesis,
**gap-reading** while keeping longer arcs warm, **collaborative-grounding** only
when purpose or outcome is high-variance, and **relational-continuity** for the
handoff.

The core tension is **durable purpose vs. evidence-sensitive route**. Hold the
experienced outcome steady enough to choose work. Let execution, review, and
ordinary use revise how the project reaches it.

## Critical path

### 1. Recover the project thesis

Inspect the live project before selecting from it: current docs, active work,
recent milestones, user-visible behavior, and the evidence that changed the
last route. Reconstruct a compact thesis for what the project is for and name
the experienced outcome that would make that thesis real.

On the first steering pass, begin from the user's stated goal and visible
project state. Prior-route evidence becomes part of later steering passes.

Make the interpretation visible. When the user's prior steering already makes
the purpose clear, proceed from it. When two materially different purposes or
outcomes remain plausible, present the evidence and your best reading, then ask
one high-variance question and stop at the selection boundary. Resume with the
user's answer before translating live work into candidate bets. Product purpose
is situated judgment; workspace inventory becomes evidence within that
judgment.

### 2. Translate live work into candidate bets

Group related plans, tasks, PRs, and infrastructure work into a few coherent
continuations. Read each one as:

**slice → capability → experienced change → proof**

- **Slice:** the bounded work that could move now.
- **Capability:** what becomes possible when it lands.
- **Experienced change:** the change carried into the steering context as the
  **Experienced outcome** — what becomes meaningfully different for a user or
  maintainer.
- **Proof:** evidence that appears through ordinary use of that change.

This translation distinguishes an end-to-end bet from a locally complete
artifact. Organic proof comes from the project being used in the way the bet is
meant to improve: a real workflow becomes easier, a release closes cleanly,
reclamation becomes useful, or direct feedback changes the next harness move.

### 3. Select the smallest meaningful end-to-end bet

Recommend one current bet that crosses the chain far enough to create an
experienced change and produce organic proof. “Smallest” describes the shortest
route to meaningful evidence; that route may cross several files or open tasks.

Explain why this bet should receive momentum now: it may unlock ordinary use,
convert finished substrate into experience, exploit current feedback, or close
a project-sized loop. Preserve valuable longer arcs as **kept warm**, each with
the reason it matters and the evidence or milestone that would bring it back
into selection.

### 4. Name the immediate gate and next steering signal

Name the immediate gate that gives the bet forward motion and identify one
bounded next move with its owner. State the organic proof the bet is seeking and
the next signal that should reopen steering: proof arriving, a consequential
divergence, the bet stalling, the milestone closing, or the user revising
project purpose or outcome.

The full steering context is now ready for execution.

### 5. Route the bet into execution

Align active work to the selected bet. Existing tasks, PRs, and infrastructure
either become part of its route, stay warm for a later steering point, or stop
carrying current priority.

Pass a compact steering context into PER or another bounded execution workflow:
**Vision, Experienced outcome, Current bet, Organic proof, Immediate gate, and
Next steering signal**. Prepare, execute, and review stay attached to that
context: they test how to advance the bet and return evidence about what
happened. Local discoveries revise the route; project selection resumes at the
named steering signal.

Keep longer arcs and their return signals on the steering or coordination
surface. They remain legible without competing for attention inside bounded
execution.

The maneuver ends with an active bet, one routed move, and a visible return
condition.

## Output shape

Keep the result compact enough to steer from:

```text
Vision: <durable project thesis>
Experienced outcome: <what becomes meaningfully different>
Current bet: <smallest meaningful end-to-end slice>
Why now: <why this bet deserves momentum>
Organic proof: <evidence ordinary use should produce>
Immediate gate: <one bounded next move and owner>
Kept warm: <valuable longer arcs and their return signals>
Next steering signal: <evidence or milestone that reopens selection>
User judgment: <only the high-variance purpose or outcome question, when needed>
```

Include `User judgment` only when purpose or outcome remains high-variance. The
output is a steering surface: one bet moves, longer arcs stay legible, and
evidence names when selection happens again.
