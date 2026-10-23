# Full skill catalog

Generated from canonical descriptions by `node experiments/situational-discovery/catalog.ts`.

- [architectural-distillation](../../skills/workflows/architectural-distillation/SKILL.md): Restructure mature code so it directly expresses what the system has learned through use and evolution, preserving meaningful constraints and distinctions while removing historical residue and accidental complexity.

- [authorial-continuity](../../skills/stances/authorial-continuity/SKILL.md): Use when drafting or revising language that will be attributed to a user, especially public prose where editorial help must preserve the author's judgment, ownership, and relationship with the readers.

- [code-review](../../skills/workflows/code-review/SKILL.md): Use when reviewing a patch or pull request: examine how the code fulfills the change's purpose, and revisit earlier judgments when details change your understanding of the design. For improving existing code's expression, use implementation-quality; for reading together, use walkthrough.

- [collaborative-grounding](../../skills/stances/collaborative-grounding/SKILL.md): Use when working with the user on tasks requiring their situated knowledge — priorities, intent, energy, context the agent can't see. Describes the relational structure of productive human-agent collaboration.

- [dangling-thread-review](../../skills/workflows/dangling-thread-review/SKILL.md): Use when taking stock of a conversation for ideas, questions, or decisions the work has left behind, especially after a change of direction. Recover what deserves renewed attention and what remains unresolved.

- [diagnostic-questioning](../../skills/stances/diagnostic-questioning/SKILL.md): Use when the next move depends on another person's intent, priorities, or experience, and each answer will help you choose what to ask next. Ground questions in what you already know; inspect observable system behavior through tools.

- [gap-reading](../../skills/stances/gap-reading/SKILL.md): Use when an explanation or direction of work has left details, possibilities, or unfinished threads out of view. Return to the underlying material to recover what may change your understanding or remain worth keeping before you can explain how it fits.

- [gh-resolve-review-threads](../../skills/workflows/gh-resolve-review-threads/SKILL.md): Use when PR review or diff comments are supplied as actionable feedback to implement, including UI flows that send comments without an explicit typed request. Completing this work includes verifying the fix and resolving matching GitHub/Copilot review threads; observation-only requests should leave threads open.

- [gh-write-pr-description](../../skills/workflows/gh-write-pr-description/SKILL.md): Use when drafting, updating, or reviewing a GitHub pull request title or body. Build the reviewer's intuition for the change, preserve the author's judgment and relationship with the readers, follow the repository template, and keep evidence at the strength it supports.

- [hypothesis-evaluating](../../skills/stances/hypothesis-evaluating/SKILL.md): Use when an inspection, experiment, or attempted use produces a result to compare with an expectation. Judge what the comparison establishes and what it changes about the explanation, approach, or next move.

- [hypothesis-forming](../../skills/stances/hypothesis-forming/SKILL.md): Use when an emerging explanation, analogy, or plan suggests something worth checking. Make the expectation specific enough that an observation or attempt can change your understanding and the next move.

- [implementation-quality](../../skills/workflows/implementation-quality/SKILL.md): Improve how existing code, types, names, file organization, and local documentation express the system's concepts. Use for implementation quality passes or holistic review of confusing details, from a single operation to a systematic codebase pass.

- [interpretive-synthesis](../../skills/stances/interpretive-synthesis/SKILL.md): Use when new details change your understanding of a situation, and that revised understanding changes what earlier observations mean or which question is worth pursuing.

- [joint-reading](../../skills/stances/joint-reading/SKILL.md): Use when walking through code, documents, or changes with the user where both perspectives contribute — the agent sees structural patterns, the user sees design intent.

- [observational-grounding](../../skills/stances/observational-grounding/SKILL.md): Use when observations seem to disagree, or a conclusion depends on an uncertain relationship between what was observed and what it is taken to show. Relate the evidence to its source and conditions as you investigate.

- [pause-and-ground](../../skills/workflows/pause-and-ground/SKILL.md): Use when an investigation keeps building on an uncertain reading of the evidence. Pause to inspect the assumption carrying the next decision and use the result to choose how to continue.

- [per-cycle](../../skills/workflows/per-cycle/SKILL.md): Use when organizing a consequential change into preparation, implementation, and independent evaluation, or when the user asks for PER. Preserve expectations so the result can revise the understanding that guided the work.

- [public-design-reasoning](../../skills/stances/public-design-reasoning/SKILL.md): Use when writing durable public design prose for RFCs, proposals, architecture notes, and canonization summaries where the document must serve users, implementers, maintainers, educators, and future readers.

- [reader-orientation](../../skills/stances/reader-orientation/SKILL.md): Use when shaping code, explanations, interfaces, or instructions around what someone can know where they encounter them, so they can reason locally and investigate deeper without losing the larger idea.

- [recon](../../skills/workflows/recon/SKILL.md): Investigate code or system behavior when developing an explanation requires following discoveries that can change your understanding and the question you need to answer.

- [relational-continuity](../../skills/stances/relational-continuity/SKILL.md): Background guidance for all plugin work: keep language inside the work, focus on what we're doing, and use precise and meaningful language that stays attached to the work underway.

- [rfc-writing](../../skills/workflows/rfc-writing/SKILL.md): Use when drafting, revising, reviewing, or promoting RFCs and design proposals, including Exo-managed RFCs, staged RFC lifecycle work, Rust/Ember-style RFC prose, and canonization or recommendation work for related RFCs.

- [socratic-elicitation](../../skills/stances/socratic-elicitation/SKILL.md): Use when the user recognizes something they cannot yet explain, or their examples and reactions suggest an intuition worth developing together. Offer reflections that help them examine and articulate their thinking, letting their response change the conversation.

- [steer-by-vision](../../skills/workflows/steer-by-vision/SKILL.md): Use when a project needs a deliberate choice of direction: several worthwhile moves compete, a milestone leaves the next move unclear, or useful local work has lost its connection to what the user wants to accomplish. Recover that connection and recommend work that can advance or test it.

- [thread-coordinator](../../skills/workflows/thread-coordinator/SKILL.md): Use when separate Codex chats need to work together: ownership or dependencies are unclear, a result needs to reach another effort, work has stalled between handoffs, or the user wants ongoing coordination. Keep each effort connected to the shared purpose and make the next action clear.

- [vision-steering](../../skills/stances/vision-steering/SKILL.md): Use when deciding what to pursue by considering what the work should make possible for people. Keep that purpose active through local choices, and let experience clarify or challenge the direction with the user.

- [walkthrough](../../skills/workflows/walkthrough/SKILL.md): Use when walking through code changes with the user one chunk at a time, pausing for discussion after each chunk, linking directly to code, and checking design alignment as the review progresses.
