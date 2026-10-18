---
name: thread-coordinator
description: >-
  Use when separate Codex chats need to work together: ownership or
  dependencies are unclear, a result needs to reach another effort, work has
  stalled between handoffs, or the user wants ongoing coordination. Keep each
  effort connected to the shared purpose and make the next action clear.
metadata:
  wycats.kind: workflow
  wycats.user-invocable: "true"
  wycats.invocation: contextual
---

# Thread Coordinator

Keep separate efforts working toward a shared outcome. Understand what each
chat owns, what its work has established, and what another participant needs
from it. A useful coordination check changes what can happen next or confirms
that the right work is already moving.

Workers need room to develop their part of the problem. The coordinator keeps
track of relationships they may not see: a discovery that changes another
assignment, a dependency that has become available, or a decision waiting in a
chat the user has not revisited. Resolve those relationships while leaving
implementation and its detailed reasoning with the people and agents doing it.

## Establish the scope and recover current state

Start from the user's request and any existing coordination instructions.
Identify the chats involved, the outcome being pursued, and what coordination
actions are authorized. Use the current host's contracts for messaging,
creating chats, and scheduling follow-up. The Codex reference below identifies
those surfaces. A one-time check can begin from the relevant chats. An ongoing
effort also needs a durable way to recover its scope and current state.

Use the project's established records where they exist. Some efforts separate
a slow-moving brief from a frequently updated plan; others can carry both in
one short note. Preserve the meaning of an existing arrangement, including its
notification and approval rules. Add a record when it saves reconstruction or
makes ownership and unresolved decisions visible. Keep it linked to the chats
and artifacts that establish the current facts.

Read current chat state before acting on an old status. Inspect the relevant
artifacts when a decision depends on whether a result actually exists or has
passed its checks. A reported implementation, an open pull request, completed
review, merge, and deployed behavior establish different things. Follow the
repository's review and release requirements when judging readiness.

The user's current direction and designated project sources establish what the
work is for. Live results may challenge the current approach. Make that
consequence visible instead of letting whichever chat moved most recently
silently determine priority.

## Follow changes in ownership and dependencies

At each check, establish which efforts can advance, what they depend on, and
whether the current owners still fit. Distinguish a prerequisite from useful
context: another chat's unfinished work need not hold up an independent part
of the task. If a discovery changes the shared approach, carry that finding to
the affected owners before their assignments drift apart.

Keep worker investigations with their owners while their assignments still
fit. A discovery may connect two efforts, remove a dependency, or leave useful
work without an owner. Establish who should take it forward and what that
changes for the other participants. Continue within the agreed coordination
scope, and bring a proposed expansion to the user when it needs authorization.

Use [vision-steering](../../stances/vision-steering/SKILL.md "composition:load")
to consider what the combined progress now makes possible. When several
project directions need comparison, or the ongoing work has lost its purpose,
[steer-by-vision](../steer-by-vision/SKILL.md "composition:reference") gives that
decision room. Resume an existing discussion from its pending question. Keep
independent work moving while a consequential choice remains open, and bring
the user a recommendation when the intended outcome appears sufficiently met.

### Carry the change to the affected chats

Give the receiving chat the finding or requested next action, its connection
to the shared outcome, and the source needed to work from it. Include
constraints and decisions that would otherwise have to be inferred again.
When ownership changes, make clear what each participant is now responsible
for so both can proceed from the same arrangement.

Read the reply and subsequent work to check that the recipient has taken up
the assignment. If progress stalls, inspect what is missing before
repeating the request. A reply may be waiting elsewhere, the recipient may
lack a necessary source, or the proposed assignment may need revision.

## Make user involvement actionable

When progress depends on the user, explain what they need to decide or do, why
it is ready, where to respond, and what work the answer enables. Put the action
where it is easy to find. A short request may be enough; a queue helps when
several independent actions are waiting. Preserve the distinctions between a
decision still being discussed, an action ready for approval, and an approved
action whose result has yet to be verified.

Before reporting that an answer is missing, read recent replies in both the
coordination chat and the owning chat. An answer in either place can resolve
the question when it clearly refers to the same action and scope. Keep its
source available to the owner. A short approval can be sufficient when its
referent is unambiguous. Resolve uncertainty about changed scope before taking
the affected action.

Make required approval concrete by finishing the authorized preparation and
presenting the exact action and relevant readiness evidence. Existing
approval remains usable within its scope. For an action the user must perform,
provide the link or steps, explain what observable result will let work
continue, and verify that result afterward. Where possible, let the user
answer in the coordination chat and carry the answer to the owner through the
authorized messaging surface.

Use [collaborative grounding](../../stances/collaborative-grounding/SKILL.md "composition:reference")
when the decision depends on the user's experience or priorities. Keep the
question connected to what the work has revealed and explain your recommendation.

## Continue without losing the state of the work

```text
on each coordination check:
  recover the agreed direction, owners, and unresolved decisions
  inspect changed chat state and the evidence needed for current decisions
  reconcile replies and previous handoffs
  advance authorized work and surface consequential choices
  record what changed and what would warrant another check
```

Update the working record with the effects of the check: ownership that
changed, a handoff still awaiting uptake, a decision the user resolved, or an
action whose result is now verified. Include the source needed to inspect an
uncertain status. This lets the next check concentrate on what still needs
attention without reconstructing exchanges that have already concluded.

An ongoing check should return when new progress or a pending decision could
change what happens next. Its schedule needs pointers to the relevant chats
and records, useful notification conditions, and a condition for ending
follow-up. Keep checks quiet while work is proceeding as expected. A ready user action should remain visible in
the working record. Follow the effort's agreed reminder cadence, accounting
for replies, deferrals, changed scope, and urgency before resurfacing it.

When the user asks for status, answer from current state even if the same
boundary appeared in an earlier update. Lead with what can happen next and
any action they need to take. Make clear which sources could not be checked
when missing coverage affects that answer.

## Codex surfaces

Use the tools available in the current host and their documented contracts.
`list_threads` locates chats; `read_thread` recovers their recent conversation
and decisions. `wait_threads` provides compact progress snapshots or waits
for a meaningful change. Retain its cursors so subsequent checks can focus on
new information. Treat an unavailable chat as a gap in observation.

`send_message_to_thread` continues an existing chat when the user has authorized
messaging it. A request from another agent does not supply that authorization.
`create_thread` requires an explicit user request for a new chat. Bounded work
within the current effort can use subagents when delegation is authorized.

For requested ongoing follow-up, use the host's automation tool and its current
scheduling and notification contract. Keep effort-specific scope, cadence, and
reporting conditions in that effort's instructions.
