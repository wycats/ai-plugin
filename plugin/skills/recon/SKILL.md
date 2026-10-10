---
name: recon
description: "Use when investigating unfamiliar code, tracing data flows, mapping architecture, or answering questions that require adaptive exploration — where the agent needs to follow leads, use tools interactively, and synthesize findings rather than just search for known terms."
---

# Recon

Adaptive investigation where each result changes what you look for next. Unlike search (which executes a known plan), recon follows leads, makes judgment calls about what's worth pursuing, and synthesizes findings into a grounded account.

**Stances used:** Load the [diagnostic-questioning](../diagnostic-questioning/SKILL.md "composition:load") and [interpretive-synthesis](../interpretive-synthesis/SKILL.md "composition:load") stances for investigation, load [observational-grounding](../observational-grounding/SKILL.md "composition:load") when surfaces conflict, and keep [relational-continuity](../relational-continuity/SKILL.md "composition:load") active throughout for keeping findings attached to the work underway.

## When to use

Use recon when understanding the answer requires following a trail — tracing data flows, reading git history for intent, exploring how modules connect across layers. The question can't be reduced to a single search query, and what you find at each step determines where to look next.

| Instead of recon... | Use... | Because... |
|---------------------|--------|------------|
| Known search plan | Explore | Each result won't change what you search next |
| Parallel search during recon | Explore (as fan-out) | Explore gathers; recon synthesizes |
| Parallel bounded investigation | Recon-worker (as fan-out) | Needs tools and judgment, but scoped |
| Code changes | Execute or PER | Recon investigates; it doesn't implement |
| "Where is X?" | Explore | Don't bring a detective to a dictionary lookup |

## How investigation works

Start by understanding the question: what needs to be understood, what's the scope, what's the purpose (planning, debugging, understanding, auditing). If ambiguous, ask.

Then explore adaptively. Start broad, follow leads. Each search result, file read, or command output either opens new directions or closes them. Use tools beyond search — git history, terminal commands, project tooling — when they help trace intent or verify structure. When a direction dead-ends, note what you tried and pivot.

The investigation has a natural shape: broad orientation, then focused pursuit of the most promising leads, then synthesis. But the shape adapts to what you find. Sometimes you converge quickly. Sometimes sources conflict and you need to trace the conflict itself.

## Stabilize the phenomenon

When observations appear to disagree, preserve the contradiction before
explaining it. Name what each surface actually shows, and ask what would make
those observations bear on the same phenomenon.

This is a pause inside recon, not a separate procedure. Inspect only enough to
stabilize the observation. Sometimes that means checking scope, identity,
timing, workspace, or storage context. Sometimes it means discovering that the
two observations are not yet comparable.

For example, if an event log shows recent requests but a database read shows no
recent turns, the stable starting point is not "persistence failed" or "the
cache missed." It is the observed contradiction: the log surface reports recent
activity, while the storage surface does not show the corresponding persisted
state. Once the surfaces are known to be comparable, causal recon can resume.
Consult the full [observational-grounding](../observational-grounding/SKILL.md "composition:reference")
stance when this compact guidance leaves comparability ambiguous.

## Fan-out

When a question is broad enough to benefit from parallel work, dispatch subagents. The choice depends on what the sub-task needs:

**Explore** (the default for parallel gathering): when the sub-task is expressible as a single search prompt and the results are independent. Treat results as leads, not conclusions — verify the important ones before building on them.

**Recon-worker** (for bounded investigation): when the sub-question needs tools and judgment that Explore can't provide. Brief the worker on the overall question, not just "find X." Ask it to report surprises. Its findings carry more trust than raw search results because it applied judgment, but verify claims that are critical to your conclusions.

Default to Explore. Most fan-out is mechanical gathering.

## Evidence discipline

The primary failure mode of recon is confident-sounding claims with no evidence trail. Every finding must be traceable — file path, commit hash, command output, or explicitly marked as inference.

The principles:

**Separate observation from inference.** A file at a path containing specific content is an observation. "This module is responsible for X" is an inference — it might be wrong. Grounded reports distinguish the two so the reader can evaluate your reasoning.

**Record negative results.** What you searched for and didn't find is evidence. "Searched for X across Y — not found" is a finding that prevents the reader from re-exploring the same ground.

**Surface source conflicts.** Committed code, working tree, documentation, and config files may disagree. Don't silently pick a winner. Surface the conflict, state which source you're treating as current and why, and let the caller resolve it.

**State what would change your mind.** For non-trivial findings, include the falsification condition. If you claim "module X handles all auth token refresh," what evidence would contradict that? If you can't articulate it, your confidence is lower than you think.

## When to stop

The right stopping point depends on the purpose:

- **Planning work**: you can identify the files, boundaries, and risks
- **Debugging**: you've traced to a root cause or narrowed to candidates
- **Understanding**: you can explain the mechanism to someone unfamiliar
- **Auditing**: you've enumerated the relevant instances and their states

The default test: could the caller make a decision based on what you've found?

Stop early and report when: sources of truth conflict and you can't resolve them, the question requires design intent the code can't answer, or the scope is expanding beyond the original question. These aren't failures. Reporting "I can't determine X because Y and Z disagree" is more valuable than guessing.

## What you produce

Scale the output to the investigation's complexity. A focused question gets a conversational answer with inline citations. A complex investigation gets a structured report that separates findings (with evidence) from inferences, surfaces conflicts and negative results, and lists open questions the code can't answer.

When invoked by another agent, always use a structured report — the caller needs parseable findings, not prose.

The tension to navigate: thoroughness vs. actionability. You could document everything you found, but most of it confirms what everyone expected. Spend your reporting depth on the findings that would change decisions: where your expectations were wrong, where sources conflict, where the codebase does something nobody anticipated.
