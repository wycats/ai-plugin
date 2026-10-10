---
name: architectural-distillation
description: Restructure mature code so it directly expresses what the system has learned through use and evolution, preserving meaningful constraints and distinctions while removing historical residue and accidental complexity.
---

# Architectural Distillation

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

### 2. Separate the lesson from the mechanism

For each important source of complexity, ask:

> **What truth about the system does this structure encode?**

Then ask:

> **If we were expressing that truth today, would we still encode it this way?**

A mechanism can disappear while its lesson becomes structural. A distinction can remain while its representation changes completely. Two implementations can collapse into one when their apparent differences are merely historical, while similar-looking code may need to remain separate when experience has shown the semantics are genuinely independent.

Do not preserve a mechanism merely because it was once justified. Do not remove a distinction merely because its current implementation is awkward.

### 3. Infer the architecture that best expresses what is now known

Find the architecture that requires the fewest independent concepts while preserving every distinction that has proved meaningful.

Seek semantic compression: fewer representations of the same idea, fewer parallel mechanisms, fewer locally invented concepts, fewer places where the same invariant must be remembered manually.

Prefer making an invariant structurally true over repeatedly checking it. Prefer expressing genuine variation directly in the model over copying it into parallel implementations. Prefer existing shared primitives and types when they already encode knowledge that has been rediscovered locally.

Prefer eliminating the reason complexity exists over organizing that complexity more elegantly.

Do not optimize for a hypothetical pristine greenfield implementation, minimal line count, maximal abstraction, or speculative future-proofing. Optimize for conceptual integrity.

### 4. Test the simplification against reality

A simplification is only an improvement if it preserves the knowledge embodied by the mature system.

Before collapsing things, understand whether their differences are meaningful. Before removing protection, understand what invariant makes it unnecessary. Before dissolving a boundary, understand whether experience has shown the two sides change independently. Before introducing an abstraction, understand the real commonality or variation it compresses.

Use both the present system and its history to guard against two opposite errors: preserving obsolete structure because it already exists, and erasing hard-won structure because a cleaner local formulation looks attractive.

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

1. **What the system has learned** — the durable constraints, invariants, distinctions, and forms of variation supported by the evidence.
2. **What is historical residue** — structure better explained by the path of evolution than by current semantics.
3. **The target architecture** — the simplest coherent model that preserves everything the system has actually learned.
4. **The restructuring** — the concrete changes that make the implementation express that model directly.
5. **Evidence and uncertainty** — what is grounded, what is inferred, and what remains unresolved.

Prioritize a small number of high-leverage structural conclusions over an exhaustive inventory of local cleanup opportunities.

## Default Invocation

Do an architectural distillation pass on this area.

Treat the current implementation as the latest result of an iterative learning process. Build enough understanding of the present system and its available historical record to recover what experience has taught: the invariants, distinctions, constraints, boundaries, and forms of variation that have proved real.

Then separate those lessons from the mechanisms through which they accumulated. Infer the architecture that requires the fewest independent concepts while preserving every distinction that has proved meaningful, and restructure the code so that this accumulated knowledge is expressed as directly and coherently as possible.

**Preserve the lessons of the history; remove the shape of the history.**
