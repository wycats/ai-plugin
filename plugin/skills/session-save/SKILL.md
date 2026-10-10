---
name: session-save
description: "Keeps SESSION-TRAJECTORY.md warm as work progresses and offers checkpoints at natural boundaries. Saving is not stopping."
---

# Session Save

Saving is not stopping. This skill keeps the trajectory warm so that if the session ends — planned or not — the next session can start with the right direction and momentum. Think of it as version control for context: commit early, commit often, keep working.

**Stances used:** Load the **gap-reading** stance for thorough checkpoints, the **collaborative-grounding** stance for timing decisions, and the **relational-continuity** stance when writing trajectory updates.

## What SESSION-TRAJECTORY.md is

`/memories/repo/SESSION-TRAJECTORY.md` (accessed via the memory tool) carries two related layers:

- **Project Orientation** mirrors the durable selection currently governing the work: its source, Vision, Experienced outcome, Current bet, Organic proof, Immediate gate, Kept-warm arcs with return signals, and Next steering signal.
- **Session evidence** records what happened inside that bet: implementation results, route changes, live tensions, decisions, and gotchas.

Project Orientation is a projection, not a new authority. Reconcile its fields in this order: explicit current project-level user steering; a repo-designated canonical project-state or vision surface; `COORDINATION_BRIEF.md` together with `ACTIVE_PLAN.md`; then the latest user-confirmed trajectory as fallback. Apply precedence field by field, let compatible lower sources fill fields a higher source does not address, and record all contributing sources. Within the coordination tier, the brief supplies the slow target and the active plan supplies a compatible Current bet and operational gate; surface a disagreement rather than resolving it by recency. Live workspace evidence can revise proof, route, or gate; it cannot silently replace Vision or Experienced outcome.

## Keeping the trajectory warm

As significant work happens during a session, keep SESSION-TRAJECTORY.md loosely updated. This doesn't mean rewriting it after every edit — it means noticing when something meaningful has changed:

- The authoritative orientation source changed or disagreed with the projection
- The Current bet, Organic proof status, Immediate gate, Kept-warm arcs, or Next steering signal changed
- A PER review returned evidence about the bet
- A discovery revised the route inside the bet
- A meaningful decision, gotcha, validation result, or commit should survive the session

When these happen, reconcile Project Orientation first, then update the relevant session-evidence section using the memory tool. This is lightweight — a line or two, not a full transition protocol. Then keep working. Checks and tests are implementation validation; they become Organic proof only when that maintenance or release experience is itself the Experienced outcome.

When the named steering signal arrives, no bet remains, evidence breaks the bet's relationship to the Experienced outcome, or the user explicitly revises project purpose or outcome, the first lifecycle or coordination surface to observe the boundary invokes `/steer-by-vision` once. Record the transition as `steering-in-progress` and, when a named signal triggered it, mark that signal `reached` before handing it off. If the projection already says `steering-in-progress`, preserve and resume that boundary without another invocation. A completed milestone alone does not reopen selection unless it is the named signal or leaves no active bet.

## Checkpoints

A checkpoint is a more thorough trajectory capture at a natural boundary. After completing a feature, before starting a risky change, or when enough has accumulated that you'd hate to lose it.

A checkpoint has two parts:

1. **Reconcile and update.** Refresh Project Orientation from its named sources, then capture evidence, route changes, decisions, and gotchas around the recorded Immediate gate.

2. **Gather dangling threads.** Use the **gap-reading** stance: read back through the conversation since the last checkpoint and look for what the trajectory update didn't capture. Keep route tensions with the Current bet, preserve already-selected alternatives as Kept-warm arcs with return signals, and reserve project-sized alternatives for the next genuine vision-steering boundary.

The second part is what distinguishes a checkpoint from a quick trajectory update. The trajectory captures the main narrative. Dangling thread review catches what the narrative left out.

After the checkpoint, keep working. A checkpoint preserves progress without costing momentum.

Offer a checkpoint when:

- A coherent unit of work just finished
- The session is about to shift to a different kind of task
- Significant progress has accumulated since the last checkpoint

## What this skill does NOT do

This skill does not run the transition protocol and does not decide whether to stop. When the user decides it's time to transition, they invoke `/session-rest` (between sessions, user is still around) or `/session-close` (end of day, user is leaving). This skill is the ongoing maintenance layer; those skills handle transition awareness and the transition protocols.
