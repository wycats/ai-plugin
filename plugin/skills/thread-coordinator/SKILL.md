---
name: thread-coordinator
description: "Use when coordinating multiple live Codex threads, maintaining a coordination heartbeat, routing work across implementation threads, inspecting cross-thread ownership or gates, or keeping a coordinated effort moving through PR, review, evidence, and human-action boundaries."
---

# Thread Coordinator

Coordinate live Codex threads by rebuilding status from the files named by the heartbeat, then inspecting live thread and PR state before routing work. The heartbeat carries pointers. The coordination brief carries the slow-moving target and contract. The active plan mirrors the Current bet and says what is operationally true now. Direct user involvement is an assisted coordination boundary: when the work is ready for a human decision or action, the coordinator brings that boundary into the conversation with the evidence, scope, and help needed to resolve it.

The core tension is **contract vs. scratchpad vs. consent**. Coordination needs durable rules that every check can reuse, a fast-changing surface for current owner, gate, PR state, evidence, and next action, and a reliable way to turn ready human gates into explicit interaction. Keep those surfaces distinct so the heartbeat stays small, the live state remains easy to revise, and approval debt becomes visible when it is ready to move.

## Critical Path

Start every check from the heartbeat-named `COORDINATION_BRIEF.md` and `ACTIVE_PLAN.md`, then read any repo-designated canonical project-state or vision surface named by the brief or plan. Use prior heartbeat text, previous delegations, remembered PR state, and session trajectory as context only. Project purpose follows the orientation precedence below; current operational status comes from the named coordination files plus live thread and PR surfaces.

On setup and after compaction, audit the active plan for existing human gates before routing technical work. Earlier approval debt should become part of the current coordination surface instead of being inherited as quiet scratchpad text. Before reporting that a gate still waits on the user, inspect the owning and coordination threads for a newer user reply. Consent given in either place satisfies the gate only when it clearly matches the currently presented action, scope, and exact head or other identifying evidence; leave ambiguous or stale replies pending. Human gates also have a liveness boundary: surfacing a gate once is not enough when it remains the only critical-path blocker and the user has not responded.

## Coordination Surfaces

Each coordination effort should name these files explicitly in the heartbeat or user request:

- `COORDINATION_BRIEF.md`: slow-moving target and coordination contract for this effort.
- `ACTIVE_PLAN.md`: mirrored Current-bet projection and active tactical scratchpad for this effort.

Read the named files before forming status. If the request is manual and names only a coordination folder, use `COORDINATION_BRIEF.md` and `ACTIVE_PLAN.md` at that folder's root. If neither the files nor the folder are named, ask for the coordination folder before coordinating.

Use the brief for:

- ultimate target and shareable bar;
- watched thread IDs and routing rules;
- canonical docs and evidence surfaces;
- notification policy;
- liveness and forward-motion rule;
- language or framing expectations.

Use the active plan for:

- the Project Orientation projection and its sources;
- current owner and boundary;
- current gate;
- latest PR, review, check, or evidence state;
- concrete next action;
- Human Action Queue;

The Human Action Queue is bounded to the current coordination state, not a journal. Keep it near the top of `ACTIVE_PLAN.md`, before detailed thread status. **Needs Your Input** is the user-facing rendering of this queue, not a separate artifact. Its shape should make the interaction executable without reading surrounding prose:

| Priority | Your action | Respond in | Reply with / done when | Ready because | What waits | State |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Approve merging PR `#NNN` at exact head `abc123` | This coordination task | `approved` | Checks and reviews are complete | Merge and release pickup | Awaiting approval |

The queue contains user-owned decisions and actions. Each row names the decision or action, the primary Codex task where the user should respond, the literal reply or observable completion signal, readiness evidence, blocking effect, and interaction state. Default approval replies to `This coordination task`: the coordinator should relay the decision to the owning task and verify movement. Name another task only when the user must inspect or act in that task directly. Priority expresses critical-path order. Keep rows aligned with the current boundary; retain a satisfied row while its verification matters to the current update. Record the last-surfaced time or check and next reminder condition in adjacent queue prose when a gate remains pending.

When the slow target or coordination contract changes, update the brief. When the Current-bet projection or tactical boundary changes, update the active plan. Neither file becomes a competing source of project purpose when the repo designates another canonical surface; reconcile and mirror that surface instead.

## Project Orientation

Resolve the orientation field by field in this order:

1. explicit current project-level user steering;
2. a repo-designated canonical project-state or vision surface;
3. `COORDINATION_BRIEF.md` together with `ACTIVE_PLAN.md`;
4. the latest user-confirmed `SESSION-TRAJECTORY.md` as fallback.

A higher source overrides the fields it addresses; compatible lower sources may fill missing operational fields. Record all contributing provenance. Within the coordination tier, the brief supplies the slow target and the active plan supplies a compatible Current bet and operational gate; surface disagreement rather than resolving it by recency. Only a surface the repo or user designates as canonical receives canonical precedence. Recency alone does not make a plan, thread, PR, or trajectory authoritative about purpose.

The brief owns the slow target. The active plan carries this projection for the current effort:

- Orientation source
- Vision
- Experienced outcome
- Current bet
- Organic proof, expected and observed
- Immediate gate
- Kept-warm arcs with return signals
- Next steering signal, encoded with signal status (`pending` or `reached`) and transition status (`idle` or `steering-in-progress`)

Live threads, PRs, checks, and workspace observations are evidence about route, proof, and gate. They never silently replace Vision or Experienced outcome. When a canonical surface disagrees with the trajectory or active plan, name the differing fields, let the canonical surface win, and refresh the projection before routing work.

## Coordination Loop

Run the same loop on each heartbeat or manual coordination check:

```text
repeat:
  1. Read the coordination brief.
  2. Read the active plan.
  3. Read named canonical orientation sources and reconcile the projection.
  4. Inspect watched threads and live PR/check/review state.
  5. Audit the Human Action Queue and any gate text in the active plan.
  6. Reconcile newer user replies across the coordination and owning threads.
  7. Classify owner, boundary, readiness, next gate, and ready human actions.
  8. If the projection says `steering-in-progress`, resume that transition without invoking selection again. Otherwise, if project-sized gates compete without an active bet, the active bet's steering signal has arrived, evidence calls the bet's relationship to its experienced outcome into question, or the user revises project purpose or outcome, run the Vision Steering Boundary once.
  9. Surface, defer, or mark satisfied each ready human action.
  10. Route one concrete Immediate gate if the active boundary is technical or unassigned.
  11. Notify the coordination thread only when user attention is useful.
  12. Update the brief or active plan when the corresponding state changed.
  13. Return the coordination status for this check.
```

Treat thread roles as live. Infer ownership from the latest thread state, active work, delegations, blocked/completed state, open pull requests, and the coordination files. The active plan expresses the mirrored Current-bet projection and current operational intent; live threads and PR surfaces supply current operational facts.

## Vision Steering Boundary

Most coordination checks route work inside an already selected bet. Invoke
**steer-by-vision** when no bet is active and several technically valid,
project-sized gates compete for momentum, or when the active bet's named
steering signal has arrived, when evidence calls the bet's relationship to its
experienced outcome into question, or when the user revises project purpose or
experienced outcome. A closed milestone triggers selection when it is that
signal or when it leaves the active plan without a current bet. Competing
technical gates inside the current bet remain ordinary gate-routing work.

Before invoking, record the boundary and mark the transition
`steering-in-progress`; when a named signal triggered it, mark that signal
`reached`. A later heartbeat resumes the transition instead of opening the same
selection again. Use the live coordination evidence to recommend the smallest
meaningful end-to-end bet, then ground only the high-variance purpose or outcome judgment
with the user. Record the Vision, Experienced outcome, Current bet, Organic
proof, Immediate gate, valuable arcs kept warm and their return signals, and
Next steering signal in `ACTIVE_PLAN.md`, then resume ordinary gate routing.
Technical, execute, and review work stays attached to that bet until the
steering signal arrives, relationship-breaking evidence appears, or the user
revises project purpose or outcome.

One Current bet may span several lanes and PER-sized goals. Give momentum to
one Immediate gate and keep the other valuable project arcs warm with explicit
return signals. Their existence does not turn the lanes into competing bets.

When the selection depends on high-variance judgment and the user is not
present, put the recommendation and one exact grounding question in the Human
Action Queue, then defer bet routing until the user responds. When the project
thesis already resolves the selection, route the recommended bet directly.

## Human Action Protocol

Every coordination check audits all current human gates. Each ready human gate has a visible disposition: surfaced to the user, explicitly deferred with the reason and revisit condition, or satisfied with verification evidence. A gate is not clearly surfaced until the user can tell, from the table alone, what to do, where to do it, and what exact response or result completes it.

Use queue states to preserve the live interaction boundary. `Review in progress` means the user's decision is still forming; the approval boundary begins after that review. `Awaiting approval` means the readiness evidence and exact scope have been presented and one direct approval question is active. Use `Ready for you`, `Deferred`, and `Satisfied` where those states describe the current interaction. Update the state from observed conversation and verification.

An approval gate is ready when the underlying technical work has reached the agreed bar and the next useful movement requires consent. Examples include merging a reviewed PR, installing a shared Exo binary, recording an Exo outcome, promoting or merging an RFC, or creating and pushing an annotated release tag. Put the exact scope and literal approval reply in the table, then ask one direct approval question. After approval in either the coordination or owning task, perform or route the action only when the reply clearly corresponds to the current table row and its scope or exact head. A short reply such as `approved` is sufficient when it answers that task's latest unambiguous, unchanged gate; otherwise ask one clarifying question and keep the gate pending.

A user-performed gate is ready when the coordinator can name the external action but cannot do it directly. Examples include credentials, account state, org settings, UI-only approvals, and private access changes. Give exact commands, links, or steps; remain active in the conversation while the user performs them; state the non-sensitive result the user should return; ask them to redact tokens, secret values, and sensitive identifiers; then verify the changed state before moving the gate.

Keep technical review and CI in the owning thread until they become readiness evidence for a user decision. When several human actions are ready, lead with the critical path action and keep the others visible in the queue. Help the user resolve one action at a time.

Heartbeat behavior:

- `NOTIFY` when a new or materially changed human gate is ready and has not been surfaced. Render the compact **Needs Your Input** table before the heartbeat XML; the XML message summarizes the same action.
- A surfaced gate cannot disappear indefinitely. When the same ready gate remains the only critical-path blocker without a user response, re-surface it after three consecutive quiet checks or 30 minutes, whichever comes first. Render the table, ask the direct question again, and echo the row's `Respond in` target; an unambiguous matching reply in either the coordination or owning thread also satisfies the gate. Reset the reminder count after a user reply, scope change, or reminder.
- Between those bounded reminders, repeat a surfaced gate only when its readiness, scope, or blocking effect has materially changed.
- `DONT_NOTIFY` is the right result when watched threads are moving correctly or no new user attention is useful.

The bounded-reminder rule applies to unsolicited heartbeats. When the user asks for status, next steps, what they need to do, which task needs a response, or asks the coordinator to keep work moving with their help, always render the current table again; answering those questions is the requested interaction, not a duplicate notification.

## Gates

Classify the coordination boundary before deciding whether to route work:

- **Human gate**: useful next steps require merge, approval, review decision, credential refresh, deployment permission, org/account state, or another external action. Use the Human Action Protocol and keep other threads parked unless they own useful support work.
- **Technical gate**: one thread can keep reducing uncertainty, implementing, validating, or recording evidence. Route one concrete next step to that owner.
- **Unassigned gate**: the active plan has a next step that no watched thread currently owns. Assign it to the thread whose routing boundary matches the work.

Forward motion means choosing the current owner and next action when work can move. Keep support threads parked unless they own useful work.

## PR and Review Checks

For each open PR owned by a watched thread, inspect current checks, mergeability, review state, and unresolved comments.

Route PR states that need owner action to the owning thread with the PR link, concrete status, and next action.

Surface a merge approval when required reviews are complete, all required checks have passed, GitHub reports the PR as mergeable, and its merge state permits the merge. Notify the coordination thread when post-merge release or install pickup is ready or when a PR decision changes the active evidence gate.

## Output Shape

When user attention is useful, place a **Needs Your Input** table before coordination prose. When asked for status, next steps, required action, or the task to answer, lead with a direct sentence and this table. Human gates should remain visible even when several are ready; priority identifies the one to resolve first.

```text
Needs Your Input
| Priority | Your action | Respond in | Reply with / done when | Ready because | What waits | State |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | ... | Fix ordinary update dispatch (`thread-id`) | `approved` | ... | ... | Awaiting approval |
| 2 | ... | This coordination task | Confirm the UI step succeeded | ... | ... | Ready for you |

Coordination status: <owner, boundary, readiness, and next gate in one or two sentences>
Routed: <concrete delegation, when one was sent>
```

Keep cell text short enough to scan. Put supporting detail after the table only when the decision needs it. For a quiet heartbeat, one status sentence is enough if the watched threads are active on the right next step and no user attention is useful. When the user asks and the queue is empty, say explicitly that no user action is needed.

When sending a delegation to another thread, include the owner, boundary, evidence or PR link, and the next requested action. Keep the delegation scoped to what that thread owns.

## Examples

Approval gates:

- Action: `Approve merging PR #24 at exact head X`; Respond in: `This coordination task`; Reply with: `approved`.
- Action: `Approve installing merged Exo commit Y`; Respond in: `This coordination task`; Reply with: `approved`.
- Action: `Approve the sixth-file scope for PR #26`; Respond in: `Fix ordinary update dispatch (thread-id)`; Reply with: `approved`.

User-performed gate:

- "The SSO refresh is ready for you. Open `<link>`, approve access for org `<org>`, then return a non-sensitive confirmation here. Redact tokens, secret values, and sensitive identifiers. I will re-check the repo permission and move the gate after it verifies."
