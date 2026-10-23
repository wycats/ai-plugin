# wycats

Reusable instructions for investigation, implementation, review, and writing in
VS Code Copilot, Claude Code, Codex, and Pi.

## What this is

This plugin gives your coding agent workflows for tasks such as investigating a
codebase or developing an RFC, stances that shape the judgment those tasks need,
and agent roles for delegated work.

The plugin grew out of working with agents on real projects and revising their
instructions when the work revealed something we had missed. The repository
also develops a theory of how those instructions work. Using the resources
gives us ways to try that theory and reasons to revise it.

## How the pieces work together

Suppose an edit triggers an expensive calculation several times. You want to
understand why before deciding what to change.

Ask your agent to use the [Recon workflow](skills/workflows/recon/SKILL.md). It
guides the investigation: follow the calls, compare explanations, and decide
what to examine next. You may initially suspect that some calls should be
removed. Discovering that several consumers need the same result changes the
question to how those consumers could share the calculation.

[Interpretive Synthesis](skills/stances/interpretive-synthesis/SKILL.md) describes
the judgment involved in that change of understanding. The calls acquire a
different meaning once we understand their consumers, and that new account
changes what we need to investigate. This is a **stance**: relationships we can
recognize and attend to across different kinds of work. It also matters when an
implementation changes the premise of an RFC or a reader's response changes the
opening of an essay. A **workflow** brings such stances into a particular task
and describes how the work develops.

An **agent** takes responsibility for a contribution. The
[Recon worker](agents/recon-worker.agent.md) might trace the callers while another
participant examines how updates reach them. The worker uses the same Recon
workflow to pursue its part of the question. It shares findings while the
investigation is underway and brings discoveries that affect the larger account
to the coordinator. The coordinator uses those exchanges to reconsider the
investigation as a whole.

Stances live in `skills/stances/`, workflows in `skills/workflows/`, and agent
roles in `agents/`. The build adapts these sources to each application's skill,
agent, instruction, and hook support. The [target table](#how-the-build-works)
describes what each package provides.

## The core idea

Instructions shape what an agent notices, expects, and treats as worth pursuing.
A stance makes those relationships explicit. For example,
[Reader Orientation](skills/stances/reader-orientation/SKILL.md) asks what someone
can understand where they encounter a piece of work. That question can guide an
API explanation, a paragraph, or a navigation control. Each needs different
details to make sense to its reader.

We use a probability landscape as a working model for this influence: context
makes some continuations more likely than others. Instructions can reinforce
the same account of the work or pull it in competing directions. This gives us
a question to ask when writing a skill: what does each instruction lead the
agent to attend to, and how does that attention contribute to the task?

[Foundations](FOUNDATIONS.md) develops that model.
[Quality](QUALITY.md) turns it into principles for writing and reviewing the
resources. We revise both as using the plugin changes our understanding.

## Concept map

[Building together](instructions/building-together.instructions.md) describes how
shared understanding develops through conversation, implementation, and use. It
connects the skills and stances through the work they support. The
[persistent guidance contract](docs/persistent-guidance.md) explains how each
host receives it and the current delivery limits.

The foundational documents develop the working model and writing principles.
Supporting documents describe the package contracts and setup, preserve
workflow decisions, and explore emerging concepts.

- [FOUNDATIONS.md](https://github.com/wycats/ai-plugin/blob/main/FOUNDATIONS.md) — the working model: probability landscapes, stances, information boundaries, generation and evaluation, and selection across timescales.
- [QUALITY.md](https://github.com/wycats/ai-plugin/blob/main/QUALITY.md) — practical principles for writing and reviewing skills, agents, instructions, and hooks.
- [docs/canonical-resources-and-runtime-projections.md](https://github.com/wycats/ai-plugin/blob/main/docs/canonical-resources-and-runtime-projections.md) — semantic authority across stance, workflow, project-state, and runtime projections.
- [docs/runtime-projection-contract.md](https://github.com/wycats/ai-plugin/blob/main/docs/runtime-projection-contract.md) — precise skill activation semantics, package locations, native mappings, and conformance requirements.
- [docs/curated-upstream-subset-consumption.md](https://github.com/wycats/ai-plugin/blob/main/docs/curated-upstream-subset-consumption.md) — host-neutral downstream selection, dependency closure, provenance, and honest projection across every supported target.
- [docs/per-arc.md](https://github.com/wycats/ai-plugin/blob/main/docs/per-arc.md) — lightweight reference note for preserving current-bet orientation and evidence across repeated PER cycles.
- [docs/exo-composition.md](https://github.com/wycats/ai-plugin/blob/main/docs/exo-composition.md) — exploratory brief for how stance-shaped cognition composes with durable project state and operational steering surfaces.
- [docs/lane-centered-ai-workbench.md](https://github.com/wycats/ai-plugin/blob/main/docs/lane-centered-ai-workbench.md) — thought experiment for a workbench where project vision, a current bet, visible lanes, and PER-sized goals share one project reality.
- [docs/setup.md](https://github.com/wycats/ai-plugin/blob/main/docs/setup.md) — configuration, local registration, and build setup details.

## Stances

These are some of the stances the workflows draw on. Each source describes the
relationships involved and uses examples from different domains to make them
recognizable.

**Collaborative grounding** combines what the agent can investigate and infer
with the user's situated experience. The agent brings observations and a
recommendation; the user's priorities, examples, and corrections can change
what those observations mean and how the work should proceed.

**Authorial continuity** keeps the author's judgment present in writing developed
with an agent. The author's response can reveal what their readers already
understand, which qualifications matter, and how a change in wording alters
their position.

**Relational continuity** keeps language attached to the work underway so later
turns, summaries, and handoffs inherit usable orientation. A compressed account
preserves the concerns, observations, and relationships someone needs to
continue from it.

**Vision steering** relates a local choice to what the work should make possible
for people. That purpose gives details significance beyond their local quality.
Experience can clarify the direction, reveal a further ambition, or show that
the work has accomplished enough.

**Public design reasoning** carries a design's reasoning, consequences, and
commitments to people outside the originating conversation. A future reader
should be able to build on the account and revisit its choices. Template
sections earn their place through the help they provide those readers.

**Reader orientation** starts from what someone can know where they encounter
code, an interface, or an explanation. It supplies the relationships needed to
reason locally, with deeper detail available through deliberate investigation.
It also asks what including an explanation suggests to someone who already
understands the point. The implementation-quality skill applies this stance to
a codebase's flow, types, organization, and documentation.

**Joint reading** develops understanding through shared material. Each
participant can notice something the other missed, and their questions change
what both see in a particular passage or code path. Walkthrough gives that
reading a rhythm; Colleague Review uses it to develop an artifact through
another participant's encounter.

**Diagnostic questioning** lets each answer revise the questioner's
understanding and guide what becomes worth asking next. A concrete question
about the user's intent or experience can change the larger question the agent
thought it needed to resolve. Dangling-thread review uses this when a thread's
status depends on the user's situated knowledge.

**Socratic elicitation** helps the user examine an intuition they cannot yet
explain. A reflection, comparison, or small draft gives them something to
recognize, question, or refine. Their response can develop the intuition and
change what they thought they wanted to say.

**Interpretive synthesis** is Gadamer's hermeneutic circle: understanding the whole through the parts and the parts through the whole. Each pass through the details revises the big picture, and the revised big picture changes how the details look. Recon uses this to revise its account as evidence arrives; walkthrough uses it as the parts change the shared understanding of the whole.

## What's in the plugin

### Collaborative review

- **[`/colleague-review`](skills/workflows/colleague-review/SKILL.md)**: develop an
  artifact through a colleague's reading, questions, and attempts to apply it.
  Discussion can change the explanation, the work itself, or what you think
  needs review. Return to the revision together to see what it now communicates.

- **`/walkthrough`**: read code with the user one chunk at a time. Each
  participant's observations and questions can change the shared understanding;
  pauses give those contributions room to guide the next chunk.

### Architectural restructuring

- **`/architectural-distillation`**: recover what an evolved system has learned
  from its present behavior and historical record, articulate the learned model,
  and test that account against the difficult cases. Use it to derive the
  architecture requiring the fewest independent concepts while preserving every
  meaningful distinction.

### Implementation quality

- **`/implementation-quality`**: follow meaningful operations through callers,
  types, implementation, and documentation, then improve how those surfaces
  express the system's concepts. It supports focused improvements and systematic
  passes, with a coherent baseline for human review and clear contracts around
  remaining complexity. Compose architectural distillation when the work
  exposes historical mechanisms obscuring the learned model.

### Workflow orchestration

- **`/steer-by-vision`**: recover what the work should make possible, compare
  plausible next moves, and recommend a direction. Carry the reasons and useful
  alternatives forward so new evidence can inform the next choice.
- **`/per-cycle`**: organize preparation, implementation, and independent review
  of a consequential change. Participants keep expectations available for
  comparison with the work and reconsider the approach together as they learn.
- **`/thread-coordinator`**: keep separate chats working toward a shared outcome.
  Follow ownership and dependencies, carry discoveries to affected efforts, and
  make the next action clear.
- **`/recon`**: investigate a question through code, documents, history, or other
  evidence. Discoveries can change the explanation and which question would
  best help the caller proceed.

### Design and proposal writing

- **`/rfc-writing`**: develop a proposal's reasoning and commitments as it moves
  through discussion, implementation, and use. The project's process and the
  decision ahead guide what the document needs to establish.

### Agents

`recon-worker` supports delegated investigation from the recon skill. PER describes
the responsibilities of preparation, execution, and review in its workflow;
the coordinator chooses suitable workers from the host's available agents.

`recon` is the user-facing investigation agent. The delegated
[`editorial-reader`](agents/editorial-reader.agent.md) reads a draft from its
intended audience's starting point, investigates ambiguities, and develops
revisions with the writer. Its supporting stances keep the author's judgment
and the reader's understanding present in that work.

### Hooks and instructions

Hooks enforce mechanical constraints that don't require judgment: blocking `npm` in a pnpm environment, blocking `tsx` when Node runs TypeScript natively. The VS Code environment instruction supplies development conventions for matching files. A generated session-start hook delivers Building together in Codex and VS Code Local sessions. Claude Code loads the full story through an [explicit project import](docs/setup.md#claude-code-persistent-guidance); see [delivery and limits](docs/persistent-guidance.md).

A tool-call logging hook records every tool invocation as JSONL, providing an audit trail of what the agent actually did.

## Setup

```sh
git clone https://github.com/wycats/ai-plugin.git
cd ai-plugin
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
codex plugin add wycats@wycats
```

The published Codex marketplace lives on the generated `codex-plugin` branch:

```sh
codex plugin marketplace add wycats/ai-plugin --ref codex-plugin
codex plugin add wycats@wycats
```

To update an installed Codex marketplace snapshot:

```sh
codex plugin marketplace upgrade wycats
```

Then restart Codex. If the installed plugin cache appears stale, remove and
re-add the plugin after upgrading the marketplace.

For an existing `wycats-ai-plugin` installation, follow the
[rename migration](docs/setup.md#renaming-an-existing-installation).

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
| Codex       | Workflow skills and stances, plus the persistent-context hook; agents are packaged as reference material |
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
pi install git:github.com/wycats/ai-plugin@pi-plugin
```

Fetch later publications explicitly, then run `/reload` or restart pi:

```sh
pi update git:github.com/wycats/ai-plugin@pi-plugin
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

Codex's generated hook delivers persistent instructions after the user trusts
it. The agents remain reference material, and the other targets' policy and
logging hooks are not enabled in Codex. Claude Code uses an explicit project
CLAUDE.md import that is refreshed alongside plugin updates. Pi's Recon
profile currently omits the story. See the [persistent guidance contract](docs/persistent-guidance.md)
for lifecycle and qualification limits.

See [docs/setup.md](https://github.com/wycats/ai-plugin/blob/main/docs/setup.md) for full configuration details, including model presets by provider and tool group reference.

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
