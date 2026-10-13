---
name: architectural-distillation
description: Restructure mature code so it directly expresses what the system
  has learned through use and evolution, preserving meaningful constraints and
  distinctions while removing historical residue and accidental complexity.
metadata:
  wycats.kind: workflow
  wycats.user-invocable: "true"
  wycats.invocation: contextual
---

# Architectural Distillation

Recover what experience has taught by moving between the evidence and a written
account of the learned model. Test that account against the difficult cases,
then derive an architecture that expresses the knowledge directly.

## Purpose

Treat mature software as the result of an iterative learning process.

Its current structure reflects successive encounters with reality: assumptions failed, invariants became clearer, apparently similar cases sometimes proved meaningfully different, separate mechanisms sometimes converged, and abstractions either survived repeated change or turned out to be temporary.

That learning is valuable. The incidental structure left behind by the sequence of changes often is not.

> **Preserve the lessons of the history; remove the shape of the history.**

The goal is to restructure the code so that what the system has learned is expressed as directly and coherently as possible now.

## Core Principle

Build enough understanding of both the present system and its historical record to identify the knowledge embodied by the current architecture.

When a historical record is available, use it rather than reconstructing a plausible history solely from the surviving code. The relevant record may live anywhere the work, decisions, failures, migrations, prior states, and surrounding reasoning were preserved.

Treat both the current implementation and the historical record as evidence rather than authority. The implementation may contain obsolete structure. Historical explanations may have been incomplete or superseded by later experience.

The task is to recover the durable knowledge underneath them.

## Method

### 1. Understand what the system has learned

Before proposing a target architecture, understand the system well enough to identify the constraints and structure that have proved real.

Look for the deeper model the code and its evolution reveal: what must be true, what is genuinely distinct, what changes together, what changes independently, which forms of variation recur, which boundaries have proved meaningful, and where experience corrected an earlier model.

The question to answer is:

> **What did successive iterations teach us that a greenfield design would not have known?**

Do not substitute a plausible story inferred from today's snapshot for historical evidence when better evidence is available.

### 2. Articulate the learned model

The account should leave freedom where mechanisms are incidental and constrain
design where experience has established something real.

Writing the learned model is part of separating the lesson from the mechanism.
Where the account still needs the machinery to explain why something matters,
investigate what understanding that machinery is carrying. Each attempt to
explain the system can reveal a distinction the current model has missed.

#### Write the account

For each important source of complexity, work through two questions:

> **What truth about the system does this structure encode?**
>
> **If we were expressing that truth today, would we still encode it this way?**

Use [interpretive synthesis](../../stances/interpretive-synthesis/SKILL.md "composition:load")
to explain the concepts, relationships, invariants, and meaningful variation
revealed by the evidence. Organize the account around what must be understood
and why. Include concrete cases that force a distinction, failures that exposed
an earlier model's limits, and the reasons a boundary has proved meaningful.
Internal knowledge matters alongside observable behavior: ownership, independent
change, ordering, and performance constraints may all shape a sound design.

For example, a retry queue and a recovery table might embody the lesson that an
operation can succeed remotely while its local outcome remains unknown. The
learned constraint may be that recovery must handle this uncertainty without
duplicating the effect. Establishing the outcome before retrying and making
retries idempotent are different ways to satisfy that constraint; the evidence
and operating conditions determine which designs are viable.

A mechanism can disappear while its lesson becomes structural. A distinction
can remain while its representation changes completely. Similar-looking code
may need to stay separate when experience has shown its semantics are
independent, while apparent differences may turn out to be merely historical.

Keep source and historical references available so the reasoning can be checked.
Existing names, types, algorithms, and boundaries remain useful when they
express the learned model; explain the constraints that make them significant.
Distinguish behavior observed today from obligations to preserve, and distinguish
both from proposed changes. An unexplained detail remains an open question.

Scale the account to the work: a focused change may need a few paragraphs in
the review or plan; a broad restructuring may need a design document. Use
[reader orientation](../../stances/reader-orientation/SKILL.md "composition:reference")
to judge whether it supplies the context a reader needs without having followed
the investigation. It should support architectural reasoning while keeping the
evidence accessible for deeper inspection.

#### Test what the account explains

Read the account against representative behavior, historical failures, and cases
that initially looked alike but proved different. Use
[gap reading](../../stances/gap-reading/SKILL.md "composition:load") to identify
what its coherence may have smoothed away. A fluent explanation can still omit
the condition that made a safeguard necessary.

The test is:

> **Could someone use this account to explain which implementation choices are
> open and which are constrained by the hard cases the system has encountered?**

When a detail resists explanation, return to the relevant evidence. When the
remaining choice depends on product intent, bring the concrete distinction to
the user.

```text
repeat:
  Articulate the learned model from the current evidence.
  Test the account against the difficult cases and look for omitted constraints.
  If a consequential gap remains, investigate or resolve intent, then revise.
  Otherwise, carry the account and its explicit uncertainties into design.
```

### 3. Infer the architecture that best expresses what is now known

Use the tested account to find the architecture that requires the fewest independent concepts while preserving every distinction that has proved meaningful. Keep recovered constraints distinguishable from the new design choices that express them.

A sound account may show that the current architecture already expresses the
learned model well. Retain that structure where its choices follow from the
constraints, and concentrate restructuring where history still obscures them.

Seek semantic compression: fewer representations of the same idea, fewer parallel mechanisms, fewer locally invented concepts, fewer places where the same invariant must be remembered manually.

Prefer making an invariant structurally true over repeatedly checking it. Prefer expressing genuine variation directly in the model over copying it into parallel implementations. Prefer existing shared primitives and types when they already encode knowledge that has been rediscovered locally.

Prefer eliminating the reason complexity exists over organizing that complexity more elegantly.

Do not optimize for a hypothetical pristine greenfield implementation, minimal line count, maximal abstraction, or speculative future-proofing. Optimize for conceptual integrity.

### 4. Test the simplification against reality

A simplification is only an improvement if it preserves the knowledge embodied by the mature system.

Before collapsing things, understand whether their differences are meaningful. Before removing protection, understand what invariant makes it unnecessary. Before dissolving a boundary, understand whether experience has shown the two sides change independently. Before introducing an abstraction, understand the real commonality or variation it compresses.

Use both the present system and its history to guard against two opposite errors: preserving obsolete structure because it already exists, and erasing hard-won structure because a cleaner local formulation looks attractive.

If a proposed architecture exposes a missing constraint, revise the learned
model and revisit the design. The account remains answerable to the evidence
through implementation and validation.

### 5. Restructure toward the learned model

Once the conceptual model is clear, make the implementation express it directly.

Cross file, module, package, or layer boundaries when doing so materially improves the architecture. Incidental internal APIs and dependency directions are not constraints merely because they already exist.

Preserve externally meaningful behavior and genuine constraints. Within those constraints, allow obsolete concepts, compatibility machinery, defensive structure, duplicated representations, and transitional boundaries to disappear when the knowledge they once carried can be represented more directly.

The result should feel less like a cleaned-up sequence of historical events and more like a coherent expression of the knowledge those events produced.

## Evidence Discipline

Keep the provenance of important architectural conclusions clear.

Distinguish what is supported by the current system or historical record from what is inferred to explain that evidence, and distinguish both from questions that remain unresolved.

Use uncertainty to guide investigation rather than filling gaps with plausible stories.

## Review Output

When reviewing rather than directly editing, organize the result around:

1. **The learned model** — the account of durable constraints, invariants, distinctions, and forms of variation, with the difficult cases that test it and the evidence supporting it.
2. **What is historical residue** — structure better explained by the path of evolution than by current semantics.
3. **The target architecture** — the simplest coherent model that preserves everything the system has actually learned.
4. **The restructuring** — the concrete changes that make the implementation express that model directly.
5. **Evidence and uncertainty** — what is grounded, what is inferred, and what remains unresolved.

Prioritize a small number of high-leverage structural conclusions over an exhaustive inventory of local cleanup opportunities.

## Default Invocation

Do an architectural distillation pass on this area.

Treat the current implementation as the latest result of an iterative learning process. Build enough understanding of the present system and its available historical record to recover what experience has taught: the invariants, distinctions, constraints, boundaries, and forms of variation that have proved real.

Separate those lessons from the mechanisms through which they accumulated by writing the learned model. Let gaps in the account guide further investigation, and test it against the difficult cases in the system and its history. Use that account to infer the architecture that requires the fewest independent concepts while preserving every distinction that has proved meaningful, and restructure the code so that this accumulated knowledge is expressed as directly and coherently as possible.

**Preserve the lessons of the history; remove the shape of the history.**
