# Runtime Projection Contract

A skill's activation policy is part of its meaning. Choosing to enter a
substantial workflow changes the work the user and agent are undertaking.
Projection preserves that choice as the skill moves between runtimes.

The [architecture guide](canonical-resources-and-runtime-projections.md)
explains the ownership model. This specification owns exact activation fields,
composition rules, target mappings, and conformance requirements. Agent roles,
tool mappings, hooks, and publication protocols remain outside its scope.
Persistent instruction delivery is specified in [persistent guidance](persistent-guidance.md).
“Must” and “must not” state requirements; examples illustrate them.

## 1. Canonical activation policy

### 1.1 Declaration

Authors declare semantic kind and activation policy in the `metadata` mapping
of the canonical `SKILL.md`. Workflows live under `skills/workflows/<name>/`;
stances live under `skills/stances/<name>/`. Those groups orient authors; the
explicit kind governs semantic validation and projection independently of path.

For example, an explicitly selected workflow at
`skills/workflows/behavioral-reconstruction/SKILL.md` would declare:

```yaml
---
name: behavioral-reconstruction
description: Reconstruct a system through an independently usable behavioral contract.
metadata:
  wycats.kind: workflow
  wycats.user-invocable: "true"
  wycats.invocation: explicit
---
```

The Markdown body follows the closing `---`. Reconstruction is illustrative;
the declaration does not add it to the package.

| Metadata field | Required string values | Meaning |
| --- | --- | --- |
| `wycats.kind` | `workflow` or `stance` | The semantic role of these instructions |
| `wycats.user-invocable` | `"true"` or `"false"` | Whether the resource belongs on the user's direct skill-selection surface |
| `wycats.invocation` | `contextual` or `explicit` | Whether relevance can select the resource, or user selection is required |

All three fields must be explicit in the grouped authoring format. The metadata
map has string values, following Agent Skills' extension convention. These keys
are interpreted by this compiler; a generic host assigns them no portable
activation guarantee. Each declaration governs only its resource, with no
plugin-wide default, directory inheritance, or per-target semantic override.

The source reader normalizes the declaration into typed kind and activation.
Adapters consume that model and remove the three authoring keys from generated
frontmatter. Unrelated metadata is preserved. Source location remains available
for diagnostics, provenance, and link resolution. Skill names remain globally
unique across stances and workflows; grouping adds no namespace to identity.

`name` identifies the resource; `description` explains applicability. Neither
overrides activation policy. Missing or non-string authoring values, unknown
values, duplicate YAML keys, and simultaneous top-level activation fields are
invalid. A stance must declare `wycats.user-invocable: "false"`.

The reader also accepts the earlier flat source format for existing fixtures and
consumers: top-level boolean `user-invocable` defaults to `true`, and top-level
`invocation` defaults to `contextual`. Its directory supplies the legacy kind.
An explicit authoring metadata declaration takes ownership of all three fields;
legacy and metadata activation declarations cannot coexist on one resource.

### 1.2 Meaning and supported combinations

An **invocation** adopts a resource's instructions as the workflow or stance
for the work. Reading, discussing, recommending, or linking to a resource does
not by itself invoke it.

A **contextual invocation** is the agent's selection of a resource because the
task or an active workflow makes it applicable. An **explicit invocation**
follows the user's direct selection of that resource for the task.

A request to run the named skill expresses explicit intent; mentioning it in a
design discussion does not. A host's skill selector or command is the portable
means of communicating that selection. Recognition of equivalent
natural-language requests is host-dependent.

| `user-invocable` | `invocation` | Meaning |
| --- | --- | --- |
| `true` | `contextual` | The user or agent can select the skill |
| `true` | `explicit` | The user selects the skill; relevance alone cannot activate it |
| `false` | `contextual` | The resource supports agent-selected or composed work without a direct user-facing entry |
| `false` | `explicit` | Invalid: this version defines no explicit entry for a resource removed from that surface |

Exposure and invocation answer different questions. `public`, `private`, and
`reference` describe a resource's intended discovery surface in the projection
plan. A public explicit-only skill remains `public`; requiring user selection
does not make it private.

This activation contract defines no disabled state; resource inclusion and
reference-only material remain target-plan decisions. Architectural distillation
remains contextual; reconstruction in section 1.1 requires explicit selection.

Explicit selection applies to the requested workflow instance. Its phases and
contextual helpers can proceed within that scope. It neither grants standing
permission to select the workflow for unrelated work nor alters tool and action
permissions. This is the canonical expectation for scope; native metadata does
not expire instructions already loaded into a conversation. For example,
[Claude's skill lifecycle](https://code.claude.com/docs/en/skills#skill-content-lifecycle)
retains invoked instructions across turns.

### 1.3 Composition

These policy checks apply to links from any canonical Markdown resource into a
skill or stance. Links targeting agents or instructions retain their existing
composition semantics; this contract assigns those targets no activation policy.

| Relationship | Meaning | Permitted target policy |
| --- | --- | --- |
| `composition:reference` | Makes the target available for consultation | `contextual` or `explicit` |
| `composition:load` | Requests activation when the surrounding prose's condition applies | `contextual` |

A reference to an explicit-only skill can help the user decide to select it;
consultation does not authorize execution. A load edge into an explicit-only
resource must fail validation, including when the source is itself
explicit-only. The validator does not interpret surrounding prose as proof of
user selection.

This restriction preserves explicit selection at the workflow's entry. An
explicitly selected workflow may load contextual helpers normally. The
composition index records these relationships without creating runtime
permission state.

## 2. Runtime projection

Projection translates normalized canonical policy for resources selected by a
package. Selection determines which resources are included; placement and
discovery make them available; native metadata expresses their activation
policy. Defining a mapping does not expand package selection.

### 2.1 Package locations and discovery

The output directory is the generated package root. The following output paths
are repository-relative; discovery paths in the last column are relative to
that package root. Installation may relocate the package without changing its
internal paths.

| Target | Default output directory | Discovery configured by this plugin |
| --- | --- | --- |
| VS Code / Copilot | `out/wycats/` | Agent Plugins 1.0 `plugin.json` declares the schema; skills use fixed immediate-child discovery under `skills/` |
| Claude Code | `out/claude-code/` | `.claude-plugin/plugin.json` identifies the plugin; skill paths are omitted for discovery under `skills/` |
| Codex | `out/codex/` | `.codex-plugin/plugin.json` declares `skills: "./skills/"` |
| Pi | `out/pi/` | `package.json` lists public skill directories in `pi.skills`; private stance paths are supplied separately to the Recon agent |

Workflows and stances are projected to `skills/<name>/SKILL.md` for VS Code,
Claude Code, and Codex. Pi uses `skills/<name>/SKILL.md` for workflows and
`stances/<name>/SKILL.md` for stances. Additional workflow references in the Pi profile use
`references/workflows/<name>/SKILL.md`; they remain outside native skill discovery.
Reference links can include further workflow references, while a load edge to an
omitted workflow still fails preflight. These paths are chosen from semantic kind
and identity, independently of the source directory. Native VS Code agents,
rules, and hooks use `com.github.copilot/agents/`, `com.github.copilot/rules/`,
and `com.github.copilot/hooks/hooks.json` respectively. Agents and rules retain
their source-relative paths within those directories; manifest
`extensions["com.github.copilot"]` entries list their exact paths with
`exclusive: true`. This preserves nested supporting-file links and keeps
supporting Markdown out of native discovery. Composition destinations
are resolved against these final locations before frontmatter is generated.

The mapping table describes the generated package. Its entries have different
authorities and therefore different reasons to change:

| Concern | Basis for the current mapping | What would change it |
| --- | --- | --- |
| VS Code package format | [Agent Plugins 1.0](https://code.visualstudio.com/docs/agent-customization/agent-plugins#plugin-formats) provides shared skill discovery; the Copilot namespace carries native components. | Supported host formats or native component contracts change. Source grouping is independent of this choice. |
| VS Code agent names | Emit `<manifest name>:<canonical agent name>`, including explicit source names. Frontmatter replaces the host's qualified fallback, and [delegation resolves the first matching name](https://github.com/microsoft/vscode/blob/7baac39ec3ca969dab74ac12c097f6a486e46593/src/vs/workbench/contrib/chat/common/tools/builtinTools/runSubagentTool.ts#L486-L489). Qualification distinguishes agents from differently named plugins. | The host separates local names from qualified runtime addresses, or gains unambiguous plugin-aware resolution. |
| Pi resource selection | Repository-owned scope: the [Pi profile](../scripts/pi-profile.ts) deliberately starts with Recon. | Another workflow is selected for support and its capabilities and delegated context are validated. Host format support alone does not expand the profile. |
| Codex skill depth | [Host requirement](https://developers.openai.com/plugins/deploy/submission-errors#skill-errors): immediate children of `skills/`. The adapter flattens source groups using globally unique skill names. | A new identity or host discovery contract requires different placement. |

Exact package membership and generated addresses belong to
`projection-resources.json`; Pi's delegated membership is defined by its profile.
These inventories change with the projection plan and are not repeated here.

### 2.2 Metadata translation

Adapters must consume normalized canonical `invocation`, remove it from generated frontmatter, retain
normalized `user-invocable`, and emit the following native invocation value for
each selected skill or stance. Values are emitted explicitly for both policies.
All locations in this table are relative to the projected `SKILL.md` directory.

| Target | Location | Property | `contextual` | `explicit` |
| --- | --- | --- | --- | --- |
| VS Code / Copilot | `SKILL.md` frontmatter | `disable-model-invocation` | `false` | `true` |
| Claude Code | `SKILL.md` frontmatter | `disable-model-invocation` | `false` | `true` |
| Codex | `agents/openai.yaml` | `policy.allow_implicit_invocation` | `true` | `false` |
| Pi | `SKILL.md` frontmatter | `disable-model-invocation` | `false` | `true` |

For reconstruction, the frontmatter-based targets receive:

```yaml
user-invocable: true
disable-model-invocation: true
```

Codex places its sidecar **inside the projected skill directory**:

```text
out/codex/
  .codex-plugin/plugin.json
  skills/behavioral-reconstruction/
    SKILL.md
    agents/openai.yaml
```

When no source sidecar exists, the complete generated sidecar for this example
is:

```yaml
interface:
  display_name: behavioral-reconstruction
  short_description: Reconstruct a system through an independently usable behavioral contract.
policy:
  allow_implicit_invocation: false
```

OpenAI's [plugin submission requirements](https://developers.openai.com/plugins/deploy/submission-errors#skill-agent-metadata-errors)
require nonempty `interface.display_name` and `interface.short_description`
strings when a sidecar is included. The adapter fills missing values from
canonical `name` and `description`, respectively, without rewriting their text.
An authored value takes precedence; an explicitly empty or incorrectly typed
value is an error. These are per-skill fields, separate from the plugin manifest's
interface.

An authored sidecar must be a UTF-8 YAML mapping. Canonical validation checks
its syntax, requires `policy` to be a mapping when present, and rejects an
authored invocation field. Codex preflight additionally requires `interface`
to be a mapping when present and checks the required interface strings.
Missing mappings are created in the generated sidecar. Other fields are
preserved as parsed values and remain subject to the host's native validation;
this contract does not define a complete sidecar-schema validator. Formatting
and YAML comments need not be preserved.

The sidecar path is derived from its owning resource's projected directory;
it is separate from package-root agent resources. Native command names and
plugin namespaces belong to the host envelope; canonical names remain
unqualified.

### 2.3 Ownership and preservation

`projection-resources.json` records canonical and generated resource addresses
relative to their roots, including when a build overrides its output directory.
Consumers use this map so a target can change its physical layout without
changing canonical identity or requiring each consumer to reconstruct it.

Canonical policy has one authoring location. The native activation keys in
section 2.2 are adapter-owned: source frontmatter must not declare
`disable-model-invocation`, and a source `agents/openai.yaml` support file must
leave `policy.allow_implicit_invocation` to the adapter. Duplicate declarations
are errors even when their values agree.

The adapter must preserve unrelated frontmatter values semantically and the
Markdown body's bytes except for existing composition-link destination rewrites.
Frontmatter may be reserialized.
Composition replacements must address the canonical text they were parsed from,
or use recomputed offsets after a frontmatter change; source offsets must not be
applied to shifted text. Activation policy is translated into metadata; the
adapter does not add behavioral prose to the body.

For a relocated stance, its sidecar and resource-local supporting files must
move with the resource, preserving their relative paths. Generated metadata
takes precedence over copied support files. Nested canonical resources own
their supporting files and must be projected independently; a parent copy must
not introduce a second, unplanned resource.

### 2.4 Host capabilities and limits

The native controls are documented by
[VS Code](https://code.visualstudio.com/docs/agent-customization/agent-skills),
[Claude Code](https://code.claude.com/docs/en/skills#control-who-invokes-a-skill),
[Codex](https://learn.chatgpt.com/docs/build-skills#optional-metadata), and
[Pi 0.85.1](https://github.com/badlogic/pi-mono/blob/v0.85.1/packages/coding-agent/docs/skills.md#frontmatter).
The VS Code mapping concerns Copilot's skill loader, not other agent hosts
running inside VS Code.

Invocation and visibility have distinct support:

| Target | Explicit-only invocation | Per-resource user-facing visibility |
| --- | --- | --- |
| VS Code / Copilot | Documented native control | Documents `user-invocable` as controlling the slash-command surface |
| Claude Code | Documented native control | Documents `user-invocable` as controlling user invocation |
| Codex | Documented native control | Support for hiding a skill through `user-invocable: false` is not established by the cited documentation |
| Pi 0.85.1 | Removes the skill from the automatic system-prompt catalog; `/skill:name` remains available | The inspected loader ignores `user-invocable`; retaining it does not implement native hiding |

Pi's [versioned loader](https://github.com/badlogic/pi-mono/blob/v0.85.1/packages/coding-agent/src/core/skills.ts)
confirms that field behavior. Its package/profile selection separately controls
which resources enter each catalog. Catalog omission is not an execution guard
against instructions obtained through another route.

The unverified Codex visibility mapping and unsupported Pi visibility field
prevent a claim of full activation-contract support, while leaving the
documented explicit-only mappings for public skills usable. Metadata governs
discovery and invocation, not filesystem isolation. These mappings establish
native skill entry behavior; alternate entry paths such as agent preloading and
scheduled invocation require separate host support rather than inheriting a
guarantee from the direct skill command.

If a target cannot express a selected resource's explicit-only policy, the
build must fail before replacing output and identify the target, resource, and
missing capability. Package selection may deliberately exclude the resource;
all remaining composition links must still resolve.

## 3. Conformance

Canonical validation checks types, supported combinations, duplicate policy
ownership, source sidecar syntax, and composition compatibility for all
discovered source resources.
Standalone validation and build preflight must accept and reject the same
canonical activation declarations. Target preflight checks selected resources,
including placement, sidecar validity, and capability support. Both phases finish
before generated output is replaced. Errors identify the canonical file and
offending field or link; target-specific errors also identify the target.

The following cases exercise distinct parts of the projection contract:

| Input | Required result |
| --- | --- |
| Legacy skill with both fields omitted | Normalize to `true` / `contextual`; emit the native contextual value |
| Grouped metadata missing kind or activation fields | Reject the incomplete declaration |
| Public explicit-only skill | Preserve public exposure; emit the native explicit-only value |
| Legacy `user-invocable: "false"` | Reject the string value |
| Metadata `wycats.user-invocable: false` | Reject the non-string value |
| Hidden explicit-only resource | Reject the unsupported combination |
| Reference to explicit-only skill | Retain the reference and rewrite its destination normally |
| Load edge into explicit-only skill | Reject the edge |
| Explicit-only skill loading a contextual stance | Permit the edge |
| Agent loading an explicit-only skill | Reject the edge |
| Skill loading an agent | Apply existing composition rules; do not require a skill activation policy on the agent |
| Codex resource without a source sidecar | Generate interface defaults from canonical name and description, plus native policy |
| Codex sidecar with unrelated interface metadata | Preserve that metadata and add generated policy |
| Malformed sidecar or scalar `policy` | Fail canonical validation before replacing output |
| Invalid Codex interface shape or required value | Fail Codex preflight before replacing output |
| Relocated stance with sidecar assets | Preserve the resource-relative sidecar and asset paths |
| Frontmatter change before a composition link | Preserve body bytes except the intended destination rewrite |
| Grouped workflow path for Codex | Relocate to immediate `skills/<name>/SKILL.md`; rewrite incoming and outgoing composition links |
| VS Code manifest | Emit the Agent Plugins 1.0 schema and portable metadata; components use fixed discovery paths |
| Source-authored native activation key | Reject duplicate policy ownership |
| Target without an explicit-only mapping | Fail before replacing output |

Projection tests establish what the package contains. Host conformance checks
record the host version and configuration and observe discovery, selection,
and invocation. For a public explicit-only skill, they exercise both relevant
ordinary requests and explicit selection. An ordinary request that happens not
to invoke the skill is insufficient evidence of enforcement.
