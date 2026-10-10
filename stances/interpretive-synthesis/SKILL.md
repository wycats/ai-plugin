---
name: interpretive-synthesis
description: "Use when building a coherent account from many observations, summarizing conversation state, or explaining how pieces connect. The skill is in what gets left out."
user-invocable: false
---

# Interpretive Synthesis

Understanding the whole through the parts, and the parts through the whole, where each pass between them revises both. Gadamer called this the hermeneutic circle — he argued it's not a method you apply but the fundamental structure of how understanding works whenever the material is complex enough that the whole and the parts inform each other.

---

The synthesis operates continuously, not in two passes. Each new detail revises the big picture, and the revised big picture changes how you encounter the next detail. You don't wait until the end to revise — the revision is happening as you go.

The synthesis is grounded in **collaborative grounding** — the agent can form interpretations, but the user's situated knowledge is essential for resolving ambiguities about intent. The agent proposes an account; the user confirms, corrects, or deepens it. This is not a step that happens after the synthesis — it's woven through it. Each pass through the hermeneutic circle is an opportunity for the agent to share what it sees and ask the user to contribute what it can't.

## The relational structure

A historian constructing a narrative from fragmentary sources. They start with a picture of the period based on what's known. A newly discovered letter doesn't just add a fact — it reframes the entire picture. Alliances they thought were stable were already fracturing. With the revised picture, they re-read previously examined documents and see things they missed. Each pass between the fragments and the narrative changes both.

Reading a novel, or watching a well-constructed puzzle-box show. As you move through it, each new scene revises your understanding of what the story is about. Chapter 5 recontextualizes chapter 2 — not because you go back and re-read it, but because your understanding of it has shifted. The reshaped whole becomes the lens through which you encounter the next part. Shows designed around mystery and revelation make this explicit: each episode is built to trigger a revision of everything you've seen so far.

A couples therapist listening to both partners describe the same event. Each account makes sense on its own. But when you hold both accounts simultaneously and look for the coherent picture that explains both, something new emerges that neither partner described. The therapist's understanding of the relationship revises with each new detail, and the revised understanding reframes details from earlier in the session. The synthesis isn't "partner A said X, partner B said Y." It's a third account that makes sense of both.

## What it reveals

Interpretive synthesis surfaces things that linear review misses:

- **Drift from intent**: the session started with one goal but gradually shifted to another. Both the original and the evolved intent may matter.
- **Implicit abandonments**: threads that were silently dropped, not because they were resolved but because something else took priority. These may still be important.
- **Retroactive reinterpretation**: a decision made early in the session that seemed right at the time but looks different in light of what happened later.
- **Emergent patterns**: connections between threads that weren't visible when each thread was active but become clear when you look at the session as a whole.

## When this stance applies

- Handoff preparation (forming a coherent account of the session)
- Walkthrough big-picture revision (revising the understanding of the codebase as details emerge)
- Any situation where the material is complex enough that the whole and the parts inform each other

## What this stance is not

- Summary (compressing what happened without interpretation or revision)
- Evaluation (judging quality against a standard)
- Chronological review (walking through events in order without forming a coherent account)
- Pattern recognition alone (noticing regularities without the revisionary loop between whole and parts)

## Composition notes

Interpretive synthesis uses [collaborative grounding](../collaborative-grounding/SKILL.md "composition:reference") throughout — the hermeneutic circle surfaces ambiguities that only the user's situated knowledge can resolve.

Composes with **joint reading** in the walkthrough (the big-picture revision step is interpretive synthesis applied to code). Composes with [diagnostic questioning](../diagnostic-questioning/SKILL.md "composition:reference") in the handoff (the coherent account reveals where the high-variance threads are and helps prioritize the diagnostic sequence). The handoff skill uses interpretive synthesis as its opening move — forming the account that the diagnostic questioning then probes.
