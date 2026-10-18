# Canonical Resources and Runtime Projections

The plugin carries stable relational structures through different tasks,
timescales, and runtimes. Those surfaces should reinforce one another without
becoming independent sources of meaning.

The governing principle is:

> Coherence preserves a stable relational structure across situated
> projections. The canonical articulation governs changes to that structure;
> projections adapt it to a task, timescale, or runtime without becoming a
> competing source of meaning.

## Canonical means authority to revise

A canonical resource owns the language and activation intent that define its
behavior. For a stance, that includes its relational invariant, central
tension, cross-domain examples, applicability, and composition boundaries.
For a workflow skill, it includes the maneuver's entry conditions, process,
output, and handoff.

Canonical does not mean physically unique. Generated packages necessarily
materialize source files in several places, and a workflow may repeat a short
stance handle to keep its well active. The relevant question is where a change
to the meaning belongs. A projection may reinforce or apply the canonical
resource; it should not acquire independent authority to redefine it.

Exact language matters. These resources shape a model's probability landscape,
so semantic preservation is stronger than carrying the same topic or intent.
Prefer copying authoritative language directly. Treat a rewritten projection
as a semantic change unless the difference is confined to the host envelope.

## Projection across the plugin

The same relationship appears at several layers:

| Projection | Canonical owner | What the projection contributes |
| ---------- | --------------- | ------------------------------- |
| Cross-domain example | Stance | A different subject that preserves the stance's relational invariant |
| Workflow skill | Its own maneuver plus composed stances | Entry, sequencing, collaboration, output, and handoff for a situated task |
| Agent | Its fused cognitive mode plus crystallized stances | Persistent operational behavior for a delegated role |
| Project Orientation | User steering or the designated project-purpose surface | A current-bet view that carries purpose into sessions and coordination |
| Runtime package | Root source resources and build configuration | Host-specific location, discovery, model/tool names, hook envelopes, and supported surfaces |

These projections are not interchangeable. A skill composes stances; it does
not become their new definition. A session trajectory mirrors project purpose;
it does not replace the designated source. A generated package makes resources
available to a host; it does not become the authoring surface.

## Activation intent and runtime discovery

A resource's description explains applicability. Its `wycats.user-invocable`
metadata states whether it belongs on the user's direct workflow surface;
`wycats.invocation` states whether relevance can select it or the user must
choose it explicitly.
Choosing to enter a substantial workflow is part of that workflow's meaning,
so these declarations belong to the canonical resource.

The [runtime projection contract](runtime-projection-contract.md) owns the exact
fields, defaults, supported combinations, output locations, and native target
mappings. The build normalizes canonical policy once, checks composition, and
projects that policy through each host's metadata before replacing output.

Discovery and enforcement remain distinct. A package may contain a resource
that its host does not discover, or retain a visibility field that its host
does not honor. The contract records those limits alongside each mapping;
package fidelity alone does not establish runtime behavior.

## Canonical composition links

A canonical resource can make a relationship navigable with an ordinary
relative Markdown link whose title is exactly one of these values:

```markdown
[interpretive synthesis](../../stances/interpretive-synthesis/SKILL.md "composition:load")
[collaborative grounding](../collaborative-grounding/SKILL.md "composition:reference")
```

`composition:reference` means the full resource remains available for
consultation. `composition:load` requests activation when the governing prose
applies. The surrounding sentence owns the condition, timing, emphasis, and
purpose; the title does not establish a separate activation state machine.
The activation contract permits load edges into contextual resources and
reference edges into either policy. Background guidance can therefore say
“keep active throughout,” while a situated interruption can say “when surfaces conflict,” and both can use the
same load relationship without losing their different shapes.

The supported grammar is an inline Markdown link with a relative destination
and a single- or double-quoted title (parenthesized Markdown titles are also
accepted). Composition destinations point directly to a discovered canonical
Markdown resource; URL schemes, absolute paths, fragments, and query strings
are outside this identity form. Validation reports malformed markers, exact
`composition` namespaces with unsupported relationship values, likely
namespace typos within edit distance two when paired with exact `load` or
`reference`, identity collisions, and unresolved or invalid targets with
source file and line. This bounded typo check catches plausible authoring
mistakes without treating arbitrary documentation titles as markers; it does
not promise to classify every possible misspelling. Top-level and blockquoted
fenced code plus inline code remain literal examples. Ordinary documentation
links and historical unmarked links remain ordinary Markdown and carry no
inferred composition relationship.

Builds validate both source resolution and target projection completeness
before cleaning generated output. They retain the label, title, and all
surrounding body bytes while rewriting only the destination for the target's
physical layout. Each target also emits `composition-index.json`, a mechanical
index of the projected edges. Its `canonicalSource` and `canonicalLine` identify
the authoritative coordinate; `generatedSource` identifies the projected file
without asserting that generated frontmatter retained the same line number.
The index supports inspection and discovery; canonical prose remains the
authority for what each relationship means.

## Projection plans and artifact addresses

`scripts/projection-plan.ts` selects materialized resources and records their
target destinations, intended public or private surface, and reference-only
status. The same plan supplies support-directory copying, manifest paths,
composition addresses, and the Pi capability catalog. Public and private
describe the intended discovery surface; they do not prove runtime activation.

The bounded Pi profile lives in `scripts/pi-profile.ts`. Its delegated catalog
contains the public Recon workflow and four constituent stances. The package
also carries the larger private stance collection and referenced workflows for
navigation. Those additional workflows live outside native discovery. Packaging
availability and the delegated catalog remain separate decisions.

Every target emits `projection-resources.json` with `schemaVersion: 1`, the
target, and resource records containing `canonicalSource`, `generatedSource`,
canonical `identity`, and `exposure`. Canonical and generated addresses use
forward slashes; filesystem paths remain native. Evaluation consumes this
artifact map instead of independently reconstructing a runtime's layout.

Claude Code, Codex, and Pi publication prepare their distinct package layouts
through `scripts/publish-generated.ts`. Each publication stages a fresh orphan
snapshot and updates only its generated branch, with a lease against the head
observed before staging. Validation or concurrent updates prevent publication;
the temporary checkout is cleaned up. VS Code continues publishing its tracked
distribution through the separate main-branch contract.

## Reinforcement, variants, and loss

Intentional restatement is useful when it deepens the same well. A compact
phrase in a skill can reactivate a stance at the phase where it matters. An
agent can embody the stance in the voice of its role. The restatement remains
a projection when its meaning still changes through the canonical owner.

A projection has become a competing authority when it can answer the same
semantic question differently: when a skill independently defines what a
stance means, a generated file changes when the resource applies, or a session
artifact silently revises project purpose.

When a consumer genuinely needs different semantics, make the fork explicit.
Revise the canonical resource when the invariant itself changed. Introduce a
named variant when both meanings remain valid. When a runtime simply lacks the
required capability, describe the omission as capability loss rather than
simulating equivalence through different guidance.

## Authoring boundary

The grouped `skills/stances/` and `skills/workflows/` directories, root `agents/`
and `instructions/`, and neutral hook manifests are the plugin's canonical
authoring surfaces. Instruction resources declare semantic kind and activation
in string-valued `wycats.*` metadata. The source reader separates those meanings
from physical location; adapters choose target paths from the normalized model. Abstract model roles,
tool groups, and canonical hook tool names let the build adapt execution
details without rewriting behavior. Generated `out/`, tracked `dist/wycats/`,
and publication branches are derived runtime artifacts.

Composition and evaluation share the [canonical source reader](../scripts/resource-source.ts).
It resolves the authoring format into a name, kind, identity, and activation
policy. A nested container retains its leaf name; an agent's declared name
takes precedence over its filename. Legacy directory conventions are interpreted
at this boundary, so consumers receive the same meaning whichever source format
an author uses. Whether grouping should eventually supply the kind is an
authoring decision; adapters continue to consume the resolved model.

Generated files have a different contract from source files. Native activation
keys are valid in a generated skill even though authors cannot declare them in
canonical source. Evaluation checks the source against its suite identity, then
checks the generated resource's discovery fields without reinterpreting its host
envelope as authoring metadata. Invocation uses the validated name; the resource
map supplies the generated address.

Hook projection follows the same direction. Neutral manifests describe policies,
events, and scripts; the [hook adapters](../scripts/hook-projection.ts) produce
each host's final envelope directly. VS Code Local uses flat event handlers and
host-expanded package roots. Claude Code retains matcher groups and shell-expanded
roots. Their shared policy does not erase those execution differences.
Script paths are relative to `scripts/hooks/` and may contain nested directories
and any Node-supported file extension. Source validation and both adapters require
portable path characters: letters, digits, underscores, periods, hyphens, and
forward slashes, with no parent traversal. This lets each host compose the script
path with its package-root expansion without introducing shell syntax.

This repository is the proving ground for this architecture and owns the
resources it authors. It does not need to become the permanent home of every
knowledge corpus that later adopts the same model. A shared corpus can live in
a neutral home while this plugin consumes and projects it under the same
authority boundary.
