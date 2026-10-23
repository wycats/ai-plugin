# Runtime Projection Contract

A projection carries canonical instructions into a runtime while preserving the
choices those instructions express. Four questions govern that translation:

| Concept | Question | Authored on |
| --- | --- | --- |
| Activation | May relevance select this resource, or must the user select it? | The resource |
| Composition | Does this link request supporting instructions or offer a reference? | The relationship |
| Context | When should the supporting body be available to the agent doing the work? | A load relationship |
| Delivery | How does this runtime provide that body in the receiving conversation? | The generated projection |

The [architecture guide](canonical-resources-and-runtime-projections.md)
explains why canonical language owns these meanings. This contract defines the
fields, link grammar, mappings, and checks that preserve them. Agent roles,
general tool mappings, hooks, and publication protocols are specified elsewhere.
[Persistent guidance](persistent-guidance.md) covers standing instructions.

**Implementation status.** Activation, composition qualifiers, normalized context
scope, activity closure, and package checks are implemented. Each build emits an
intent-only context plan. A programmatic Copilot SDK bridge maps a selected
agent's activity closure to native preloading and supplies guidance for later
skill calls and consultation. The bounded authored route is Recon worker →
Recon → Relational Continuity. Standard package installation does not call this
bridge. Other entry routes in section 4.4 remain proposed mappings. Section 4.5
separates native capability evidence from the routes exercised here.

## 1. Resource activation

### 1.1 Selection and authority

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

Package selection determines whether a resource is included at all. This
activation contract defines no disabled state.

Explicit selection applies to the requested workflow instance. Its phases and
contextual helpers can proceed within that scope. It neither grants standing
permission to select the workflow for unrelated work nor alters tool and action
permissions. This is the canonical expectation for scope; native metadata does
not expire instructions already loaded into a conversation. For example,
[Claude's skill lifecycle](https://code.claude.com/docs/en/skills#skill-content-lifecycle)
retains invoked instructions across turns.

### 1.2 Declaration

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

## 2. Composition

### 2.1 Relationships

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

### 2.2 Link grammar

A composition link is an inline Markdown link with a relative destination
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

The activity qualifier defined in section 3.2 extends the load title. The
relative path identifies the target, the label describes the linked work, and
the title carries composition metadata. Host syntax belongs in the projection.

## 3. Context

Context is the material available in the conversation where the agent is doing
the work. A skill catalog offers names and descriptions for discovery. A load
relationship calls for the supporting body, so the agent can draw on its full
articulation when making the linked judgment.

`invocation: contextual` answers whether relevance may select a resource.
The `context` qualifier answers when a composed resource’s body should arrive
once the source activity is selected. Those are independent choices.

### 3.1 Scope

| Scope | When the body is useful | Delivery preference |
| --- | --- | --- |
| Passage | When the linked instruction or condition applies | Retrieve at that encounter if the body is not already available |
| Activity | From the beginning of the source activity | Include with the active source, or read at entry |

Scope belongs to the relationship. Observational Grounding can frame one
workflow and support a particular assessment in another. Giving the stance a
global preload setting would lose that distinction. A reference requests no
delivery scope because consultation remains the agent’s choice.

The author’s prose still determines how the instructions apply. Activity
context prepares the agent to recognize a situation without requiring that
situation to occur. Scope also makes no retention promise: a host may retain
a body after its work ends or require another read after compaction.

### 3.2 Declaration and normalization

The title `composition:load context=activity` requests activity context.
An unqualified `composition:load` retains passage scope.

Normalize the three authored forms as follows:

| Title | Relation | Context |
| --- | --- | --- |
| `composition:load` | `load` | `passage` |
| `composition:load context=activity` | `load` | `activity` |
| `composition:reference` | `reference` | Absent |

`context=activity` is the only authored qualifier. `passage` is the normalized
default, so authors express it by leaving the qualifier off. Unknown or repeated qualifiers and a
context qualifier on a reference are authoring errors. The qualifier is defined
for links into skills and stances. Links to other resource kinds retain their
existing semantics and accept no context qualifier in this extension.

For example:

```markdown
[Write for people who will encounter the design without this conversation](../../stances/public-design-reasoning/SKILL.md "composition:load context=activity").

When a consequential choice depends on their intent or experience,
[work through that choice with them](../../stances/collaborative-grounding/SKILL.md "composition:load").

[PER](../per-cycle/SKILL.md "composition:reference") provides a fuller approach
when a correction needs preparation and independent review.
```

The first link prepares the agent to write an RFC whose readers lack the
originating conversation. The second brings in supporting instructions when
the work depends on the user’s situated judgment. The third offers PER for
consultation under the reference semantics in section 2.

### 3.3 Choosing scope from the work

These canonical relationships illustrate how the work determines context
scope. Their source links declare the assignments below.

| Source encounter | Supporting resource | Scope and reason |
| --- | --- | --- |
| [RFC Writing](../skills/workflows/rfc-writing/SKILL.md), opening instruction to write for future readers | Public Design Reasoning | Activity. The audience shapes the initial account as well as later revisions. |
| [PER](../skills/workflows/per-cycle/SKILL.md), returning to observations as the explanation changes | Interpretive Synthesis | Activity. Readiness to revisit the account shapes preparation, execution, and review, even though a particular revision follows a discovery. |
| [Recon worker](../agents/recon-worker.agent.md), investigation method for its assignment | Recon | Activity. The workflow supplies the method for the worker’s assigned inquiry. |
| [GH Resolve Review Threads](../skills/workflows/gh-resolve-review-threads/SKILL.md), keeping evidence connected to its revision and conditions | Observational Grounding | Activity. Provenance matters from the first examination through publication and closure. |
| PER, establishing what an attempted run actually reached | Observational Grounding | Passage. Consult when that assessment is needed. The source does not request entry-time delivery. |
| GH Resolve Review Threads, drafting a reply attributed to the user | Authorial Continuity | Passage. Consult before drafting such a reply. An investigation can finish without one. |

A condition in the sentence does not by itself imply passage scope. PER’s
interpretive synthesis is useful from the start because it shapes how an agent
holds its expectations, before a surprise occurs. Conversely, a mandatory
judgment later in a workflow does not automatically need entry-time context.
The author chooses activity scope when having the full articulation early is
likely to change how the source activity is approached.

The sentence continues to own the situation, purpose, and extent of the work.
Loading Authorial Continuity would not require writing a reply, and loading a
workflow would not grant permission for its external actions. Context delivery
changes what the agent can draw on. Invocation and action authority retain the
boundaries in sections 1 and 2.

### 3.4 Composing the receiving context

Delivery starts from an active source, rather than every resource in a package.
Reading a resource to discuss or review it does not activate its load edges.
When an active source has an activity-scoped load, its target joins the entry
context. Follow that target’s own activity-scoped loads, deduplicating canonical
identities and stopping cycles. Preserve each originating link for provenance.
Passage loads wait for their encounter. Reference edges contribute no preload
request. A target reached later through a passage load brings its own activity
context when its instructions are adopted.

Existing unqualified links retain their prose-governed timing. Migration must
review each proposed activity qualifier, rather than infer one from a stance’s
name, its frequency, or its position near the beginning of a file. The closure
contains the selected bodies, not every link found in those bodies.

Reusing a body already available in the receiving conversation avoids an
unnecessary read. Availability in a coordinator’s conversation does not
establish availability in a worker’s. Compaction or continuation can also make
another read useful. This contract does not define permanent loaded flags.

## 4. Runtime projection

A delivery plan combines the selected resources, their canonical policies and
relationships, and the capabilities of a particular entry route. Package
membership determines what can be delivered. Defining a mapping does not add
resources to that membership.

### 4.1 Package locations and discovery

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

### 4.2 Activation metadata

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

If a target cannot express a selected resource's explicit-only policy, the
build must fail before replacing output and identify the target, resource, and
missing capability. Package selection may deliberately exclude the resource;
all remaining composition links must still resolve.

### 4.3 Ownership and preservation

`projection-resources.json` records canonical and generated resource addresses
relative to their roots, including when a build overrides its output directory.
Consumers use this map so a target can change its physical layout without
changing canonical identity or requiring each consumer to reconstruct it.

Canonical policy has one authoring location. The native activation keys in
section 4.2 are adapter-owned: source frontmatter must not declare
`disable-model-invocation`, and a source `agents/openai.yaml` support file must
leave `policy.allow_implicit_invocation` to the adapter. Duplicate declarations
are errors even when their values agree.

The adapter must preserve unrelated frontmatter values semantically.
Package adapters preserve the Markdown body’s bytes except for composition-link
destination rewrites. The SDK bridge adds the generated delivery envelope
described in section 4.4. The contract also permits adapters to change
composition-link syntax where a host requires it.
The link label and surrounding authored prose remain unchanged. Frontmatter may
be reserialized.
Composition replacements must address the canonical text they were parsed from,
or use recomputed offsets after a frontmatter change; source offsets must not be
applied to shifted text. Activation policy is translated into metadata.
Delivery guidance belongs in the generated envelope described in section 4.4,
with its origin distinguishable from the authored body.

For a relocated stance, its sidecar and resource-local supporting files must
move with the resource, preserving their relative paths. Generated metadata
takes precedence over copied support files. Nested canonical resources own
their supporting files and must be projected independently; a parent copy must
not introduce a second, unplanned resource.

### 4.4 Context delivery

An adapter resolves each edge to the target’s projected address and, where
available, its native skill identity. It translates the relationship and
context scope into a delivery mechanism for the receiving conversation.

For activity context, prefer a native preload facility that includes the full
bodies in the receiving agent’s context. Where that facility is unavailable,
generated entry guidance must identify the resources to read before beginning
the source activity.

For passage loads, retain the linked action and provide the native invocation
identity or readable address needed when the passage applies. Native invocation
is suitable only when it delivers the target into the same reasoning context
without introducing a separate task or effects. An input-side slash command
written inside a skill is not a model-callable invocation mechanism.

References remain available for consultation. Adapters must avoid automatic
reference expansion that would also pull passage loads or consultation links
into the activity’s entry context. Where a host automatically follows Markdown
links, the projection can render those addresses as non-expanding text and
supply explicit read guidance. The reading edition retains usable hyperlinks.
A global setting that expands every link is not a selective preload mapping.

The generated envelope may explain the delivery convention and list resolved
addresses or native identities. For example:

> Read the listed activity context before beginning this workflow, if it is not
> already available here. When a passage with a load link applies, consult its
> supporting instructions before making that judgment. Reference links are
> available for consultation as needed.

Adapters may express this through native fields instead of prose. They must
preserve the author’s conditions and avoid summarizing the supporting stance
into a second definition. Retrieval guidance supplies the route to the body.
It does not prescribe what conclusion the agent should reach after reading it.

The composition index must retain canonical identity, source location, relation,
and normalized context scope even when a host’s output omits the title.
Delivery plans must record the selected mechanism and the limits of its support
for the particular entry route. A declared read fallback is a valid mapping.
A missing or unreadable target is a preflight error. Package construction alone
cannot establish whether the executing agent will make the requested read.

#### Implemented package and SDK path

`composition-index.json` retains schema version 2 and adds `context` to load
edges. Reference edges have no context field. `context-delivery.json` records
each projected source's activity closure and the canonical edges that produced
it, including cycle and duplicate provenance. Its `status: intent-only` means
that the package has recorded the relationships without choosing a runtime
retrieval mechanism.

[`copilotAgentContext`](../scripts/copilot-context.ts) takes a canonical
composition, its built VS Code projection plan, and an agent identity. It returns
an SDK custom-agent configuration, a skill provider, and a delivery record.
The agent's native `skills` field contains its activity closure. The provider
advertises reachable load targets for later invocation. Reference-only targets
remain available through their projected files. The bridge verifies that all
advertised files are readable before returning.

A caller with an SDK client and a built projection can attach the result to a
session:

```ts
const context = await copilotAgentContext(composition, plan, "agent:recon-worker");
const session = await client.createSession({
  ...sessionOptions,
  enableSkills: true,
  customAgents: [context.agent],
  agent: context.agent.name,
  skillProvider: context.skillProvider,
});
```

The caller supplies the model, tools, permissions, working directory, and
configuration discovery policy. Later loads require the native `skill` tool.
Consultation requires an authorized file-reading capability. The bridge creates
no session and grants no permission itself. Rebuild the projection before
constructing the bridge when canonical resources change.

A later skill invocation receives its own activity dependencies as entry-read
guidance. Native preloading is qualified for the selected agent's startup only.
The bridge preserves each authored body after projecting its destinations and
adds a visibly generated envelope with retrieval names and file addresses.
The SDK setup is programmatic. It is not yet connected to the installed VS Code
extension's session creation or to a delegated child's creation.

The mappings below are specific to their entry routes. Section 4.5 supplies
sources for the capability evidence.

| Runtime and entry route | Mapping for activity context | Mapping for passage loads | Evidence and qualification |
| --- | --- | --- | --- |
| Claude Code custom subagent | Populate the agent’s native `skills` list with the activity closure | Supply native Skill identity where invocation is eligible, otherwise a readable path | Full-body subagent preloading is documented. It does not establish a dependency field for every top-level skill invocation. |
| Copilot SDK custom agent | Populate `CustomAgentConfig.skills` from the activity closure | Native `skill` tool with the resolved name, or explicit read guidance | Installed runtime `1.0.95-0.unstable.r38345923974.g3754b70`, protocol 3: the generated Recon worker received Recon and Relational Continuity at entry, and a later native skill call put Observational Grounding into the model conversation. Scripted model responses tested delivery. VS Code UI forwarding and delegated-child delivery were not exercised. |
| VS Code Local attached prompt or instruction context | Native reference attachment is usable only when the projected reference set matches the requested activity context | Emit a non-expanding address and read or eligible skill-tool guidance | Upstream collector recognizes both Markdown and `#file:` references, including recursive skill references. Its setting defaults off, with an Edit-mode exception. This is a different path from SDK skill loading. |
| Codex skill or agent context | Generated entry read guidance unless the particular entry route has separately qualified preloading | Resolved file or resource address and explicit read guidance | Current package metadata controls selection eligibility. No native skill-to-skill preload field has been established here. |
| Pi skill context | Generated entry read guidance | Resolved path and read guidance, consistent with Pi’s catalog instructions | Pi instructs the model to read matching skills. `/skill:name` expands input before inference and is not a tool an embedded link invokes. |

### 4.5 Runtime qualification

#### Selection and visibility

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
discovery and invocation, not filesystem isolation. These findings qualify native skill entry behavior. Preloading and scheduled
invocation need evidence from their own entry routes.

#### Context delivery evidence

The delivery investigation below was conducted on 21 October 2026. The older
selection and visibility findings above retain their stated version boundaries.

Claude’s [subagent documentation](https://code.claude.com/docs/en/sub-agents#preload-skills-into-subagents)
describes the preload field. Pi’s [catalog construction](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/src/core/skills.ts)
and [input expansion](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/src/core/agent-session.ts)
show its distinct retrieval paths. The Copilot fixture used a scripted loopback
endpoint with no live inference, so it tests body delivery rather than model
selection or judgment. Neither ordinary links nor `#file:` references inside
the preloaded fixture pulled in their targets.

The subsequent generated-context probe exercised `copilotAgentContext` with the
real Recon worker. It observed both activity bodies once in the initial model
request and a conditional body's arrival after a native tool call. A separate
fresh Codex agent used explicit file-read guidance to investigate the repository's
integration boundary. It reached the supported conclusion, while also consulting
a stance during a simple preliminary lookup. This supplies a useful work example,
not a causal estimate of improved judgment or economical retrieval. Installed
VS Code sessions and delegated-child delivery remain unqualified. The
local trial account (`.runtime/context-delivery-trial/README.md`, retained in the
development checkout) records the setup, receipts, findings, and replay command.
The deterministic bridge coverage ships in `scripts/context-delivery.test.ts`.

For VS Code Local, the inspected upstream commit is
`f7d212e976a9c0df9bed2759f21c4429591e7717`:
[reference collector](https://github.com/microsoft/vscode/blob/f7d212e976a9c0df9bed2759f21c4429591e7717/src/vs/workbench/contrib/chat/common/promptSyntax/computeAutomaticInstructions.ts),
[file types](https://github.com/microsoft/vscode/blob/f7d212e976a9c0df9bed2759f21c4429591e7717/src/vs/workbench/contrib/chat/common/promptSyntax/config/promptFileLocations.ts),
and [setting](https://github.com/microsoft/vscode/blob/f7d212e976a9c0df9bed2759f21c4429591e7717/src/vs/workbench/contrib/chat/browser/chat.shared.contribution.ts#L2202-L2209).
Its [reference parser](https://github.com/microsoft/vscode/blob/f7d212e976a9c0df9bed2759f21c4429591e7717/src/vs/workbench/contrib/chat/common/promptSyntax/promptFileParser.ts)
includes a Markdown title in the extracted path. Adapters targeting that
collector must consume our composition title before producing native references.
An untitled Markdown link and `#file:` both supply a path there. Changing syntax
alone does not establish selective loading or support in another VS Code harness.

## 5. Conformance

Conformance separates three claims: the package represents the intended
relationships, the runtime delivers the bodies through the specified route,
and those bodies help the agent’s judgment. A package check cannot establish
the latter two. Record each result with its evidence.

### 5.1 Canonical and package checks

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

### 5.2 Delivery-plan checks

The parser, closure planner, and SDK bridge have focused coverage for normalization,
cycles, mixed encounters, explicit-only boundaries, body preservation, and missing
projected files. Cases involving other native entry routes remain qualification
requirements for their adapters.

| Case | Required result |
| --- | --- |
| Existing unqualified load | Preserve its condition and normalize to passage context |
| Activity-qualified load | Normalize the scope and include the target in the entry delivery plan |
| Reference with a context qualifier, unknown qualifier, or qualified non-skill target | Reject with the canonical location |
| Activity edge into an explicit-only skill | Reject under the existing activation boundary |
| A → B activity, B → C passage | Entry closure contains B, with C available for its later encounter |
| Repeated targets or an activity cycle | Deliver each canonical body once per delivery plan and retain edge provenance |
| Same target reached through activity and passage edges | Deliver once through activity context and preserve both authored encounters |
| Native preloading unavailable | Emit a declared entry-read fallback with resolvable addresses |
| Host reference parser expands all links | Use a representation that preserves the requested delivery scopes |
| Native tool identity differs from the package path | Resolve both from the target projection rather than guessing from the link label |
| Source inspected for review rather than adopted | Inspection alone creates no load request |

### 5.3 Runtime probes and work trials

Host conformance checks record the host version and configuration and observe discovery, selection,
and invocation. For a public explicit-only skill, they exercise both relevant
ordinary requests and explicit selection. An ordinary request that happens not
to invoke the skill is insufficient evidence of enforcement.

Runtime probes must exercise the actual receiving context. Include a worker
whose coordinator has already read the resource, and a skill invoked directly
without an agent preload field. A capability proved through one route must not
be reported as support for the other. Generated guidance and rewritten link
syntax need preservation checks alongside the existing destination tests.

Work trials should include a condition that arises later and one that never
arises. Examine whether the agent notices a consequential distinction, revisits
an explanation, or recognizes where the user’s judgment is needed. Record
unnecessary consultation and interference from early context as well. A read
receipt establishes access to the material. The account and resulting work
show whether it helped.
