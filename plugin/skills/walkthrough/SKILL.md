---
name: walkthrough
description: "Use when walking through code changes with the user one chunk at a time, pausing for discussion after each chunk, linking directly to code, and checking design alignment as the review progresses."
---

# Walkthrough

A walkthrough is two people reading code together. The agent sees the code structure — what functions call what, how data flows, where the complexity lives. The user sees the design intent — what the code is supposed to accomplish, what tradeoffs matter, whether the direction feels right. Neither has the full picture. The walkthrough works when both perspectives combine.

The agent's contribution is what it can see that the user might not — structural patterns, data flow, subtle inconsistencies. The user's contribution is what the agent can't access — design intent, priorities, whether the direction feels right. The walkthrough is valuable because it combines both.

**Stances used:** Load the **joint-reading** stance as the primary stance, **interpretive-synthesis** for big-picture revision, **collaborative-grounding** for user context, and **relational-continuity** for carrying language across chunks.

## The core tension

**Thoroughness vs. responsiveness.** A walkthrough that covers every file systematically is thorough but ignores what the user actually cares about. A walkthrough that only follows the user's questions misses things the user can't see. The right balance emerges from the conversation itself — the agent surfaces what the code is doing, the user steers toward what matters, and each chunk builds on what came before.

**Explanation vs. evaluation.** Sometimes a chunk needs the agent to explain what the code is doing — the user doesn't yet see the structure. Sometimes it needs the agent to evaluate whether the code matches the intent — the user understands the structure but wants a second opinion on the design. The right mode depends on what the user needs at each pause, and it often shifts as the walkthrough progresses.

**Detail vs. big picture.** The walkthrough moves through details sequentially, but understanding moves between details and the big picture in a circle. Reading the parts changes your understanding of the whole, and a revised understanding of the whole changes how you read the remaining parts. A walkthrough that only moves forward through chunks gradually loses coherence as the accumulated details outgrow the initial framing.

## How it works

The walkthrough is a loop with two rhythms: the **chunk rhythm** (present, pause, discuss, continue) and the **big-picture rhythm** (periodically step back, revise the overall understanding, then re-enter the details with the updated lens). The chunk rhythm drives the walkthrough forward. The big-picture rhythm keeps it coherent as it scales.

### Orient first

Before the first chunk, establish shared context:

- What's the broad goal or plan this code serves?
- What code or changes are we looking at?
- What kind of chunks make sense — by feature, by data flow, by layer?

Share your chunking strategy with the user. If the scope or focus isn't clear, use `vscode_askQuestions` to clarify before starting.

### Present one chunk at a time

A chunk is a conceptual unit — an entry point, a data flow boundary, a feature slice, a set of related tests. It might span multiple files or be a section of one file. The boundary should follow the logic of the code, not the file system.

Each chunk should:

- link directly to the relevant code so the user can read along
- explain what the code is doing in this chunk
- connect it to the broader design — does this fit the intended architecture?
- surface anything worth discussing — risks, surprises, mismatches, open questions

The shape of each chunk will vary. Sometimes the explanation needs depth. Sometimes the design connection is the interesting part. Sometimes there's a single surprising detail that deserves most of the attention. Let the content determine the shape, not a template.

### Pause after every chunk

Stop and invite discussion. The pause is not a formality — it's where the walkthrough's value comes from. The user may:

- confirm the direction and ask to continue
- want to go deeper on something the agent surfaced
- redirect the focus based on something they noticed
- share design context that changes how the next chunk should be read

Do not continue through the whole walkthrough in one response unless the user explicitly asks for that.

### Carry forward and revise

Each new chunk should reflect the concerns, priorities, and unresolved questions from earlier chunks. If the user raised a concern in chunk 2, chunk 4 should note whether that concern is still relevant. If a design priority emerged from discussion, later chunks should be read through that lens.

But carrying forward isn't just accumulation. Sometimes the details reveal that the big picture needs updating — a pattern across chunks suggests the architecture is different from what the plan assumed, or the user realizes from the details that their design intent needs revising. When this happens, pause the chunk-by-chunk flow and revise the big picture together before continuing.

Good moments for a big-picture revision:

- After finishing a major section of the codebase
- When a pattern emerges across multiple chunks
- When the user seems to be losing the thread
- When a detail contradicts the initial framing from the orient step

The revised understanding then shapes how the remaining chunks are read. This is the circle: parts inform the whole, the whole informs the parts.

## Design alignment

Design alignment isn't a separate checklist applied to each chunk. It's a thread that runs through the conversation. As you read code together, you're naturally asking: does this match what we're trying to build? Is the code telling the same story as the plan?

When you notice a mismatch — the code introduces a different abstraction than intended, responsibilities are in the wrong layer, tests validate the current implementation rather than the intended behavior — surface it as part of the chunk, not as a separate audit step. The user's response will tell you whether it's a real problem or an acceptable deviation.

## Collaboration

The walkthrough depends on information from both sides. The agent has shared perception of the code (through tools) and can read structure that the user might not focus on. The user has situated knowledge — what the design intent is, which parts feel risky, where the team's priorities lie.

Use `vscode_askQuestions` at moments where the user's situated knowledge would change how you read the next chunk. Good moments: choosing focus at the start, checking whether to go deeper on a potential mismatch, asking which of two directions matters more. Keep questions concise and directional — the user is reading code with you, not filling out a form.

## When to use

Use this skill when the user wants to read code together — reviewing changes in stages, comparing implementation against a plan, or building up a shared sense of what matters through discussion.

This skill is general-purpose. It can be used inside PER for the review phase, or independently for any collaborative code reading.

## Example prompts

- Walk me through this refactor one chunk at a time.
- Review these changes with me in stages and pause after each section.
- Walk through the implementation and validate it against the plan as we go.
- Read the tests and implementation with me, chunk by chunk, and help me decide what matters.
