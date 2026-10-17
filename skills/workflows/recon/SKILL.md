---
name: recon
description: Investigate code or system behavior when developing an explanation
  requires following discoveries that can change your understanding and the
  question you need to answer.
metadata:
  wycats.kind: workflow
  wycats.user-invocable: "true"
  wycats.invocation: contextual
---

# Recon

Begin with your best understanding of what the caller needs to resolve. Let
what you discover refine that understanding, including what would count as a
useful answer. Each result can change how you understand the system, what
earlier observations mean, and which question is worth pursuing next.

Keep [relational-continuity](../../stances/relational-continuity/SKILL.md "composition:load") active throughout so findings stay attached to the work underway.
Use [interpretive-synthesis](../../stances/interpretive-synthesis/SKILL.md "composition:load")
throughout the investigation. As your understanding of the system and the
question changes, revisit the evidence and decisions that depended on your
earlier understanding.

## How investigation works

Start with the question and what answering it would let the caller do. Resolve
uncertainties from the available context and tools. When the answer depends on
the user's intent or experience, ask about that uncertainty. Load
[diagnostic-questioning](../../stances/diagnostic-questioning/SKILL.md "composition:load")
when each answer needs to reshape your understanding and determine the next
question.

Then explore adaptively. Start broad, follow leads. Each search result, file read, or command output either opens new directions or closes them. Use tools beyond search — git history, terminal commands, project tooling — when they help trace intent or verify structure. When a direction dead-ends, note what you tried and pivot.

Following a promising lead can expose a problem with the question itself.
You might explain an expensive operation and find ways to improve it, then
discover that the application repeats it far more often than its purpose
requires. The measurements still hold; their significance changes. Return to
the behavior the caller needs and investigate what work would produce it.

Let discoveries change the scope of your attention within the assignment.
Sometimes a local explanation settles the question. Sometimes it changes how
you read several earlier findings. Share that change when it affects a decision
the caller is making, so they can correct your understanding of the purpose
while you continue investigating the mechanism.

## Relate observations to the question

When a lead depends on what an observation establishes or whether two sources
refer to the same thing, load
[observational-grounding](../../stances/observational-grounding/SKILL.md "composition:load").
Use the possible explanation to choose what to inspect, and let the inspection
change how you understand the evidence. Establishing that two records describe
different events may dissolve a contradiction and change which question is
worth following.

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
