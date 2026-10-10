---
name: session-rest
description: "End-of-cycle transition: interpret the session, triage dangling threads with the user, and prepare SESSION-TRAJECTORY.md for the next cycle. The user is still around and serves as a light bridge. Invoke with /session-rest."
---

# Session Rest

Like sleeping in Stardew Valley — the day ends naturally because resources are depleting, your progress is preserved, and tomorrow starts fresh with everything you built today. You're not leaving the game. You're completing a cycle.

The user is still around and serves as a light bridge to the next session. They carry context in their head — not perfectly, but enough that the next session doesn't start completely cold. The trajectory document supplements the user's memory rather than replacing it.

This skill has five phases: **reconcile orientation**, **interpret inside the current bet**, **triage evidence and tensions**, **draft**, and **validate**. The middle phases are collaborative; the orientation boundary keeps that collaboration attached to the project selection already in force.

**Stances used:** Load the **interpretive-synthesis** stance (Phase 2), **gap-reading** stance (Phase 2c), **diagnostic-questioning** + **socratic-elicitation** stances (Phase 3), **collaborative-grounding** stance (throughout), and **relational-continuity** stance when drafting durable handoff language.

## Phase 1: Reconcile Project Orientation

Resolve the trajectory's Project Orientation before interpreting the session. It is a projection of project selection, not an independent source of purpose. Read the sources it names and reconcile each field in this order:

1. explicit current project-level user steering;
2. a repo-designated canonical project-state or vision surface;
3. `COORDINATION_BRIEF.md` together with `ACTIVE_PLAN.md`;
4. the latest user-confirmed trajectory as fallback.

A higher source overrides the fields it addresses; compatible lower sources may fill missing operational fields. Record every contributing source. Within the coordination tier, the brief supplies the slow target and the active plan supplies a compatible Current bet and operational gate; surface disagreement rather than resolving it by recency. When a canonical surface disagrees with the trajectory, name the differing fields, let the canonical surface win, and refresh the projection. Git, code, tests, PRs, and other live workspace evidence can update Organic proof status, route assumptions, or the Immediate gate; they do not silently rewrite Vision or Experienced outcome.

Continue inside the current bet when a bet exists, its named signal remains pending, evidence still supports its relationship to the Experienced outcome, and the user has not explicitly revised purpose or outcome. Otherwise, the first lifecycle or coordination surface to see the boundary records `steering-in-progress`, marks a triggering named signal `reached`, and invokes `/steer-by-vision` once. When the projection already says `steering-in-progress`, carry that same boundary into the handoff without invoking it again. A closed milestone opens selection only when it is the named signal or leaves no active bet. A local implementation divergence remains route work inside the bet.

## Phase 2: Interpret Inside the Current Bet

Form a coherent account of the session by moving between the whole and the parts, while keeping the reconciled orientation fixed.

### 2a. Capture observable state

Run these commands — do not guess:

```bash
git status
git log --oneline -5
git branch --show-current
```

### 2b. Form the account

Review the conversation history through the Current bet and Immediate gate:

- How did the gate advance, constrain, or redirect the bet?
- What implementation validation arrived?
- What Organic proof appeared through ordinary use, and what proof remains pending?
- Which route assumptions changed without changing project purpose?
- What tensions remain inside the bet?

Tests, checks, and PR readiness are implementation validation. They count as Organic proof only when that maintenance or release experience is itself the Experienced outcome.

### 2c. Identify dangling threads

Use the **gap-reading** stance for threads that were started but not followed. Classify each one before deciding whether it belongs in the handoff:

- a route tension inside the Current bet;
- an already Kept-warm arc, paired with its return signal;
- a project-sized alternative to surface only when vision steering is open.

This classification keeps unfinished details visible without making every attractive alternative compete with the active bet.

## Phase 3: Triage Evidence and Tensions

The user's situated knowledge sharpens ambiguous meaning inside the bet. Because the user remains a bridge, focus on genuinely high-variance questions: whether observed behavior is the intended experience, whether evidence breaks the bet-to-outcome relationship, or whether the user is explicitly revising purpose or outcome.

Use diagnostic questioning and Socratic elicitation together. Reflect the current interpretation and ask one question at a time when the answer is hard to predict. Do not ask the user to reprioritize ordinary route tensions or choose among Kept-warm arcs during an active bet.

If an answer revises Vision or Experienced outcome, stop ordinary triage and enter the already-recorded `/steer-by-vision` boundary. Otherwise, keep the answer attached to the Current bet as proof, route evidence, a gate refinement, or a return signal.

The triage is complete when the evidence, route, and immediate gate form a coherent account inside the reconciled orientation and remaining high-variance questions are either answered or explicitly deferred.

## Phase 4: Draft

Write `/memories/repo/SESSION-TRAJECTORY.md` (using the memory tool) from the reconciled orientation and the account formed in Phases 2 and 3. The document should carry the bet's momentum without recreating project selection: the next agent can see what the project is for, what bet is active, what the session taught, and which exact gate resumes the work.

If a SESSION-TRAJECTORY.md already exists in repo memory, replace its stale projection and evidence with the current account.

## Phase 5: Validate

The next agent will act from this document. A read-only subagent reads the trajectory, every named orientation source, and the repo with fresh eyes. It checks:

- field-level agreement between Project Orientation and higher-precedence sources;
- whether the Immediate gate is grounded in current workspace state;
- whether implementation validation is clearly distinguished from Organic proof;
- whether Live tensions remain inside the bet and Kept-warm arcs retain return signals.

When a canonical source and trajectory disagree, report both observations, refresh the projection from the canonical source, and validate again. When the workspace disagrees with a route assumption, update the route evidence rather than project purpose. Return to collaborative triage only for genuine high-variance purpose or outcome judgment.

## Finalize

Update `/memories/active-handoffs.md` (user memory) with the current repo/branch/date/status.

Write a short prompt (≤5 lines) for the next session:

- What to read (SESSION-TRAJECTORY.md, SESSION-BRIEFING.md if it exists)
- What to pick up (the recorded Immediate gate, verbatim, or the already-open steering boundary)
- A request to restate and surface questions before proceeding

This prompt is the input to the `session-load` skill.

## Output

1. A `/memories/repo/SESSION-TRAJECTORY.md` (via memory tool)
2. An updated `/memories/active-handoffs.md` entry
3. A transition prompt (≤5 lines) delivered to the user

---

## Reference

### Build state rules

1. **If you ran a build or tests during this session** — report the results directly.
2. **If the workspace has an obvious build command** — run it now.
3. **If it's not obvious how to build/test** — use `vscode_askQuestions` to ask the user.
4. Record the results (or "not verified — user declined") in the Build State section.

### SESSION-TRAJECTORY.md template

```markdown
# Session Trajectory — [Date]

## Project Orientation

Source: [Primary source; compatible supplements when fields are mixed]

- Vision: [What the project is for]
- Experienced outcome: [What should become true in ordinary use]
- Current bet: [The selected smallest meaningful end-to-end bet]
- Organic proof: [Expected ordinary-use proof; pending or observed with evidence]
- Immediate gate: [The one bounded gate that currently has momentum]
- Kept warm: [Arc — return signal]
- Next steering signal: [Condition — signal: pending or reached; transition: idle or steering-in-progress]

## Status: [In Progress | Blocked | Ready for Review]

## What's Done

- [Completed item with file references]

## Evidence and Route Changes

- Implementation validation: [Checks, tests, review, or release readiness]
- Organic proof observed: [Ordinary-use evidence, or "pending"]
- Route changes: [Discoveries that changed how the bet advances]

## Live Tensions

[Unresolved meaning or route tensions inside the Current bet]

## Key Decisions

- [Decision]: [Rationale]

## Files Changed

| File         | Change      |
| ------------ | ----------- |
| path/to/file | Description |

## Git State

- Branch: [name]
- Last commit: [hash] [message]
- Uncommitted: [yes/no — list if yes]

## Build State

- Compiles: [yes/no/not verified]
- Tests: [pass/fail/not run]
- Known issues: [list]

## Gotchas

- [Thing that will confuse the next agent]

## What Your Previous Incarnation Investigated

[Optional — populated during subagent validation.
Records what the previous agent read, what it concluded, and
what it saw but didn't follow up on.]
```

### Tensions

**Purpose vs. route evidence.** Project Orientation follows its named sources and precedence. Workspace truth corrects the route and proof account without silently replacing purpose.

**Completeness vs. actionability.** The user is a bridge — they'll fill in nuances. Focus on trajectory and momentum over exhaustive detail.

**Interpretation vs. assumption.** The account forms inside the reconciled bet. Collaborative triage corrects high-variance meaning without routinely reopening selection.

### Things that silently break transitions

- Session memory (`/memories/session/`) gets cleared between conversations — trajectory belongs in repo memory (`/memories/repo/`)
- Strikethrough text (`~~wrong thing~~`) is still read and acted on by agents — delete wrong information and replace it
