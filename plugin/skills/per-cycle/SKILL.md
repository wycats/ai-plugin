---
name: per-cycle
description: "Use when running a prepare-execute-review (PER) cycle, doing a PER workflow, or coordinating work through `prepare`, `execute`, and `review` subagents with explicit gates."
---

# PER Cycle

A hypothesis → experiment → evaluation cycle for non-trivial work. Prepare forms predictions about what the codebase will encounter. Execute tests those predictions against reality. Review reads the distance between prediction and result.

The value of the cycle isn't in the gates between phases. It's in the cognitive separation: each phase thinks differently, and the handoff between them is where the interesting findings emerge. Prepare's predictions tell execute where to look. Execute's encounters with reality tell review what to evaluate. Review's calibration tells you whether to proceed, iterate, or revise the approach.

PER begins after project selection. It tests how a bounded move advances the
selected bet and returns evidence to the next steering decision.

**Stances used:** Load the **hypothesis-forming** stance for prepare, **hypothesis-evaluating** stance for review, **collaborative-grounding** when user intent changes the cycle, and **relational-continuity** for phase handoffs.

## When to use

The overhead of three phases is justified when the task has enough complexity or risk that you'd benefit from separating prediction from action from evaluation. Tasks that change behavior across multiple files, have ambiguity about the right approach, or benefit from independent verification of the result.

The overhead is not justified for trivial fixes, purely exploratory research, or tasks where the three phases would be slower than just doing the work. Use judgment.

## Vision boundary

Enter the cycle with a selected bet and the experienced outcome it is meant to
produce. If several locally valid bets still compete, use **steer-by-vision**
before dispatching prepare.

Within a cycle, prepare, execute, and review stay attached to that bet. A local
divergence revises the implementation route or loops a bounded correction.
Project selection resumes when the bet's named steering signal arrives,
relationship-breaking evidence shows the bet no longer plausibly leads to its
experienced outcome, or the user revises what the project is for.

## Steering context

Carry one compact purpose boundary through every phase:

- **Vision:** the durable project thesis.
- **Experienced outcome:** what the current bet should make meaningfully
  different.
- **Current bet:** the selected evidence-bearing route.
- **Organic proof:** what ordinary use should reveal if the bet works.
- **Immediate gate:** the bounded move this cycle advances.
- **Next steering signal:** the evidence or milestone that returns project
  selection to **steer-by-vision**.

Keep valuable longer arcs and their return signals on the steering or
coordination surface. They should remain visible without entering phase prompts
and competing with the current bet.

## The shortest honest evidence path

A cycle chooses the smallest experiment that can honestly support its claim.
The observation path is part of the hypothesis: prepare predicts both the
capability result and how execute will reach and observe it.

The tension is **evidence sufficiency vs. path expansion**. Qualify only the
substrate properties on which the claim depends. Each added qualification earns
its place by making the result more interpretable and stays bounded to the
depended-on property.

## The arc

### Prepare: form the hypothesis

Dispatch the `prepare` subagent with the steering context, relevant file paths,
constraints, and what success looks like for the immediate gate. Prepare forms
predictions about what the codebase looks like, where that move will encounter
friction, and how it is expected to advance the current bet. Vision and the
current bet remain the purpose boundary; prepare forms its predictions within
them.

What comes back is a pre-execution hypothesis: specific, falsifiable predictions organized by confidence and consequence. The most valuable predictions are the ones where being wrong would change the approach.

The hypothesis also gives the experiment five anchors:

- **Claim:** the bounded conclusion the result could support.
- **Relationship to Organic proof:** how this claim would produce the current
  bet's Organic proof, qualify a necessary path toward that proof, or leave that
  proof pending.
- **Capability assumptions:** what the behavior itself is expected to do.
- **Substrate assumptions:** what the observation path must provide for the
  attempt to reach that behavior.
- **Next effect boundary:** the next consequential transition inside the
  Immediate gate that the experiment may cross, such as a launch, mutation,
  spend, or external communication.

Before proceeding: check whether the high-consequence predictions are grounded in evidence (file paths that exist, symbols that are real, assumptions verified against the workspace). If a critical prediction is unverified or vague, send it back to prepare with what's missing. The hypothesis needs to be specific enough that execute can test it and review can evaluate it.

### Execute: run the experiment

Dispatch the `execute` subagent with the same steering context and prepare's
hypothesis. Execute advances the immediate gate through the codebase, making
bounded changes and reading how reality responds. Local discoveries can revise
the route inside the current bet. When any of the following happens, execute
surfaces it and returns control: a named steering signal arrives; local
evidence shows the current bet no longer plausibly advances the experienced
outcome; or the user revises project purpose or experienced outcome. Then
**steer-by-vision** owns subsequent project selection.

What comes back is changed files, executed commands, and an honest account of what happened — including where prepare's predictions were wrong and where reality surprised.

Execute attempts to cross one named effect boundary at a time, then reports the
boundary and whether it was crossed. It also declares whether and how any
precondition miss before the boundary will be retried.

Before proceeding: spot-check the account against the workspace. Did the reported changes actually happen? Are the reported test results consistent with what the commands would produce? Execute maintains contact with reality, but the coordinating agent verifies that the reporting is accurate too.

### Review: evaluate the hypothesis

Dispatch the `review` subagent with the steering context, prepare's predictions,
and execute's account. Review compares prediction against outcome, judges what
the divergences mean, and evaluates how the result bears on the current bet and
its experienced outcome.

What comes back is a calibration report: what matched, what diverged, what the
divergences mean, and whether the immediate result and the current bet's route
warrant confidence.

Review records attempt disposition for every result and, when evidence exists,
its evidence layer. It keeps the dimensions separate before judging what the
result means for the claim:

- **Evidence layer:** capability, substrate, or both.
- **Attempt disposition:** effect boundary crossed, or precondition miss before
  the boundary.

**Capability evidence** directly bears on the claimed behavior. **Substrate
evidence** qualifies a dependency of the observation path. A **precondition
miss** means the required effect boundary was not crossed. It provides no
capability evidence but may provide substrate evidence.

The report also records how the cycle's result bears on the selected bet:
whether it produced the bet's Organic proof, strengthened or qualified a
necessary path toward that proof, or left that proof pending; which assumption
changed; and whether the next steering signal has been reached. Keep implementation
validation distinct from Organic proof. Tests, checks, and PR readiness do not
establish Organic proof unless that release or maintenance experience is itself
the experienced outcome being tested. When ordinary use was not observed,
report **Implementation validated; Organic proof pending**. Review surfaces a
reached steering signal; it also surfaces relationship-breaking evidence —
signs that the result no longer plausibly advances the experienced outcome — or
an explicit user revision of project purpose or experienced outcome. Selection
at that boundary belongs to **steer-by-vision**.

When the user wants a collaborative review rather than a one-shot report, use the `walkthrough` skill to conduct the review phase interactively — examining the changes together, one chunk at a time.

## When phases loop

The cycle is not always linear. Reality creates branches.

**Prepare discovers something that blocks the plan.** The prediction is: "this won't work as described." Don't proceed to execute. Resolve the blocker in conversation with the user, then re-enter prepare with the revised understanding.

**Execute encounters something prepare didn't predict.** The mismatch between prediction and reality is itself a finding. Execute surfaces it rather than absorbing it. If the mismatch changes the approach, return to prepare. If it's local and manageable, execute continues and documents the divergence for review.

**The substrate repeatedly diverges from the hypothesis.** Return to prepare
and make the depended-on substrate property its own bounded qualification
cycle. Carry its result back into the capability experiment instead of
accumulating local patches along the observation path.

**Review finds a consequential problem.** When the problem remains inside the
current bet, it becomes a new bounded task. Re-enter execute with the specific
fix, then review the fix. When it reaches the named steering signal, return the
evidence to **steer-by-vision**.

**Review finds the hypothesis was wrong in an interesting way.** Prepare's model of the codebase was incorrect, and the incorrectness reveals something about the system that nobody anticipated. This is the most valuable outcome of the cycle — not a failure but a discovery. Surface it to the user.

## The coordinating agent's role

You — the agent using this skill — are not one of the three subagents. You're the scientist running the experiment. You design the dispatch prompts, verify the outputs, manage the transitions, and decide when to loop vs. proceed.

You are also the single owner of the steering transition. Phase agents surface
evidence and reached signals to you. A reached steering signal, evidence that
calls the bet's relationship to its experienced outcome into question, or an
explicit user revision of project purpose or experienced outcome takes
precedence. Invoke **steer-by-vision** once with the cycle's evidence. While
organic proof remains pending and none of those conditions applies, route the
next bounded evidence move inside the current bet. Phase agents do not invoke
**steer-by-vision** independently.

The tension to navigate: trust vs. verification. The subagents are generally reliable, but they operate in isolation. Each one can only see what you give it. Verify consequential claims against the workspace, but don't re-do each subagent's work. The verification is about catching the occasional fabrication or gap, not about distrust.

The other tension: ceremony vs. momentum. The cycle adds overhead. Use it when the overhead pays for itself in clarity and confidence. Skip phases when they'd be pure ceremony — if the task is clear enough that prepare would just confirm what everyone already knows, go straight to execute.
