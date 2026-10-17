# Exo Composition Brief

Status: exploratory

This note is a relationship brief, not foundational doctrine. It sits outside
`FOUNDATIONS.md` and `QUALITY.md` on purpose: those documents define the dense,
generative theory of this plugin. This note asks a narrower product question:
how does this agent framework compose with Exo when they are shipped and used
together?

## Working Thesis

`vscode-ai-plugin` shapes how the agent thinks. Exo gives that thinking durable
workspace state, operational steering touchpoints, and shared user-visible
instruments.

Together they form one coherent workflow:

1. The plugin creates stance-shaped cognition.
2. Exo anchors that cognition in project reality.
3. The agent acts through Exo-managed state and tools.
4. Exo's operational lessons feed back into better skills, agents, and quality
   criteria.

The composition is strongest when each project keeps its own center of gravity.
This repo should not become an Exo manual. Exo should not absorb this repo's
foundational theory as product copy. The join is a working relationship between
cognitive design and workflow instrumentation.

This note reserves **vision steering** for project-level selection: recovering
purpose, selecting a current bet, and reopening that selection when its named
signal arrives. **Operational steering** is checkpoint guidance inside the
selected bet: what changed, what evidence says, and which bounded action should
move next. Existing Exo surfaces may use `steering` as a product or response
name; this vocabulary describes the role that guidance plays in the combined
workflow.

## Four Relationships

### Cognition and state

This repo treats agent customization as cognitive design. Skills and agents
create stances: recon follows leads, prepare forms falsifiable hypotheses,
execute advances while reading instruments, review evaluates the gap between
prediction and result. The quality target is coherent agent behavior.

Exo treats the workspace as the collaboration boundary. It stores project state,
phase position, goals, tasks, RFCs, inbox signals, verification results, and
operational steering in a form that both humans and agents can read. The quality
target is coherent project reality.

The relationship is simple: the plugin gives the agent a mind for the work; Exo
gives that mind a durable world to operate in.

### PER and Exo goals

The plugin's PER cycle separates prediction, action, and evaluation:

- Prepare forms the hypothesis.
- Execute tests it against the workspace.
- Review calibrates the result.

Exo's goal model gives that loop a bounded execution container. Exo docs
describe a goal as PER-sized: large enough that review matters, small enough
that execution produces one coherent artifact, and meaningful enough that
completion is visible progress.

The current bet sits at project scope above any one goal. It is a structured
steering projection that relates Vision and Experienced outcome to Organic
proof, an Immediate gate, and a Next steering signal. It may connect several
lanes and PER-sized goals while giving one gate momentum. This relationship
does not require a new `Bet` entity or an Exo schema change.

That makes an Exo goal the natural runtime unit for `/per-cycle` as it advances
the Immediate gate, or a bounded part of that gate. The plugin keeps the
cognitive separation crisp, while Exo keeps schedule, state, logs, and
completion evidence legible across sessions and worktrees. Goal completion
evidence remains distinct from organic proof unless the completed maintenance
or release experience is itself the outcome being tested.

### Shared perception

This repo names the information-boundary problem: observable state should be
observed through tools, shared perception should align agent and user concepts,
and situated judgment should be resolved collaboratively.

Exo implements much of that boundary as product surface. Its operational
steering responses, sidebar/cockpit surfaces, status and task reads, task logs,
validation output, inbox signals, and MCP text all turn project reality into
perception touchpoints. The agent does not have to infer as much from chat
memory, and the user does not have to answer as many questions about facts the
workspace already knows.

The important product test is not just "can the agent read the data?" It is
"does the human and agent share the same picture of what is happening?" When Exo
exposes progress visually and through tool responses, it moves more information
from fragile inference into shared perception.

### Shipping together

This plugin should treat Exo as an available workflow substrate when Exo tools
exist, and as a design influence when they do not.

In the VS Code target, serious agents already include the `exo` tool group. That
means recon and recon-worker can ground
their work in Exo state when the host exposes `exosuit.exosuit-context/exo-run`.

In the Claude Code target, the `exo` tool group is currently empty. Until that
runtime path exists, Exo still informs the framework, but it is not a tool the
agents can depend on there.

This distinction should stay explicit. Exo-aware agents should fail closed when
Exo state is unavailable: do not claim current phase/task truth from memory, and
do not silently treat raw shell access as equivalent to the integrated Exo
surface. Use the local repo and available tools, then mark Exo-derived claims as
unavailable when the Exo tool path is absent.

## Current Integration Contracts

The Exo repo is already carrying the concrete integration contracts. This note
should point to them rather than duplicate them:

- `wycats/exo2:docs/rfcs/stage-0/10193-codex-integration-and-cockpit-adapter.md`
  defines the Codex/plugin/cockpit relationship and the host capability matrix.
- `wycats/exo2:docs/rfcs/stage-0/10187-cli-shaped-exo-run-mcp-transport.md`
  defines the CLI-shaped MCP transport and near-term `exo-help`, `exo-read`, and
  `exo-write` direction.
- `wycats/exo2:docs/rfcs/stage-0/10190-durable-mcp-proxy-and-hot-swappable-worker.md`
  defines the durable MCP proxy and worker replacement architecture.

Those RFCs own the MCP and product contract. This repo owns the agent framework
and quality criteria for using that contract well.

## Implications for This Repo

- Keep foundational documents focused on distributional mechanics, stances,
  information boundaries, and quality principles.
- Let design notes like this one explore composition with external workflow
  systems before promoting anything into core doctrine.
- Treat Exo as the preferred observable state surface for PER-sized work when
  the Exo tool is available. It becomes authoritative for project purpose only
  when the repo or user designates that project state as canonical.
- When a canonical project-state surface exists, reconcile the current-bet
  projection with it. Live Exo state supplies evidence about the route rather
  than silently replacing project purpose.
- Preserve graceful degradation: skills and agents should remain useful in hosts
  where Exo is unavailable.
- Use Exo dogfood findings as evidence for future quality criteria when they
  reveal a recurring agent failure mode, especially around stale state, shared
  perception, or tool/runtime drift.

## Implications for Exo

- Exo can use this repo's stance vocabulary to make agent-facing guidance less
  procedural and more cognitively precise.
- Exo's operational steering and cockpit design should keep distinguishing
  observable state from situated user judgment, because that distinction
  preserves the user's collaboration budget.
- Exo goals being PER-sized is a strong bridge: it gives agents a concrete unit
  for hypothesis, execution, review, and completion evidence.
- Exo should keep the LM-tool and cockpit surfaces product-grade, because those
  surfaces are where this repo's cognitive framework meets live workflow state.

## Non-Goals

- Do not turn this note into a second philosophy document.
- Do not copy Exo command documentation into this repo.
- Do not require Exo for every skill or target host.
- Do not introduce a `Bet` entity or require an Exo runtime or schema change for
  this composition. The current bet remains a project-scoped projection over
  existing canonical surfaces.
- Do not treat the current MCP surface as final; follow Exo's RFCs and dogfood
  evidence as they evolve.
- Do not promote this note's exploratory model into foundational doctrine until
  repeated use reveals a stable contract worth canonizing.
