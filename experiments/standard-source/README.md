# Standard-shaped source experiment

Can shared instruction containers make our authoring model easier to understand
while preserving the distinctions that make the plugin work?

This experiment now runs through the production reader and all four target
builders. The repository authors workflows under `skills/workflows/` and stances
under `skills/stances/`. Each `SKILL.md` declares its meaning through string-valued
Agent Skills metadata:

```yaml
metadata:
  wycats.kind: stance
  wycats.user-invocable: "false"
  wycats.invocation: contextual
```

These are compiler-owned fields. The directories orient authors; the declared
kind governs composition, activation, selection, and projection. A generic host
reading this metadata provides no invocation-policy guarantee. The generated
package carries each target's native policy.

## Inspect the comparison

From the repository root, run:

```sh
node scripts/prototypes/standard-source.ts
```

Each run prints a fresh directory under `out/standard-source-prototype-*`:

| Artifact | Purpose |
| --- | --- |
| `comparison.md` | Links to the same resources in three layouts and their generated policies |
| `current-source/` | A legacy-layout baseline assembled from the authoritative source |
| `flat/source/`, `grouped/source/` | Equivalent metadata-authored candidates, read directly by the production reader |
| `current-projections/`, `flat/projections/`, `grouped/projections/` | Resource samples for all four targets |
| `report.json` | Semantic identities, composition edges, comparisons, and limits |
| Candidate `negative-cases/` | A reference changed to a load, demonstrating the explicit-entry boundary |

The nine-resource slice contains Recon's workflow and agent, five stances, and
two fixtures. Recon loads four stances directly; references bring collaborative
grounding into the closure. The entry fixture references an explicit-only
reconstruction fixture, which itself loads a contextual stance.

The runner verifies equal identities, kinds, activation, and labeled edges across
all three layouts. It compares projected paths, exposure, frontmatter, sidecars,
and bodies, and checks byte-preserving body relocation. It rejects loading the
explicit workflow, hidden explicit workflows, invalid metadata, and duplicate
policy ownership. Pi's bounded Recon profile selects seven resources and excludes
the two fixtures. These samples are not installable packages.

## The complete implementation trial

The grouped source is also consumed by the ordinary builds:

```sh
pnpm validate
pnpm check
pnpm build --config config.example.json
pnpm build --config config.claude-code.example.json
pnpm build:codex
pnpm build:pi
```

The full source migration covers 17 workflows and 14 stances. Skill prose is
preserved; relative links and frontmatter change to express the new locations
and metadata. `CanonicalResource.kind` separates meaning from source `section`.
Names remain globally unique across workflows and stances. Legacy flat input
remains accepted by the reader for compatibility and comparison.

VS Code, Claude Code, and Codex flatten instruction containers into
`skills/<name>/`; Pi retains its selected workflow and private stance surfaces.
Supporting files travel with their resource. Nested resource containers are
excluded from a parent's supporting-file copy.

VS Code now emits an Agent Plugins 1.0 manifest. Agents, rules, and hooks use the
`com.github.copilot` namespace. Agents and rules retain source-relative paths;
exclusive manifest path lists make native discovery precise, including nested
resources and their supporting files. The installer registers the generated package
through `chat.pluginLocations`; plugin discovery owns its hooks. Bundled hook
commands use the host-expanded `${PLUGIN_ROOT}` token so they remain relocatable.
The precise mappings and reasons to revise them live in the
[runtime projection contract](../../docs/runtime-projection-contract.md).

## Evidence and remaining boundary

The migration preserves all 39 resource identities, kinds, and activation policies,
and all 35 labeled composition relationships, compared with the pre-migration
checkpoint. Every byte outside link destinations in the 31 instruction bodies
is preserved.

Complete builds and automated checks pass. Tests exercise grouped-source builds,
composition and explicit-entry failures, native metadata, supporting files,
installer registration, and generated hook structure. A disposable installation
also ran the packaged pnpm hook from a different working directory: it denied
npm and allowed pnpm using the VS Code Local hook envelope.

A dedicated signed VS Code copy and durable probe profile now load the complete
package plus both fixtures. Native UI inspection recognizes 33 skills, seven
agents, one instruction, and all four hook commands. Recon and the explicit-only
fixture appear in slash completion; diagnostic questioning remains absent there.
The Recon agent is selectable as `wycats:recon`: the VS Code adapter
qualifies canonical agent names with the manifest name, preserving unambiguous
name-based delegation across differently named plugins without exposing the
`.agent` filename suffix. The explicitly named slop-linter is qualified too.

The released plugin was excluded from the probe profile; home-directory skills
remain discoverable, so the profile is not a hermetic model-context boundary.
No model request was sent. Contextual-selection filtering and native hook
execution remain unverified; Copilot Agent Host's distinct hook envelope also
remains outside this proof. Local receipts live with the durable probe environment
under `~/Library/Application Support/AIPluginProbe/`.

The experiment supports a concrete architectural choice: retain grouping for
authors, give the reader explicit semantic data, and let adapters choose runtime
layout. It establishes no promise that canonical source can be installed directly.
The remaining host check can change adapter details without deciding source
meaning by directory again.

## Sources

- [Agent Plugins 1.0](https://agent-plugins.org/specification): manifest and immediate-child skill discovery.
- [Agent Skills](https://agentskills.io/specification): instruction containers and string-valued metadata.
- [VS Code plugin support](https://code.visualstudio.com/docs/agent-customization/agent-plugins): format selection and native components.
- [Prototype runner](../../scripts/prototypes/standard-source.ts): direct comparisons and negative cases.

The [namespaced discovery proposal](https://github.com/agentplugins/agent-plugins-spec/pull/67)
informed the grouped source shape. This implementation claims no conformance to
that proposal's discovery or namespace identity rules; generated packages require
no 1.1 support.
