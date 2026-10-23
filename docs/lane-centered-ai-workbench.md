# Lane-Centered AI Workbench

Status: thought experiment

This earlier product exploration retains its proposed coordination model. For
current plugin behavior, read [PER](../skills/workflows/per-cycle/SKILL.md),
[vision steering](../skills/workflows/steer-by-vision/SKILL.md), and
[thread coordination](../skills/workflows/thread-coordinator/SKILL.md).
Their later revisions allow responsibilities and coordination records to follow
the work rather than requiring this exploration’s phase or current-bet structure.

This document is a north-star implementation guide, not foundational doctrine.
It explores what a single coherent product could look like if the agent
framework in this repo and Exo were designed together from scratch for a more
general audience.

The design starts from one premise: agentic work is not a single linear stream.
It branches into changes, experiments, reviews, fixes, operationally parked
lanes, and project arcs kept warm for later selection. A general product should
make those branches visible and manageable instead of forcing them through one
active phase.

## North Star

Your project has durable memory, visible change lanes, and agents that work
inside the same project reality you see.

The user should be able to open a project and immediately understand:

- what experienced change the project is trying to create
- which current bet has momentum and what proof it seeks
- what changes are active
- which lane they are currently in
- which lane and goal own the Immediate gate
- what the agent is working on
- what needs review
- what is blocked
- what is ready to merge
- which valuable arcs are kept warm and what would bring them back
- what decisions and lessons will survive after the lane closes

The agent should be able to answer the same questions from tools rather than
from chat memory. The cockpit and the agent should be two views over the same
project state.

## Core Product Model

### Project

A project is the durable identity and state boundary. It owns the long-lived
story of the work:

- mission and product intent
- project orientation and its recorded source
- current-bet projection and kept-warm arcs
- durable decisions and RFCs
- project axioms and vision-selection rules
- global inbox and deferred ideas
- persistence policy: repo, shadow, or sidecar
- cross-lane history and lessons
- global cockpit state

Implementation direction:

- Derive project identity from the git common directory, preserving Exo's
  existing project/workspace split.
- Resolve project purpose first from explicit current user steering, then from
  the designated canonical project state. Coordination state and the latest
  user-confirmed trajectory are fallback projections, while live lane evidence
  calibrates the route rather than replacing purpose.
- Expose the current bet as a structured projection of that purpose rather than
  an independent source of it.
- Keep documents as documents: RFCs, research notes, design notes, and specs
  live on disk because their value is prose.
- Treat sidecar and shadow state as persistence policies for the same project
  identity, not as different product concepts.

### Current bet

The current bet is project-scoped structured steering state. It relates the
project's durable purpose to the execution surfaces that currently deserve
momentum:

- orientation source, Vision, and Experienced outcome
- Current bet and Organic proof
- one Immediate gate
- the lanes and PER-sized goals that advance that gate
- kept-warm arcs and the signal that would return each one to selection
- the Next steering signal

One bet may cross several lanes or goals, but one Immediate gate gives the work
a visible critical path. The other valuable continuations stay warm without
competing with bounded execution.

The current bet is a projection over existing project, lane, goal, and document
surfaces, not a new product entity. This relationship adds no `Bet` table, Exo
schema, or runtime contract.

### Lane

A lane is a branch/worktree/PR-sized stream of change. It is the primary unit of
active work.

For users, "lane" is the visible product word. A git worktree is the
implementation mechanism when the lane needs a separate checkout. A branch is
the version-control handle. A pull request is the public review artifact. The
lane is the product object that connects them.

A lane owns:

- source handle: issue, RFC, idea, user request, incident, or experiment
- workspace root when checked out
- branch name and base branch when known
- linked pull request and review state when known
- linked RFCs and decision state when known
- active goals
- task logs and progress messages
- validation status and CI status
- review comments and requested changes
- merge readiness
- parked or abandoned reason

A lane mirrors how it serves the current bet and Immediate gate. Project
selection remains at project scope; a lane owns the operational work that
advances the selected route.

Implementation direction:

- Lane identity should derive from project identity plus stable lane metadata:
  branch name, worktree root, PR number, or an explicit lane id.
- A linked worktree should resolve to the same project and a distinct lane
  focus.
- A project may have many open lanes at once.
- A current bet may link several lanes while routing one Immediate gate.
- One lane is usually focused in the current session, but the cockpit should
  show cross-lane pressure.

### Goal

A goal is a PER-sized unit inside a lane. It advances the current bet's
Immediate gate rather than selecting project purpose.

The goal is large enough that Prepare matters, small enough that Execute
produces one reviewable result, and meaningful enough that completion is visible
progress. Goals are where the agent framework and Exo's workflow model meet.

A goal owns:

- hypothesis and expected outcome
- relationship to the current bet and Immediate gate
- tasks for execution
- validation criteria
- user-facing completion evidence
- review result
- follow-up lessons or divergences

Implementation direction:

- Goals should live under lanes, not only under one global phase.
- A goal may produce commits, docs, or research. It does not always produce
  code.
- Goal completion should require evidence: validation, review, or an explicit
  user-accepted outcome. That completion evidence remains distinct from
  bet-level Organic proof unless ordinary use of the completed goal is the
  experienced outcome being tested.
- Review findings complete the goal, reopen it, or spawn a new bounded goal in
  the same lane while the bet remains active. A reached steering signal returns
  the accumulated evidence to vision steering before another goal is selected.

### Session

A session is one human-agent run inside a lane.

It owns the short-lived conversational and operational context:

- current user intent
- active tool availability
- recent observations
- immediate next move
- context pressure and handoff needs

Implementation direction:

- Agents orient in this order: project purpose and source, current bet, lane,
  goal, session.
- Session memory should never be the source of truth for project or lane state.
- Session lifecycle tools should preserve what the next session needs to resume
  the lane without reconstructing the whole project.

## Project Artifacts: PRs and RFCs

Lanes are where agents act. PRs and RFCs are how the project understands review
and decisions across lanes.

This distinction matters because real projects have more than one useful
projection of "what is going on." A user may want to see the active lane they
are working in, the list of open PRs waiting on review, and the RFCs that are
moving toward implementation. Those are not competing models. They are
artifact axes over the same project reality.

### Pull requests

A pull request is a review artifact. It may be produced by a lane, attached to
an existing lane, or kept alive after the lane leaves focus.

A PR owns or mirrors:

- public review URL and branch/base information
- CI state
- review state
- requested changes
- merge readiness
- linked lane or lanes
- last sync time

The lane is where the agent does implementation and repair work. The PR is the
review-facing artifact that explains whether that work can land. A lane can be
parked because its PR is waiting for review. Another lane can continue while
that PR remains active in the project cockpit.

### RFCs

An RFC is a design and decision artifact. It can precede a lane, guide a lane,
be proved by a lane, block a lane, or receive lessons after a lane closes.

An RFC owns or mirrors:

- stage and decision status
- problem statement and proposed direction
- implementation relationship
- linked lanes and phases
- open questions
- follow-up work
- last sync time

The lane is where the agent acts on a slice of the idea. The RFC is the durable
decision surface that says how the project is learning. Moving an RFC to a new
stage can create upcoming lanes, reshape active lanes, or show that a finished
lane changed the design.

### Artifact axes

Artifact axes are first-class views over project state:

- Lane view: what work is active, blocked, parked, or ready.
- PR view: what review artifacts are waiting, failing, changing, or ready.
- RFC view: what decisions are proposed, maturing, blocked, proven, or
  implemented.

The cockpit should let users switch between these views without losing the
links between them. A PR should explain which lane produced it. An RFC should
show which lanes are implementing or testing it. A lane should show which PRs
and RFCs explain why it exists.

## Reframing Exo's Current Model

Exo already has many of the necessary pieces: project identity, workspace roots,
worktree sharing, canonical SQLite state, sidecar policy, operational steering,
daemon surfaces, and goals as PER cycles. The missing product move is to make
lanes the core active-work object.

### Worktrees become lanes

Git worktrees are too obscure as a front-door product concept, but they are
exactly how agentic work wants to be structured. A worktree is a separate
workspace for one stream of change. That is a lane.

The user should see:

```text
Project: billing-service

Active lanes:
  OAuth cleanup          PR #184   review requested
  Token refresh spike    no PR     blocked on design question
  Hotfix: invoice total  PR #191   CI failing
```

The implementation can still use git worktrees. The product should talk about
changes, lanes, reviews, and readiness.

### PR flow becomes lane lifecycle

A pull request should not be a final command after "the phase." It is a
project-level review artifact that progresses through lane work when active
implementation or repair is needed.

Lane lifecycle:

1. **Proposed**: created from an issue, RFC, idea, incident, or user request.
2. **Prepared**: goals are sized and the first hypothesis is clear.
3. **Executing**: goals are being worked through.
4. **Reviewing**: a PR is open or a review artifact exists.
5. **Repairing**: CI or review comments require more work.
6. **Ready**: checks and review are good enough to merge or accept.
7. **Closed**: merged, abandoned, superseded, or parked.

The PR is the public artifact for reviewable lanes, but it is not the lane
itself. A PR can keep a lane parked while it waits for review, pull the lane
back into repair when CI fails, or close after the lane has already contributed
its lessons to project memory. Research or design lanes may close through
accepted documents instead.

### Sidecar, shadow, and repo policy become persistence choices

The persistence policy answers who owns the state, not what the work means.

- Repo policy: the team adopts the workbench and state travels with the repo.
- Shadow policy: the user keeps private local state for a repo that should stay
  clean.
- Sidecar policy: the user keeps private portable state outside the work repo.

In a lane-centered product, the policy applies to project and lane state
together. A sidecar-backed project can still have many lanes. The sidecar stores
portable lane projections, while live databases and runtime artifacts stay
machine-local.

### Phases become planning bands

Phases do not disappear, but they stop being the only active-work axis.

Possible roles for phases:

- release bands
- strategic themes
- onboarding stages
- cleanup campaigns
- epoch slices
- roadmap checkpoints

Lanes can attach to phases when that helps planning, but a project can have
several active lanes in different phases or no meaningful phase at all. The
cockpit should not imply that the whole project has one active phase unless the
project actually does.

## Implementable Layers

### State kernel

The state kernel owns structured truth. It should expose operations, not ask
agents or UI surfaces to hand-edit state.

Core entities:

- Project
- Lane
- Goal
- Task
- RFC reference
- Inbox item
- Validation run
- Pull request reference
- Review comment
- Artifact link
- Session checkpoint

The current bet is intentionally absent from this entity list. It is
project-scoped steering state that projects relationships among existing
entities and documents; the workbench can render and route from that projection
without introducing a new persistence identity.

Minimum lane fields:

```text
id
project_id
title
status
source_kind
source_ref
workspace_root
branch
base_branch
pr_url
pr_status
ci_status
active_goal_id
last_activity_at
parked_reason
closed_reason
```

Minimum PR reference fields:

```text
id
project_id
url
number
title
branch
base_branch
review_status
ci_status
merge_readiness
linked_lane_ids
last_synced_at
```

Minimum RFC reference fields:

```text
id
project_id
path_or_url
title
stage
decision_status
implementation_status
linked_lane_ids
linked_phase_ids
last_synced_at
```

Minimum lane operations:

```text
lane list
lane show <id>
lane focus <id>
lane create <title> [--source ...]
lane attach-pr <id> <url>
lane log <id> --message ...
lane park <id> --reason ...
lane close <id> --merged|--abandoned|--superseded
lane sync
```

Minimum artifact operations:

```text
pr list
pr show <id>
pr sync <id>
pr link-lane <id> <lane-id>
rfc list
rfc show <id>
rfc link-lane <id> <lane-id>
rfc mark-implementation <id> --status ...
```

The exact command syntax can evolve. The important contract is that lane state
and artifact state are first-class and queryable by agents, the cockpit, and
CLI users.

### Agent operating model

The agent framework contributes how the work is done:

- Recon investigates unfamiliar territory and returns grounded findings.
- Prepare forms specific, falsifiable hypotheses.
- Execute advances in bounded steps while reading instruments.
- Review compares prediction, execution, and result.
- Session lifecycle skills preserve continuity without pretending chat memory is
  durable truth.

Lane-aware agent orientation:

1. Read project purpose and its recorded source.
2. Read the current-bet projection.
3. Read lane state.
4. Read active goal state.
5. Inspect current workspace changes.
6. Ask the user only for situated judgment.

Agent grounding principles:

- Lane state is authoritative when it exists; branch names remain useful clues.
- Lane-aware PR state preserves the artifact relationship that a raw shell
  `gh` result cannot express by itself.
- Closing a lane records what happened and what should carry back to the project.
- When Exo tools are unavailable, lane and project claims remain explicitly
  unverified until an observable state surface is available.

### Vision steering

Vision steering is project-level selection. It reads candidate lanes, goals,
PRs, RFCs, and substrate through the relationship between project purpose and
experienced change, then selects the smallest meaningful current bet that can
produce Organic proof. It runs when no bet exists, the Next steering signal
arrives, evidence breaks the bet's relationship to its Experienced outcome, or
the user revises project purpose.

The selected bet gives several operational surfaces one shared direction. A
lane or goal can return evidence to this boundary, but it does not choose the
next project move on its own.

### Operational steering

Operational steering is the join between state and cognition inside the
selected bet. Every meaningful checkpoint returns scoped guidance.

Useful checkpoint commands:

- lane focus
- goal prepare
- task progress
- task complete
- goal review
- lane review
- lane sync
- lane close

Each response should include:

- what changed
- what is stale
- what validation says
- what user feedback is pending
- what the next safe action is
- whether the action needs human judgment
- whether the Next steering signal was reached

Operational steering stays scoped to the current bet. A task progress update
should surface relevant goal and lane concerns without dumping the whole
project. A lane review should surface PR comments, CI state, validation, and
evidence that may have reached the vision-steering boundary.

### Cockpit

The cockpit is the shared visual instrument panel. It is not a decorative UI on
top of tool data. For general users, it is the product surface that makes the
workflow feel lightweight.

Project cockpit should show:

- project orientation source, Vision, and Experienced outcome
- Current bet and Organic proof
- Immediate gate and Next steering signal
- kept-warm arcs and their return signals
- active lanes
- stale lanes
- blocked lanes
- lanes awaiting user review
- ready-to-merge lanes
- open PRs by review and CI state
- RFCs by stage and implementation relationship
- global inbox pressure
- recent project decisions
- cross-lane conflicts

Lane cockpit should show:

- current lane status
- relationship to the Current bet and Immediate gate
- branch/worktree/PR handles
- attached RFCs and PRs
- active goal
- goal progress
- validation health
- review comments
- CI state
- recent progress messages
- next operational action inside the Current bet

PR view should show:

- awaiting review
- CI failing
- changes requested
- ready to merge
- stale or parked
- linked lane and next repair goal when known

RFC view should show:

- by stage
- needs decision
- ready for implementation
- being proved by active lanes
- implemented
- orphaned or stale
- linked lanes and pending follow-up work

The user should be able to leave chat, look at the cockpit, and understand
where the work stands.

### Host adapters

The system should be host-neutral at the kernel and agent-contract layers.

Recommended order:

1. VS Code cockpit and language-model tools.
2. MCP/Codex plugin using the same command and state operations.
3. Local web cockpit for hosts with browser access.
4. Deeper app/resource UI only after host support is proven.

Adapters must not own project truth. They render and invoke the state kernel.

## Lifecycle Walkthroughs

### Start a lane from an issue, RFC, or idea

1. User says: "Work on preview readiness."
2. System relates the request to the Current bet. If no bet is active or its
   steering signal has arrived, vision steering selects the bet before lane
   work begins.
3. System proposes a lane:
   - title
   - source reference
   - branch/worktree name
   - initial goal
   - validation expectations
4. User accepts or edits.
5. System creates or attaches the workspace.
6. Agent runs recon or prepare before implementation begins.

Success condition: the user sees a new lane in the cockpit, and the agent can
read the same lane through tools.

### Run PER goals inside the lane

1. Prepare reads the steering context, lane, source material, and workspace.
2. Prepare sizes the next goal inside the Immediate gate and names failure
   conditions.
3. Execute works in bounded steps, logging progress to the lane.
4. Operational steering returns validation and user-feedback signals at each
   checkpoint.
5. Review compares expected and actual results, distinguishes implementation
   validation from Organic proof, and reports whether the Next steering signal
   arrived.
6. The goal is completed, reopened, or split while the bet remains active. A
   reached signal returns once to vision steering.

Success condition: goal progress is visible without reading the chat transcript.

### Open or attach a PR

1. The lane reaches a reviewable checkpoint.
2. The system opens or attaches a PR.
3. The PR description is generated from lane state, not from chat memory.
4. The lane records PR URL, base branch, CI state, and review state.
5. The cockpit moves the lane into review.

Success condition: the PR is a project artifact linked to a lane, not an
untracked external link.

### Park a lane while its PR waits

1. A PR is open and no implementation work is currently needed.
2. The system records the lane as parked with reason: waiting for review.
3. The PR remains active in the project PR view.
4. The lane leaves focus so other work can continue.
5. When review or CI changes, `lane sync` or `pr sync` reactivates the lane or
   proposes a repair goal.

Success condition: waiting on review does not make the lane disappear, and it
does not force the whole project to idle.

### Respond to review and CI

1. `lane sync` pulls review comments and CI state.
2. Operational steering summarizes what requires action inside the Current bet.
3. The agent creates repair goals for bounded fixes.
4. Execute addresses one repair goal at a time.
5. Review verifies the repair and updates the lane.

Success condition: review comments and CI failures become scoped lane work, not
ambient chat obligations.

### Advance an RFC through lane work

1. An RFC changes stage or decision status.
2. The system reads that change as evidence about the Current bet and shows
   whether it affects an active lane, reaches the Next steering signal, or only
   updates project planning.
3. If implementation or proof is needed, the system creates or links lanes.
4. Active lanes record which RFC questions they are answering.
5. Closed lanes roll decisions, evidence, and surprises back into the RFC or
   project memory.

Success condition: RFC progress changes the visible project plan without
pretending every RFC stage transition is active implementation work.

### Merge, abandon, or park the lane

Merge path:

1. Checks pass and review is accepted.
2. User approves merge.
3. Lane closes as merged.
4. Project memory receives the durable outcome, decisions, and follow-ups.
5. Linked RFCs receive implementation evidence or follow-up questions when
   relevant.
6. Review records whether Organic proof arrived and whether the Next steering
   signal was reached. A reached signal returns once to vision steering;
   otherwise operational routing resumes inside the Current bet.

Abandon path:

1. User or agent determines the lane should stop.
2. Lane records why it was abandoned.
3. Any reusable learning is promoted to project memory.

Park path:

1. Lane is not done but should leave focus.
2. Lane records a parked reason and restart condition.
3. Cockpit keeps it visible without treating it as active work.

Success condition: closed or parked lanes reduce confusion rather than hiding
unfinished state.

## Current Exo Gaps This Design Addresses

This thought experiment should not claim the current Exo implementation already
has first-class lanes. It does not.

Current source material:

- Exo already separates project identity from workspace roots.
- Linked worktrees already share project state and daemon.
- Workspace-active phase pins already acknowledge workspace-specific focus.
- Goals are already conceptualized as PER-sized.
- PR flow already appears in design material as a desired review artifact.
- Sidecar/shadow/repo policy already separates state ownership from identity.

Missing product concepts:

- first-class lane entity
- first-class PR and RFC artifact axes
- cross-lane cockpit
- lane-scoped PR and CI state
- lane-scoped review comments
- artifact views that show PR and RFC status across lanes
- lane lifecycle operations
- agent orientation that explicitly reads project, then lane, then goal
- a shared current-bet projection that links lanes and goals without becoming a
  separate entity
- state promotion from closed lane back into project memory

## How the Existing Repos Inform This

### `vscode-ai-plugin`

This repo contributes the agent operating model:

- stances for shaping cognition
- PER as hypothesis, experiment, and evaluation
- recon as grounded investigation
- synthesis and gap-reading for preserving understanding across work
- vision steering as project-level selection
- evidence discipline for agent reports
- quality rules for avoiding incoherent instruction stacks

In the combined system, this layer should remain responsible for how agents
think and collaborate. It should not own canonical project state.

### Exo

Exo contributes the project operating system:

- project/workspace/worktree identity
- canonical SQLite state
- state policy: repo, shadow, sidecar
- daemon and machine-channel surfaces
- operational steering and perception touchpoints
- cockpit/sidebar concepts
- RFC and decision records
- goals as PER cycles
- PR-as-review-artifact design pressure

In the combined system, this layer should remain responsible for durable
operational truth about the project and its lanes. Explicit user steering and
the designated canonical purpose surface remain authoritative for what the
project is for.

## Appendix: Source Strata

This design should be read as a synthesis of several layers of source material,
not as a replacement for them.

### Framework sources in this repo

- `FOUNDATIONS.md`: distributional mechanics, stances, generation vs.
  evaluation, information boundaries.
- `QUALITY.md`: practical criteria for writing skills, agents, instructions,
  and hooks.
- `docs/per-arc.md`: continuity across repeated PER cycles.
- `docs/exo-composition.md`: relationship between this agent framework and Exo.

### Agent mechanics in this repo

- `skills/workflows/per-cycle/SKILL.md`: preparation, execution, review, and
  the coordinator's responsibility for shaping delegated assignments.
- `skills/workflows/recon/SKILL.md`: grounded adaptive investigation.
- `skills/stances/hypothesis-forming/SKILL.md` and
  `skills/stances/hypothesis-evaluating/SKILL.md`: expectations that evidence
  can revise, and evaluation of what the comparison reveals.
- `agents/recon.agent.md` and `agents/recon-worker.agent.md`: investigation
  surfaces.

### Exo product and reference docs

- Start-here philosophy and north-star docs.
- State location and sidecar architecture docs.
- VS Code extension reference docs.
- Steering and perception docs.
- Phases, goals, and tasks docs.

### Exo RFCs

- Project/workspace/worktree split.
- Storage disposition and canonical state.
- Goals as PER cycles.
- Goal/task hierarchy.
- Codex/MCP integration.
- Durable MCP proxy and worker replacement.
- Mode-aware sidebar cockpit.

### Exo brainstorming and history

- User flows and companion analysis.
- Map north-star document.
- Push/PR flow notes.
- Phase-as-PR and PR-as-review-artifact sketches.
- Sidebar and shared-perception notes.

### Dogfood and memory-derived lessons

- Stale MCP or installed binaries can preserve old semantics after source code
  changes; lane tooling needs runtime identity and freshness checks.
- Sidecar import must verify the canonical writer and remote state before
  importing; portable state needs explicit ownership gates.
- Daemon/sidebar resync is a shared-perception problem, not just a transport
  problem.
- PR and dogfood workflows are review-facing artifacts and should be tracked as
  lane lifecycle state.

These lessons should inform implementation, but they should not make the
thought experiment sound like the current system already has all of these
capabilities.

## Non-Goals

- Do not rename every current Exo phase concept immediately.
- Do not require every lane to have a git worktree.
- Do not require every lane to have a pull request.
- Do not make sidecar mechanics user-facing unless the user is configuring
  persistence.
- Do not treat chat memory as authoritative lane state.
- Keep Current bet as project-scoped steering state rather than introducing a
  `Bet` entity or requiring an Exo schema/runtime change.
- Keep operational steering inside the selected bet and reserve vision steering
  for project-level selection.
- Do not promote this document into foundational doctrine until real use proves
  which parts hold up.
