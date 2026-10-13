# Standard-shaped source: Recon prototype

Can standard instruction containers make our authoring model easier to understand
and consume while preserving the distinctions that make the plugin work?

This experiment compares three source layouts: today's separate directories,
flat instruction containers under `skills/`, and containers grouped under
`skills/workflows/` and `skills/stances/`. Both candidates record meaning in
Agent Skills metadata. It exercises the existing composition validator and target projection
planner. Production discovery, builds, and the
[runtime projection contract](../../docs/runtime-projection-contract.md) retain
their current behavior. The candidates explore one authoring dialect in two layouts.

## Inspect the experiment

From the repository root, run:

```sh
node scripts/prototypes/standard-source.ts
```

Each run prints a fresh directory under `out/standard-source-prototype-*`:

| Directory or file | What to inspect |
| --- | --- |
| `comparison.md` | Start here: links to the same resources in all three layouts and their generated policy |
| `current-source/` | Recon, its agent, the marked-link dependency closure, and two fixtures in today's layout |
| `flat/source/` and `grouped/source/` | The same resources with flat or grouped containers and identical authoring metadata |
| `flat/normalized-source/` and `grouped/normalized-source/` | Each candidate decoded into today's canonical representation |
| `current-projections/`, `flat/projections/`, and `grouped/projections/` | Comparable resource files produced using the existing target planner and link projector |
| `report.json` | Resource identities, composition edges, comparisons, and limits |
| Each candidate's `negative-cases/` | A reference changed to a load, demonstrating rejection at the explicit entry boundary |

These projections contain resource samples, not complete installable packages.
They do not exercise target agent-envelope translation, hooks, or installers.
Run results are generated scratch. The source text remains authoritative in the
repository; the experiment copies it rather than maintaining another articulation.

## The source choice, made concrete

The complete slice has nine resources: Recon's workflow and agent, five stances,
and the two workflow fixtures. Four stances are loaded directly by Recon; marked
references also bring in collaborative grounding. Both reference and load edges
participate in the package's closure, while retaining their different meanings.

| Resource | Current | Flat | Grouped |
| --- | --- | --- | --- |
| Recon workflow | `skills/recon/SKILL.md` | `skills/recon/SKILL.md` | `skills/workflows/recon/SKILL.md` |
| Diagnostic stance | `stances/diagnostic-questioning/SKILL.md` | `skills/diagnostic-questioning/SKILL.md` | `skills/stances/diagnostic-questioning/SKILL.md` |
| Recon agent | `agents/recon.agent.md` | Same | Same |

The flat candidate's `plugin.json` uses the Agent Plugins 1.0 manifest identifier.
Its eight instruction containers satisfy the immediate-child layout, including
the five stances. The grouped candidate retains visible semantic groupings but
has zero skills at that depth. It is an authoring tree read by the prototype's
recursive reader; it emits no plugin manifest or claim of direct installation.
Both candidates' `agents/` directory remains compiler-owned authoring material.
This experiment assigns it no portable agent semantics.

For a stance, today's policy:

```yaml
name: diagnostic-questioning
user-invocable: false
```

becomes the following metadata, alongside the unchanged name and description:

```yaml
metadata:
  wycats.kind: stance
  wycats.user-invocable: "false"
  wycats.invocation: contextual
```

For the explicit-only fixture, the corresponding values are `workflow`, `"true"`,
and `explicit`. These experimental keys belong to our compiler. Agent Skills
provides the string-to-string metadata container; it assigns these keys no
behavior. The prototype deliberately spells out all three values so their
ownership is visible. Defaulting and namespace spelling remain design choices.

## What the experiment establishes

For each candidate, the runner checks that normalization preserves resource identities, semantic
kinds, activation policies, and labeled composition edges. A round trip preserves
body bytes exactly; only marked-link destinations change in the intermediate
layout. One fixture includes a local supporting file to exercise resource-relative
placement.

| Case | Checked result |
| --- | --- |
| Recon loads a contextual stance | Link resolves and remains a load |
| Entry fixture references the explicit workflow | Link resolves and remains a reference |
| Explicit workflow loads a contextual stance | Accepted |
| Entry fixture is changed to load the explicit workflow | Rejected by the existing composition validator after normalization |
| Hidden explicit workflow, non-string metadata, unknown kind, or duplicate top-level policy | Rejected |
| VS Code, Claude Code, and Codex resource projections | All three layouts produce equal paths, exposure, frontmatter, sidecars, and bodies; the explicit fixture stays public and receives native invocation metadata |
| Pi resource projection | All three layouts produce the same seven selected resources; its existing Recon profile excludes the two fixtures |
| Immediate-child discovery layout | Eight eligible containers in the flat candidate; zero in the grouped candidate. This path inspection is not a host loader test. |

This is evidence about source representation and generated resources. It does
not establish host enforcement, visibility, model behavior, complete schema
conformance, or safe direct installation of the candidate source. In particular,
discovering `wycats.invocation: explicit` has no standardized effect on a client
that does not understand our metadata.

## What changes architecturally

Both candidates use a familiar container for instruction resources and make the
stance/workflow distinction explicit data. The grouped candidate also preserves
that distinction in the directory tree. Canonical prose and its semantic
validation survive either representation.

The bridge also reveals a coupling in today's compiler: `section` means both
semantic category and physical source directory. Discovery supplies that value;
activation validation, target selection, and placement consume it. This experiment
restores today's directories before calling those consumers. That is a useful
way to compare representations, not a proposed permanent compiler stage.

| Choice | What it buys | What would justify adopting it |
| --- | --- | --- |
| Flat `skills/` containers | Published v1's discovery layout and uniform resource shape | Shared tooling or authoring becomes materially simpler, and metadata keeps semantic kind legible |
| Grouped `skills/` containers | Uniform resource shape with visible stance/workflow grouping | That grouping helps authors understand ownership; compilation handles target discovery layouts |
| Namespaced skill metadata | A standard extension surface for our authoring fields | Authors can understand its ownership; validation gives precise feedback; adapters preserve consequential policy |
| Semantic kind independent of source location | Relocation no longer redefines a stance as a workflow | The source reader can normalize either layout directly into the same semantic model |
| Agent Plugins target packaging | A shared distribution contract | A target package preserves agents, activation, hooks, and installation through that client's supported extensions |

No semantic subsystem disappears in this slice. Composition, activation,
selection, and host projections still do distinct work. The potential simplification
is a cleaner boundary: a source reader produces semantic resources; target adapters
choose their runtime envelopes.

The grouped result removes a tradeoff posed by the flat candidate: common
containers can retain visible semantic grouping. The remaining decision is
whether those containers improve authoring and shared tooling enough to justify
changing the source layout. Standard target packaging can proceed with any of
the three source choices. Direct installation of canonical source would be a
further compatibility promise, especially for explicit entry policy.

The normalization bridge still reconstructs today's directories. A production
source reader that separates semantic kind from physical location remains future
work. Both candidates also retain globally unique skill names; grouped storage
does not introduce namespace-qualified identity.

## Source of the conventions

- [Agent Plugins 1.0 specification](https://agent-plugins.org/specification): manifest and immediate-child skill discovery; runtime exposure remains client-defined.
- [Agent Skills specification](https://agentskills.io/specification): instruction containers, supporting files, and string-valued metadata.
- [Projection contract](../../docs/runtime-projection-contract.md): the repo's existing activation and projection semantics, reused by the experiment.
- [Prototype runner](../../scripts/prototypes/standard-source.ts): the normalization bridge, comparisons, and negative cases.

The grouped shape is informed by the
[namespaced discovery proposal](https://github.com/agentplugins/agent-plugins-spec/pull/67).
This experiment does not implement or claim conformance to that proposal's
discovery algorithm, including its terminal skill boundaries and namespace
identity rules. Compilation to existing resource layouts needs no 1.1 host support.
