---
name: session-load
description: "Start a new session cycle by reconciling Project Orientation, restoring repo context, and resuming the active bet or opening vision steering when selection genuinely changed."
---

# Session Load

Start a new day. Load the save, restore context, and start moving.

The user may be returning from a `session-rest` (still warm — they remember the context and serve as a bridge) or a `session-close` (cold — they slept, context has faded). The load process adapts: lighter orientation when the user is warm, fuller orientation when they're cold.

**Stances used:** Load the **interpretive-synthesis** stance to rebuild the working account, **collaborative-grounding** for genuinely high-variance user judgment, and **relational-continuity** to keep restored context attached to the work underway.

## Process

### 1. Read the trajectory and briefing

Use the **memory tool** to read `/memories/repo/SESSION-TRAJECTORY.md`. If it doesn't exist, check `/memories/active-handoffs.md` for repos with pending transitions.

Also check `/memories/repo/SESSION-BRIEFING.md` — if it exists, the pre-read agent produced codebase orientation that supplements the trajectory.

### 2. Read and reconcile orientation sources

Read every source named by the trajectory, including any repo-designated canonical project-state or vision surface and the coordination brief and active plan when they exist. Project Orientation is a projection; resolve its fields in this order:

1. explicit current project-level user steering;
2. a repo-designated canonical project-state or vision surface;
3. `COORDINATION_BRIEF.md` together with `ACTIVE_PLAN.md`;
4. the latest user-confirmed trajectory as fallback.

Apply precedence field by field. A higher source overrides what it addresses; compatible lower sources may fill missing operational fields. Record all contributing provenance. Within the coordination tier, the brief supplies the slow target and the active plan supplies a compatible Current bet and operational gate; surface disagreement rather than resolving it by recency. When a canonical source and trajectory disagree, state both observations and the exact differing fields, use the canonical state, and refresh the trajectory projection. Precedence resolves this disagreement without asking the user to choose. If explicit current user steering outranks a now-stale canonical surface, use the user's steering and make the reconciliation debt visible.

Live workspace state is evidence about proof and route. It never silently replaces Vision or Experienced outcome.

### 3. Verify workspace state

Run:

```bash
git branch --show-current
git log --oneline -3
git status
```

Compare against the trajectory's Git State section. Treat discrepancies according to their actual boundary:

- A wrong branch, unexplained changes, or dependency drift may be an operational blocker; surface the observation and ask only when an action requires user judgment.
- New commits or changed code may revise the route, Organic proof status, or Immediate gate inside the Current bet.
- Workspace divergence does not by itself reopen project selection.

Check for dependency drift after the Git comparison. If the repo uses a package manager (`package.json`, `Cargo.toml`, `go.mod`, etc.), check whether the lock file changed since the trajectory was written. Ask whether to install only when the answer cannot be established safely from repo convention and the install is necessary to resume the gate.

### 4. Resume or steer

Resume the existing bet when:

- a Current bet exists;
- its Next steering signal remains pending;
- evidence has not broken its relationship to the Experienced outcome; and
- the user has not explicitly revised project purpose or outcome.

Present Vision, Experienced outcome, Current bet, Organic proof status, and Immediate gate compactly, then resume the gate without reopening priority selection. After a rest, the explanation can be brief. After a close, include the briefing, key route evidence, and gotchas. Warm versus cold changes explanation depth, not which work is selected.

Invoke `/steer-by-vision` when project-sized work needs selection and no bet exists, the named steering signal arrived, evidence breaks the bet-to-outcome relationship, or the user explicitly revises purpose or outcome. Record `steering-in-progress` and mark a triggering named signal `reached` before invoking it. When the projection already says `steering-in-progress`, resume the existing handoff without invoking it again. Milestone closure alone is not enough unless it is the named signal or leaves no current bet.

Ask the user only for a genuine high-variance purpose or outcome judgment, or an operational blocker that cannot be resolved from the repo. Ordinary route questions remain attached to the active bet.

### 5. Clean up

Remove the current repo's row from `/memories/active-handoffs.md`.

## Output

A compact orientation followed by either the resumed Immediate gate or one already-recorded vision-steering boundary.
