# vscode-ai-plugin

An agent toolkit for VS Code Copilot, Claude Code, Codex, and Pi, grounded in a theory of how language activates reasoning in language models.

## What this is

This repo is a working agent plugin for VS Code, Claude Code, Codex, and Pi. Its
canonical resources are projected into the capabilities each host provides;
not every host activates every resource type. The repo is also the testbed for
a framework about *how to write good agent customizations*, and a vocabulary
of reusable patterns that make those customizations work.

The framework and the practice evolved together. Each skill we built refined the theory, and each theoretical insight improved the skills.

## The core idea

Language models generate text by navigating a probability landscape. Every piece of context reshapes that landscape: the system prompt, the skill instructions, the conversation history, the user's message. Some contexts create broad, shallow valleys where many outputs are plausible (generic prose, mediocre code). Others create narrow, deep wells where the output is precise and coherent.

A **stance** is a consistent set of relationships between the writer, the content, and the reader that creates a well. "The reader is a senior engineer" is a stance. "Every sentence must advance the argument" is a stance. Each one pulls the model's output toward a specific region of the probability landscape.

The practical question for skill design is always: **does each instruction deepen the same well, or does it create a competing well?** Instructions that reinforce each other produce precise, coherent output. Instructions that compete produce confused or stilted output.

This idea has consequences for how skills should be written: described honestly rather than prescriptively, using tensions rather than rules, separating generation from evaluation. [FOUNDATIONS.md](https://github.com/wycats/vscode-ai-plugin/blob/main/FOUNDATIONS.md) develops the full framework. [QUALITY.md](https://github.com/wycats/vscode-ai-plugin/blob/main/QUALITY.md) translates it into practical principles.

The framework preserves stable relational invariants across situated
projections. A stance owns the canonical articulation of an invariant; skills
compose stances into workflows, agents crystallize them into cognitive modes,
and runtime builds adapt their envelopes and activation surfaces without
becoming new sources of meaning.

The same selection problem appears at project scale. **Vision steering** selects
the current bet by relating candidate work to a durable project thesis and an
experienced outcome. **Operational steering** is narrower checkpoint guidance:
it keeps lanes and PER-sized goals moving inside that bet. The current bet is a
project-scoped steering projection that can connect several work surfaces; it
is not a separate workflow entity.

## Concept map

The repo has two kinds of documentation: foundational theory that explains why the plugin is written this way, and design notes that explore emerging workflow concepts before they become skills.

- [FOUNDATIONS.md](https://github.com/wycats/vscode-ai-plugin/blob/main/FOUNDATIONS.md) — distributional mechanics: probability landscapes, stances, information boundaries, generation vs. evaluation, and selection across timescales.
- [QUALITY.md](https://github.com/wycats/vscode-ai-plugin/blob/main/QUALITY.md) — practical principles for writing skills, agents, instructions, and hooks from those mechanics.
- [docs/canonical-resources-and-runtime-projections.md](https://github.com/wycats/vscode-ai-plugin/blob/main/docs/canonical-resources-and-runtime-projections.md) — semantic authority across stance, workflow, project-state, and runtime projections.
- [docs/curated-upstream-subset-consumption.md](https://github.com/wycats/vscode-ai-plugin/blob/main/docs/curated-upstream-subset-consumption.md) — host-neutral downstream selection, dependency closure, provenance, and honest projection across every supported target.
- [docs/per-arc.md](https://github.com/wycats/vscode-ai-plugin/blob/main/docs/per-arc.md) — lightweight reference note for preserving current-bet orientation and evidence across repeated PER cycles.
- [docs/exo-composition.md](https://github.com/wycats/vscode-ai-plugin/blob/main/docs/exo-composition.md) — exploratory brief for how stance-shaped cognition composes with durable project state and operational steering surfaces.
- [docs/lane-centered-ai-workbench.md](https://github.com/wycats/vscode-ai-plugin/blob/main/docs/lane-centered-ai-workbench.md) — thought experiment for a workbench where project vision, a current bet, visible lanes, and PER-sized goals share one project reality.
- [docs/setup.md](https://github.com/wycats/vscode-ai-plugin/blob/main/docs/setup.md) — configuration, local registration, and build setup details.

## Stances

When writing a skill, you're choosing *how the agent should think about the task*. We've found that certain collaborative patterns recur across different skills, and naming them makes them composable. The `stances/` directory contains these named patterns:

**Collaborative grounding** is the most fundamental. The agent has perception (tools, files, search) and superhuman breadth across all of human expression. The user has situated knowledge: intent, priorities, energy, the state of the world beyond the screen. Neither perspective is sufficient alone. Good collaboration combines both: the agent shares what it sees, the user contributes what the agent can't access.

**Authorial continuity** makes the author easier to hear in agent-assisted writing. The author remains present through the judgment the communication carries and the way it addresses its readers. The agent drafts from available evidence, and the author shapes what the communication says and its exact words through participation in those relationships and direct contact with the concrete situation.

**Relational continuity** keeps language attached to the work underway so later turns, summaries, and handoffs inherit usable orientation. Its skill description is intentionally ambient; the loaded stance deepens compact reminders like "let's focus on what we're doing" and "let's use precise and meaningful language."

**Vision steering** holds a durable project thesis while evidence changes the route. It treats plans, tasks, pull requests, and infrastructure as hypotheses about how to produce an experienced outcome, then selects the smallest meaningful bet that can generate organic proof.

**Public design reasoning** shapes durable proposal prose for RFCs, architecture notes, and canonization summaries. It treats sections as reader contracts: each heading matters because of the work it does for users, implementers, maintainers, educators, and future readers.

**Reader orientation** starts from what someone can know where they encounter
code, an interface, or an explanation. It supplies the relationships needed to
reason locally, with deeper detail available through deliberate investigation.
The implementation-quality skill applies this stance to a codebase's flow,
types, organization, and documentation.

**Joint reading** is what happens when two people examine code or a document together. The agent sees structural patterns; the user sees design intent. The walkthrough skill uses this stance.

**Diagnostic questioning** is asking the right question at the right time. The one that maximally reduces uncertainty about the user's priorities. High-variance questions (where the agent genuinely can't predict the answer) come first, because their answers often resolve lower-variance questions implicitly. The session-rest skill uses this during triage.

**Socratic elicitation** shapes *how* to ask: reflecting back the agent's understanding so the user can refine it, naming tensions to make them concrete, offering interpretations and inviting correction. The goal is to draw out what the user already knows but hasn't articulated, with minimal cognitive load.

**Interpretive synthesis** is Gadamer's hermeneutic circle: understanding the whole through the parts and the parts through the whole. Each pass through the details revises the big picture, and the revised big picture changes how the details look. The session lifecycle skills use this when forming a coherent account of a session's trajectory.

## What's in the plugin

### Session lifecycle

Sessions deplete context the way a day in Stardew Valley depletes energy. The returns on continued work diminish as context gets crowded. Transitions between sessions should feel natural, not forced.

The session skills form a gradient based on how much the user serves as a bridge to the next session:

- **`/session-save`**: ongoing tidiness, like mise en place in a kitchen. Keeps a sourced Project Orientation and the evidence around its current bet warm as significant work happens.
- **`/session-rest`**: the natural end of a work cycle. Interprets the session inside the active bet and carries its Immediate gate forward without routinely reopening selection.
- **`/session-close`**: end of day. Adds full triage, working-style reflection, and cold-start framing while preserving the same bet boundary.
- **`/session-load`**: start a new cycle. Reconciles orientation sources, resumes the Immediate gate when the bet remains active, and invokes vision steering only when selection is genuinely open.

### Collaborative review

- **`/walkthrough`**: two people reading code together, one chunk at a time. The agent surfaces structure; the user steers toward what matters. Pauses between chunks are where the value comes from.

### Architectural restructuring

- **`/architectural-distillation`**: recover what an evolved system has learned
  from its present behavior and historical record, then express that knowledge
  through the architecture requiring the fewest independent concepts while
  preserving every meaningful distinction.

### Implementation quality

- **`/implementation-quality`**: follow meaningful operations through callers,
  types, implementation, and documentation, then improve how those surfaces
  express the system's concepts. It supports focused improvements and systematic
  passes, with a coherent baseline for human review and clear contracts around
  remaining complexity. Compose architectural distillation when the work
  exposes historical mechanisms obscuring the learned model.

### Workflow orchestration

- **`/steer-by-vision`**: explicit project reorientation that recovers the experienced outcome, selects one smallest meaningful end-to-end bet, keeps longer arcs warm, and names the evidence that will reopen steering.
- **`/per-cycle`**: prepare-execute-review workflow for testing a selected bet and returning calibrated evidence.
- **`/thread-coordinator`**: cross-thread coordination that preserves the current bet, routes one immediate gate, and returns to vision steering when its named signal arrives.
- **`/recon`**: adaptive codebase investigation that follows leads and synthesizes findings.

### Design and proposal writing

- **`/rfc-writing`**: stage-aware RFC drafting, revision, review, promotion, and canonization in the Rust/Ember tradition. It uses Exo's RFC lifecycle when present and treats Stage 5-style recommendation as corpus-level canonization work for related RFCs.

### Agents

Most agents are subagents, invoked by skills rather than by the user directly. The PER agents (`prepare`, `execute`, `review`) are implementation details of the PER workflow. `pre-read` maps codebase terrain for the active bet's Immediate gate and flags orientation-source disagreements during session transitions. `recon-worker` supports the recon skill.

Two agents are user-facing: `recon` (codebase investigation) and `slop-linter` (identifies and removes slop from documents).

### Hooks and instructions

Hooks enforce mechanical constraints that don't require judgment: blocking `npm` in a pnpm environment, blocking `tsx` when Node runs TypeScript natively. The environment instruction provides always-on context about the development environment (proto-managed toolchains, pnpm, strict typing).

A tool-call logging hook records every tool invocation as JSONL, providing an audit trail of what the agent actually did.

## Setup

```sh
git clone https://github.com/wycats/vscode-ai-plugin.git
cd vscode-ai-plugin
pnpm install
pnpm run setup
```

The interactive setup wizard asks which platform (VS Code, Claude Code, or Codex) and model provider you use, writes a `config.json`, builds the plugin, and, for VS Code, asks whether to register Stable, Insiders, a custom settings path, or skip registration. Reload the selected VS Code channel and you're done.

Requires `chat.plugins.enabled: true` (agent plugins are preview).

### VS Code local registration

Local registration is explicit so the installer never silently edits Stable VS Code settings when you meant Insiders. Pick a target channel or an exact settings file:

```sh
pnpm install-local -- --vscode-channel insiders
pnpm install-local -- --vscode-channel stable
pnpm install-local -- --settings "~/Library/Application Support/Code - Insiders/User/settings.json"
```

Preview the build and settings changes without creating or writing settings files:

```sh
pnpm install-local -- --dry-run --vscode-channel insiders
pnpm install-local -- --dry-run --settings /tmp/vscode-settings.json
```

`--settings` is the core form; `--vscode-channel stable|insiders` is a convenience alias for the standard settings path on your OS. You can also use `VSCODE_SETTINGS_PATH` or `VSCODE_CHANNEL`, but running `pnpm install-local` with no target now fails instead of guessing.

### Codex local marketplace

Build the Codex plugin artifact into an ignored local marketplace root:

```sh
pnpm package-codex
```

That writes `out/codex-marketplace/`, with the marketplace at
`out/codex-marketplace/.agents/plugins/marketplace.json` and the plugin package
under `out/codex-marketplace/plugin/`. Add that local marketplace, then install
the plugin:

```sh
codex plugin marketplace add ./out/codex-marketplace
codex plugin add wycats-ai-plugin@wycats-ai-plugin
```

The published Codex marketplace lives on the generated `codex-plugin` branch:

```sh
codex plugin marketplace add wycats/vscode-ai-plugin --ref codex-plugin
codex plugin add wycats-ai-plugin@wycats-ai-plugin
```

To update an installed Codex marketplace snapshot:

```sh
codex plugin marketplace upgrade wycats-ai-plugin
```

Then restart Codex. If the installed plugin cache appears stale, remove and
re-add the plugin after upgrading the marketplace.

If you installed the earlier main-branch Codex marketplace, migrate once:

```sh
codex plugin remove wycats-ai-plugin@wycats-ai-plugin
codex plugin marketplace remove wycats-ai-plugin
codex plugin marketplace add wycats/vscode-ai-plugin --ref codex-plugin
codex plugin add wycats-ai-plugin@wycats-ai-plugin
```

No VS Code migration is needed; VS Code continues to use `marketplace.json` and
`dist/wycats/` on `main`.

### How the build works

The root resource tree is the canonical authoring surface. Agent source files
use abstract role names for models and tool groups instead of hardcoded
provider-specific values. A local `config.json` (gitignored) maps those roles
to concrete values for your environment. The build resolves the names and
writes runtime projections to `out/wycats/` for VS Code,
`out/claude-code/` for Claude Code, `out/codex/` for Codex, or `out/pi/` for Pi.

| Target      | Active resource projections |
| ----------- | --------------------------- |
| VS Code     | Agents, workflow skills, hidden stances, instructions, and hooks |
| Claude Code | Agents, workflow skills, stances materialized as hidden skills, and hooks |
| Codex       | Workflow skills and stances materialized as hidden skills; agents are packaged as reference material |
| Pi          | Public Recon workflow, private canonical stances, and the `wycats-recon` pi-subagents profile |

The first Pi package is intentionally bounded to Recon. Its delegated profile
requires [pi-subagents](https://github.com/nicobailon/pi-subagents) to be
installed (`pi install npm:pi-subagents`). This projection was inspected
against Pi 0.85.1 and pi-subagents 0.68.0; re-check `pi --version`, run
`/subagents-doctor`, and inspect the `wycats-recon` Prompt Audit after runtime
upgrades and before behavioral probes.

Build with `pnpm build:pi`, then launch without installing this package using
`pi -e ./out/pi`. Invoke `/skill:recon` in the parent or ask the parent to use
`wycats-recon` through pi-subagents. `out/pi/projection-capabilities.json`
records the runtime prerequisite, exact supported surface, and prototype
omissions; browser, memory, Exo, nested fan-out, and dedicated testing tools
are reported rather than silently substituted.

### Pi installation and updates

Once the Pi publication workflow has run on `main`, install the generated
package from its publication branch:

```sh
pi install git:github.com/wycats/vscode-ai-plugin@pi-plugin
```

Fetch later publications explicitly, then run `/reload` or restart pi:

```sh
pi update git:github.com/wycats/vscode-ai-plugin@pi-plugin
# Or update all installed extension packages:
pi update --extensions
```

Pi 0.85.1 fetches and reconciles the configured Git ref during updates, so
`@pi-plugin` follows that branch's current publication. A tag or commit ref
instead retains the corresponding snapshot. Pushing source updates triggers
publication after validation; installed clients receive them when they run an
update, rather than being changed by the publisher.

`publish-pi.yml` builds from canonical source on `main` and publishes a generated
root package to `pi-plugin`. `pnpm publish-pi` runs the same publication manually
and **pushes to origin**. It uses a disposable staging repository and an exact
ref lease to protect a concurrent publication. The branch is generated output;
source edits belong on the normal development branches.

For local development, `pi -e ./out/pi` and a local `pi install -l ./out/pi`
remain useful. When switching from a local install to the publication branch,
remove the local package registration with `pi remove -l ./out/pi` so the same
resources are loaded only once. Keep model preferences in user/project
pi-subagents overrides; edits inside a managed Git package checkout can be
replaced by an update.

Codex does not currently activate this plugin's agents, instructions, or
hooks. Claude Code does not consume the VS Code instruction format. These are
visible host capability boundaries, not alternate definitions of the shared
resources.

See [docs/setup.md](https://github.com/wycats/vscode-ai-plugin/blob/main/docs/setup.md) for full configuration details, including model presets by provider and tool group reference.

## Development

```sh
pnpm watch     # Auto-rebuild on source or config changes
pnpm build     # One-off build
pnpm build:codex # Build the Codex target from the example config
pnpm build:pi  # Build the bounded Pi Recon package
pnpm package-codex # Build an ignored local Codex marketplace
pnpm validate  # Check discovered resources and plugin metadata
pnpm check     # TypeScript + ESLint strict type-checked
pnpm test:eval # Test evaluation fixtures, parsing, and grading without a model
pnpm test:pi-runtime # Optional installed pi-subagents parser integration (see below)
pnpm test:pi-publication # Publish/update tests using disposable local Git remotes
pnpm eval -- --adapter claude-code-cli # Run behavioral evaluations through the Claude Code CLI
```

The portable suite skips the runtime-source integration by default. To verify a
locally installed pi-subagents parser without adding a repository dependency,
set `PI_SUBAGENTS_ROOT` to that checkout before running
`pnpm test:pi-runtime`.

The publication suite always tests generated package publication against a local
bare Git remote. Set `PI_TEST_BINARY` to an installed pi executable to also
exercise real `pi install` and `pi update --extensions` across two publications.
That optional test uses a disposable pi configuration and maps its fixture Git
URL to the local remote; it leaves the user's installed packages unchanged.

For isolated builds, `node scripts/build.ts --config config.pi.example.json --output /tmp/new-pi-output`
accepts a new or empty directory outside the source checkout. The override
rejects source paths, ancestors, symlinks, and existing data before cleanup;
ordinary target builds continue replacing their dedicated `out/<target>` directory.

Edit agents, skills, and stances in this directory. For VS Code, the watch script rebuilds `out/wycats/` on every change. All VS Code windows consume the installed plugin.
