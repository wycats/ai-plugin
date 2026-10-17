# Curated Upstream Subset Consumption

**Status:** proposal / request-for-direction
**Author:** Leah Silber (tildeio/daily-skills)

## Summary

This repository already authors canonical resources and projects them into three
runtimes. It does not yet describe how a **downstream consumer** adopts a *subset*
of those resources and presents it through the same runtimes, alongside resources
the consumer authors itself.

`docs/canonical-resources-and-runtime-projections.md` anticipates this: "A shared
corpus can live in a neutral home while this plugin consumes and projects it under
the same authority boundary." This proposal describes what that authority boundary
requires once the corpus is consumed selectively, and what would have to be proven
in the existing three-target build before any of it becomes reusable machinery.

A real consumer supplied the evidence. It is summarized below, not used as a
template: the failures show which questions the subset case forces, and the
answers come from the governing principle rather than from the consumer's script.

## The governing principle

From `docs/canonical-resources-and-runtime-projections.md`:

> Coherence preserves a stable relational structure across situated projections.
> The canonical articulation governs changes to that structure; projections adapt
> it to a task, timescale, or runtime without becoming a competing source of
> meaning.

With three consequences the same document already draws, which this proposal
treats as binding:

> A projection may reinforce or apply the canonical resource; it should not
> acquire independent authority to redefine it.

> Treat a rewritten projection as a semantic change unless the difference is
> confined to the host envelope.

> When a runtime simply lacks the required capability, describe the omission as
> capability loss rather than simulating equivalence through different guidance.

Selective consumption does not introduce a new principle. It stresses this one at
a point the current build never reaches, because the current build takes
everything and answers to a single source.

## What is already owed, and what selection adds

These are two different obligations, and collapsing them was the flaw in the
previous draft.

### Already owed: reporting what a target could not activate

The build **already filters by target**. Codex packages no active hooks or
instructions, and its agents arrive as reference material rather than something
it can run. Those are omissions the principle already asks to be described as
capability loss, and no
projection-fidelity check implements that stated guarantee today:
`scripts/validate.ts` checks the canonical tree, while `scripts/test-cc.ts` is a
live smoke test against a running CLI.

So this is not a subset problem. It is an existing gap that selective
consumption makes *more* visible, because a consumer who deliberately adopts a
hook has a much stronger claim to be told when a host silently drops it.

### What selection adds

A second project chooses part of the canonical collection. The build must then
carry three things it has never had to carry, because taking everything made
them unnecessary:

1. **What was chosen.** A selection is a claim about canonical resources, and it
   has to survive into every projection intact.
2. **Where those resources came from.** One corpus needs no attribution. Two
   sources, or a consumer's own resources beside an upstream's, need it on every
   identity.
3. **What must accompany them.** Every host receives all stances today,
   so closure is never computed. A subset must know what a chosen resource
   requires in order to still be the resource that was authored.

Only then is the same choice projected to each host—where the reporting
obligation above applies as it already should have.

### The evidence

A consumer (`tildeio/daily-skills`) adopted three resources from this repository
into Claude Code, alongside its own authored skills. Two failures followed, both
of which the principle already forbids:

- **One resource arrived without the resources it needs.** `dangling-thread-review`
  was copied on its own, while the five stances it composes were not. What the
  consumer holds answers "what does this workflow do" differently from the
  canonical resource, which is the definition of a competing authority.
- **One model role was rewritten without recording the choice.** The abstract role
  `auxiliary` was replaced with a concrete model by the consumer, silently. The
  substitution may be perfectly legitimate; making it invisible is what puts it
  outside the host envelope, because nothing downstream can tell whether a
  deliberate binding or an accident produced the result.

Both are consequences of copying files rather than adopting canonical resources.
The requirements below are what the principle asks for instead.

## Requirements

### R1. Identity must carry its source, and survive projection

`<section>/<name>` addresses a resource inside one corpus. It stops working the
moment a consumer combines its own resources with an upstream corpus, or adopts a
second upstream: the same address can then name resources owned by different
authorities, and "which canonical articulation governs this?" becomes ambiguous.

The logical identity is a tuple: source authority, resource section, and canonical
name. The string form used in these examples is
`<source-alias>:<section>/<name>`, with source aliases and names restricted to
lowercase ASCII letters, digits, `.`, `_`, and `-`, beginning with a letter or
digit; the section is one of the canonical resource sections. Validation rejects
components outside that grammar before parsing. A structured representation or a
different escaped encoding is also possible, but it must round-trip the same tuple
without assigning separator characters to more than one component.

Three consequences, in the order they bite.

**Identity extraction is per-section, and does not exist uniformly yet.** Skills
and stances match `name` to their directory and `scripts/validate.ts` enforces it.
Agents are `agents/*.agent.md` files, most of which declare no `name` at all, so
`agents/execute` is a filename convention rather than an enforced invariant.
Instructions carry no canonical `name`; hooks name themselves inside their
manifests. A resolver written against the skill rule would fail on three of the
five sections. So identity extraction has to be defined per section, or validation
has to create the invariant first—the proposal should not assume the problem
away. The result must also identify exactly one resource within a source and
section. If two hook manifests declare the same name, validation fails before
either can enter a selection or lock.

**Source qualification is added at the boundary that knows the sources.** An
upstream canonical resource names requirements from its own source unqualified;
the consumer's resolver adds the source qualification when it adopts them. A
consumer-authored resource can also require something from an adopted source,
but its canonical metadata cannot name an alias owned by one particular
selection. A cross-source requirement is therefore structured as a stable source
authority, section, and canonical name. For example:

```json
{
  "authority": {
    "provider": "github",
    "kind": "repository-id",
    "id": "<provider-issued immutable repository id>"
  },
  "section": "stances",
  "name": "collaborative-grounding"
}
```

The resolver matches that authority to exactly one resolved source in the
selection, then uses the selection's alias when it records the qualified identity
in the lock. A missing or ambiguous match fails closure. Unqualified requirements
always refer to the resource's own source.

Writing a consumer's alias into upstream canonical files would make their metadata
depend on a name a second consumer is free to choose differently, so two consumers
would disagree about the same dependency string. Authority runs the other way:
the upstream corpus names its own contents, and the consumer names the relationship
between sources it chose.

The alias is a consumer-local address, not the source's identity. A repository
slug is also a locator, not an authority: it can be renamed, transferred, or
reused. The source adapter authenticates the locator and resolves it to a durable
provider-issued identifier, or another immutable authenticated identity, before
matching requirements or locking the source. A selection can declare that
authority only once. Two aliases that resolve to the same authority do not create
two sources; the duplicate declaration fails before either ref is resolved.

Source manifests, canonical resource contracts, dependency metadata, the
selection, the lock, and target configurations are parsed without losing what the
author wrote. Duplicate members fail before any document is converted into
ordinary maps; a parser cannot silently keep the last of two source declarations,
resource entries, canonical-input bindings, role bindings, or requirements and
present that as the reviewed intent.

A source manifest has its own independently validated `formatVersion`. That
version establishes the grammar for authority, canonical input boundaries,
contract selection, dependency metadata, and redistribution before the resolver
uses any of those fields. A toolchain digest cannot supply field meaning for an
unversioned manifest it has already had to interpret.

Every source locator also determines one manifest locator before the manifest is
read. A selection may name that confined source-relative path explicitly, as the
worked example does, or invoke a versioned source-adapter convention that yields
exactly one path. Guessing among repository files or accepting multiple candidates
is not deterministic discovery.

When the canonical resource contract or dependency metadata lives in a separate
document, that document has an independently validated `formatVersion` for the
same reason. Bytes and tool identities preserve an encoding; they do not define
the semantics of fields the resolver must understand first.

The consumer's own canonical corpus is a source under the same model, with the
reserved alias `consumer`. The build establishes the consumer project root before
reading the selection. Before accepting the manifest's authority declaration, the
local source adapter authenticates the root's reviewed repository locator to the
provider-issued identity pinned by the selection and verifies that the root is a
checkout of that repository. A copied or forked checkout therefore cannot inherit
the original consumer authority by repeating its manifest. The selection's
manifest locator must remain beneath the authenticated root lexically and after
resolution, without an absolute path, traversal, or symlink escape. The manifest
then declares the same stable authority identity and canonical input boundary, and
belongs to the source tree it declares. Its
resources use identities such as `consumer:skills/housekeeping`. They participate
in dependency closure, collision handling, locking, and adapter reports exactly
like adopted resources. The local source adapter resolves the declared canonical
source tree to a reproducible digest, so "local" does not become an exemption from
provenance. That tree contains the manifest, canonical authoring surfaces, source
contract, and redistribution artifacts, while excluding the selection, lock, and
generated projections. The lock therefore describes the consumer snapshot without
becoming part of the snapshot it describes. Exclusion from the source snapshot
does not make the selection ephemeral: the lock bundle retains the reviewed
selection separately, content-addresses its canonical bytes, and binds resolution
to that digest so `check` can recover the hand-authored sources, refs, resources,
closure mode, and evidence authorization root.

**Qualified identity has to survive projection.** Hosts consume flat names within
each resource section—`skills/<name>/SKILL.md`, `agents/<name>.agent.md`—so two
distinct canonical resources can collapse to one host-visible name. That is a real
case as soon as a consumer's own skill shares a name with an adopted one. The
target must either preserve the distinction through native namespacing, or
**report that it cannot represent both**. It must never silently overwrite one.
Collision detection uses the target's effective name and path rules, including
case folding, Unicode normalization, and reserved names, rather than comparing
canonical identity strings alone.

Automatic renaming is not a safe fallback here. A resource's name and discovery
behavior are part of how it gets activated, so renaming to dodge a collision
changes when the resource applies—a semantic change wearing the clothes of a
host envelope change.

### R2. Selection is host-independent

What a consumer adopts is a statement about canonical resources. It does not
change because a different runtime is being built.

The target therefore does not belong in the selection: it belongs to the build
configuration or command, exactly as the target-specific `config*.example.json`
templates already separate host concerns from canonical content. One selection is
presented to the VS Code, Claude Code, and Codex adapters in turn, which yields
**one choice and three honest presentations of it** rather than three subtly
different corpora. Each build receives its target adapter and configuration. Those
inputs determine how the selection is presented, not what was selected.

The projected resource set is therefore exact. For each target, active
projections, reference-only copies, and resources reported as unrepresentable
must partition the resolved post-closure set. Reference-only is a structural
status, not an active projection: it maps the copied output while stating that
the host does not discover or activate it. An adapter cannot discover and copy
another canonical resource merely because it shares the same source tree.
Generated manifests, notices, and other packaging support files are listed
separately with their provenance and cannot create an additional host-discoverable
resource. When several selected resources contribute to one emitted runtime or
package tree, each shared file appears once as support output with the exhaustive
set of contributing source-qualified identities. It is not assigned to one
resource or duplicated under every contributor.

Support metadata cannot advertise resources outside the active projection either.
Descriptions, capabilities, and default prompts that name or imply a resource are
generated from the resolved active set or validated against it. A dangling prompt
for an unselected or unavailable skill fails the target build instead of escaping
the resource partition because it lives in a plugin manifest.

Those target inputs also respect the same source boundary as resource identity.
An abstract model role, tool group, or hook matcher role is source-local unless
the contributing sources explicitly adopt a compatible shared role contract. A
shared role contract has an authority-qualified identity, versioned semantic
bytes, and a complete digest record. Each source contract names that exact record,
which is the source's assent to share the meaning. The lock retains the shared
contract and both source declarations, and an independently implemented
compatibility validator binds their digests to its result. The target configuration
therefore binds a source-qualified role, a resource-qualified role, or that locked
shared-contract identity; one bare global mapping cannot silently bind independent
authorities that happen to use the same token.

Target configurations use one versioned grammar across all three adapters, with
target-specific values. A source binding resolves roles only for resources from
that source. A resource binding can refine that source's value for one qualified
identity. Duplicate bindings fail before interpretation, and a resource binding
for a role the resource did not declare is invalid.

```jsonc
{
  "formatVersion": "<target-configuration-format version>",
  "target": "claude-code",
  "providerAuthorities": {
    // Reviewed target intent. Generated reports can bind to this trust root but
    // cannot authorize their own provider signer or policy.
    "claude-code-native-contracts": {
      "providerAuthority": "<immutable Claude Code provider authority>",
      "signer": "<immutable authorized native-contract signer>",
      "trustPolicy": {
        "id": "<versioned native-contract provider trust policy>",
        "digestAlgorithm": "<canonical-provider-trust-policy-digest version>",
        "digest": "sha256:…"
      }
    },
    "claude-code-build-identities": {
      "providerAuthority": "<immutable Claude Code provider authority>",
      "signer": "<immutable authorized host-build identity signer>",
      "trustPolicy": {
        "id": "<versioned host-build identity trust policy>",
        "path": "policies/claude-code-host-build-identity.json",
        "digestAlgorithm": "<canonical-provider-trust-policy-digest version>",
        "digest": "sha256:…"
      }
    }
  },
  "sources": {
    "wycats-plugin": {
      "models": {
        "fast": "opus"
      },
      "toolGroups": {
        "core": ["Read", "Grep", "Glob", "WebFetch", "WebSearch", "TodoWrite"],
        "agent": ["Agent"],
        "browser": ["WebFetch", "WebSearch"],
        "memory": ["Read", "Write"],
        "exo": [],
        "terminal": ["Bash", "BashOutput", "KillShell"],
        "terminal-minimal": ["Bash"],
        "testing": ["Bash"],
        "github": ["Bash"]
      },
      "hookMatchers": {
        "terminal": "Bash"
      }
    },
    "consumer": {
      "models": {},
      "toolGroups": {},
      "hookMatchers": {}
    }
  },
  "sharedRoleContracts": {
    // Applies only to source-local roles whose source contracts assent to this
    // exact locked shared-contract identity and compatibility proof.
    "shared-contracts.example:model-role/auxiliary": {
      "model": "sonnet"
    }
  },
  "resources": {
    // Optional exact-identity refinements. These override only the named source
    // binding and cannot introduce a role absent from the canonical resource.
    "wycats-plugin:agents/recon": {
      "models": { "fast": "opus" }
    }
  }
}
```

The source contract versions the canonical reference grammar. In that grammar,
model roles, tool groups, and hook matcher roles use typed structured references;
for example, `{ "role": "fast" }` and `{ "literal": "fast" }` cannot be confused.
A bare string cannot become a role because a target configuration happens to
contain the same text. A snapshot whose contract leaves that distinction
ambiguous is incompatible until its own authority migrates the encoding.

Every declared reference must resolve through one explicit applicable binding
before projection. A missing or ambiguous source, shared-contract, or
resource-level binding fails the build. An explicit `null` remains a reviewed
choice to delegate a model to the host default; absence is not treated as that
choice.

Target configuration also pins the provider authority, signer, and complete trust-
policy digest record for host-native capability contracts. The generated adapter
report must bind its provider attestation to that reviewed target intent; a report
cannot establish a capability by supplying the policy that authorizes itself.

### R3. Availability closure, kept separate from composition

A chosen resource must arrive with everything it needs. That requires
machine-readable knowledge of what a resource depends on, which today exists only
as prose.

The distinction that matters: **composition is part of a skill's meaning** and
belongs to the canonical articulation. It says which stance enters when, what it
contributes, and how the workflow moves between them. A resolver does not need any
of that. It needs to know which resources must be **available**.

So the metadata should not become a flattened second description of composition,
competing with the prose that owns it. **`requires-resources`** tells the resolver
which canonical resources to bring along. **`requires-capabilities`** names
versioned, source-owned semantic contracts that a target must satisfy natively,
such as parallel exploratory delegation. Neither field explains how the workflow
uses what it requires; the canonical prose still owns that. The distinction lets
validation confirm resource identities at the source boundary and capability
bindings at each target boundary.

Seven constraints on closure follow from R1 and from what the corpus actually
contains:

- **It names any canonical identity, not only stances.** `agents/recon` instructs
  the agent to load the `recon` *skill* as well as stances. A stance-only schema
  would recreate the same incomplete-closure failure one section over.
- **Host-native requirements are capabilities, not imaginary resources.** A
  capability requirement has its own structured identity: source authority,
  `kind: capability-contract`, canonical capability name, contract version, and
  contract digest. It does not borrow a canonical resource section or enter the
  resource-identity grammar from R1. It enters the locked requirement set without
  adding a file to the resolved resource set. Each target must bind that contract
  to a concrete native facility and validate the binding, or mark the dependent
  resource reference-only or unrepresentable. A display name such as `Explore` is
  explanatory context, not the capability identity.
- **Unqualified requirements are source-local** (`stances/gap-reading`). The
  consumer's resolver qualifies them during adoption, per R1. A cross-source
  requirement uses a source-qualified identity declared at the consumer boundary.
- **Closure continues through what it adds.** A newly added resource can have
  requirements of its own, so the resolver follows them until the set stops
  growing. Selecting `agents/recon`, for example, must also bring the stances
  required by the `recon` skill that closure adds.
- **Target availability propagates through requirements.** Host-neutral closure
  brings required resource identities and bytes and carries capability contracts
  into the lock; it does not make a reference-only dependency or an unavailable
  host facility executable. Before a target calls a resource active, every
  resource requirement must have an active projection, and every capability
  requirement must have a native binding whose compatibility is established by a
  separately retained validator or verifiable proof bound to both contract
  digests. The native contract must also be provider-authenticated as belonging to
  the immutable host build in the report, or an independent retained probe must
  exercise that host executable and bind its result to the host build and both
  contracts. Repeating the adapter's own `compatible` assertion is not validation.
  A host-native replacement for
  a canonical resource is not enough: if that behavior is genuinely a portable
  requirement, the source must articulate it as a capability contract. Otherwise
  the dependent resource is reference-only or unrepresentable too. The target
  starts with every structurally active resource whose direct capability bindings
  are validated, then repeatedly removes any resource whose required resource is
  no longer in that candidate set or whose required capability is unavailable.
  The finite set can only shrink, so this computes one greatest fixed point. A
  requirement cycle remains active only when every member is structurally active,
  every capability requirement is validated, and every dependency leaving the
  cycle remains active; otherwise removal propagates through the cycle. The
  adapter report records each causal requirement.
  Packaging a worker prompt as source material cannot satisfy an active skill that
  dispatches that worker.
- **Strict and resolving closure compute the same requirement set.** Resolving
  mode adds missing resources until it reaches that fixed point. Strict mode adds
  nothing: it fails when any required identity is absent and succeeds only when
  the explicit selection already contains the complete set.
- **It must be parsed as structured data.** This is an implementation obligation
  rather than an argument for any particular placement: wherever the field lives,
  discovery and validation have to read a real list. If it lives in frontmatter,
  the current scalar parser needs replacing or extending with real YAML parsing —
  a list silently read as a string is exactly the class of failure this proposal
  exists to prevent.

### R4. Provenance: intent in the selection, resolution in the lock

Three artifacts, each answering one question, in one direction:

1. **The selection states intent.** It names the sources the consumer adopts
   from, each source's expected immutable authority, the intended upstream ref,
   and the identities chosen. This is hand-authored and reviewable. An update
   fails if a mutable locator now authenticates as a different authority. Git
   selectors use fully qualified refs such as `refs/heads/main`; a short name
   cannot choose between a branch and tag with the same name.
2. **The lock records resolution.** Per source: the exact commit the intended ref
   resolved to, retained resolution evidence when that selector is mutable, and
   the stable authority identity behind the consumer's alias, plus the
   redistribution terms and required notices established by that snapshot. It
   also records the **dependency closure** that was computed and a digest for each
   **complete resource** in the post-closure set. Per target, it records the exact
   execution semantics, adapter, configuration, and packaging inputs that
   determine the installable.
3. **`check` verifies both edges.** That the lock still satisfies the selection,
   and that each installable and adapter report match every locked transformation
   input. The second half is what catches a hand-edited or stale downstream file,
   and it is not answerable from the lock alone.

`check` starts from an independently authenticated consumer review record, such
as an immutable consumer commit or signed release statement, that names the
reviewed selection digest, every target-configuration digest, and the reviewed
consumer-source revision and canonical tree digest. It also names every
independent validator whose result permits acceptance, including closure,
shared-role and capability compatibility, evidence aggregation, and each target's
projection-diff validator. The record binds each validator's rules or semantics
and runtime as well as its implementation. That record and its expected consumer
authority are inputs to verification from outside the copied lock bundle. The
lock retains the same bindings so they can be inspected, but cannot replace the
selection, consumer resources, a target's bindings, provider trust roots, or a
validator, and its own trust root together and remain valid.

The selection and lock each carry their own format version. Validation uses that
version to establish the document grammar, identity encoding, and closure
semantics before interpreting the document. A digest of the current toolchain
cannot supply that meaning for an older document whose format was never named.

Nine details complete that account:

- **Digest the post-closure set, not the selection.** With closure resolution on,
  the consumer ships resources it never listed—the closure additions in Appendix
  B are exactly that. Recording digests only for chosen identities leaves
  everything auto-included without provenance, so the lock could not verify what
  the projection actually consumed.
- **One source authority resolves to one snapshot; no per-resource refs.** It is
  tempting to let each resource pin its own commit, and it would be wrong: the
  canonical collection is coherent *at a ref*, and a stance from one commit beside
  a skill from another is a corpus that never existed. Consumer aliases cannot
  split one authority either: duplicate aliases for the same stable authority are
  rejected. Keeping the ref at source level is also what keeps the selection and
  the lock from becoming two competing answers to "which upstream content should
  this project?" A mutable ref such as `main` is an update selector, not a
  continuing constraint: `check` verifies that the reviewed selector and locked
  commit are unchanged, while an explicit update resolves the selector again.
  When the claim that a commit was reachable through a ref matters later, the
  lock also retains the signed resolution statement, its signer identity, and the
  versioned trust policy used to verify it. Both records are retained in full and
  content-addressed; identities and digests alone cannot recover the statement or
  the authorization rules after their original locations change. The reviewed
  selection pins the expected signer and complete versioned policy digest record
  for each mutable source, so the generated lock cannot introduce its own trust
  root. The complete canonical statement-digest record is computed first and
  signed by an attestation retained beside it; the separately addressed
  attestation record does not contain its own digest.
  During an explicit update, the signed statement also carries the authenticated
  single-use challenge created for that update. Update-time validation rejects a
  consumed or mismatched challenge, while later `check` verifies the historical
  lock without pretending that an old ref observation should still be fresh.
  When the commit itself is the continuing constraint, the selection names that
  immutable commit.
- **The resolved snapshot remains retrievable and bound to its resolution.** A
  commit identifier and content digests can verify recovered bytes but cannot
  recover them after a repository is deleted or an unreachable object is
  collected. The lock bundle therefore retains a minimal Git object proof that
  authenticates the canonical source boundary at the resolved commit. It also
  retains an exhaustive resource inventory derived from the commit-authenticated
  resource-section trees: every identity, declared name, canonical locator, and
  dependency-metadata coverage record, including unselected resources, but not
  their unrelated bodies. That inventory lets a later independent check repeat
  global uniqueness and metadata-coverage validation. A separate archive contains
  only the complete inputs of the selected closure and the contracts, licenses,
  and notices needed to interpret and redistribute them; unrelated blobs and
  history are not retained. `check` reads the retained commit's tree identity,
  re-derives the exhaustive inventory from the retained tree and declaration
  proofs, verifies every selected path, derives the canonical archive again, and
  compares both digests. Every retained
  object and archive member also needs redistribution coverage and secret-safety
  validation. The lock retains each source's scan result together with the
  content-addressed scanner, versioned rules, and hermetic runtime needed to
  reproduce it, and requires all three to equal the source-retention policy in
  the externally authenticated selection. A lock producer cannot weaken the
  scanner or rules while preserving an internally consistent bundle. If even the
  minimal proof exposes material the consumer cannot
  retain, adoption needs an equivalent authorized inclusion proof or fails. A
  consumer-owned source without a Git commit uses the same rule at its boundary:
  `check` extracts its retained archive under the versioned canonical-tree rules,
  recomputes the tree digest, and requires it to equal the consumer's recorded
  resolved digest.
- **The source declares what makes a resource complete.** Its machine-readable
  input boundary includes the entry file, supporting files, and imported or shared
  runtime inputs that can change the projected behavior. A shared input can be
  locked once and referenced by every affected resource, but it cannot sit outside
  the provenance check. Otherwise a hook manifest and script could retain their
  digests while a shared hook runtime changes underneath them.
- **The contracts that interpret a resource are resource inputs.** The versioned
  source manifest, canonical resource contract, and dependency metadata bytes—or
  the canonical fragments that govern one identity—belong to every affected
  resource's complete boundary. A lock may deduplicate them into shared records,
  but each resource digest expands its references to those records. Changing a
  role grammar or requirement therefore changes the content address of every
  resource whose meaning or closure changed, even when its entry file did not.
- **The digest encoding is canonical and versioned.** Each complete-resource
  digest covers an ordered serialization that frames every normalized path, file
  type, byte length, content, and behavior-relevant metadata. The lock records the
  digest-algorithm version. Different file boundaries or paths cannot produce the
  same digest merely because their bytes concatenate to the same sequence.
- **Source-declared paths stay inside the resolved snapshot.** Resource inputs,
  licenses, and notices use normalized relative paths whose lexical and resolved
  locations remain within the immutable source snapshot. Absolute paths and
  traversal outside the snapshot fail adoption. If symlinks are allowed, both the
  link and its resolved target stay inside the snapshot and contribute to the
  digest; otherwise the resolver rejects symlinks explicitly.
- **Retained paths stay inside the lock bundle.** Every snapshot, toolchain,
  configuration, runtime, evidence, settings, policy, and attestation path is a
  normalized relative path whose lexical and resolved location remains beneath
  the lock-bundle root. Archive members obey the same rule before extraction.
  Absolute paths, traversal, escaping symlinks, and colliding normalized members
  fail `check`, so a producer and an independent verifier cannot attach the same
  recorded digest to different machine-local inputs.
- **Redistribution terms travel with every retained byte.** Before adoption, the
  snapshot must establish the terms under which its resources, source proof, and
  supporting records can be retained or republished and the notices that must
  accompany them. Each redistribution contract names the resource identities and
  retained object classes it covers; one source-wide contract is valid only when
  it covers every retained object and archive member from that source. Conflicting,
  uncovered, or secret-bearing material fails adoption. The lock records those
  artifacts and their digests, and the final package carries every required notice
  with its source attribution intact. A target uses source-qualified
  destinations or a
  deterministic attributed aggregate, so conventional names such as `LICENSE` and
  `NOTICE` cannot overwrite another source's terms. A source that does not
  establish redistribution terms cannot be adopted for redistribution. The same
  rule applies to third-party bytes a target adds during projection or an evidence
  bundle retains, such as a packaged runtime executable, test harness, credential
  scanner, scanner runtime, or tool implementation. The target lock or evidence
  artifact records their authority, terms, notices, and secret-safety result, and
  notice generation consumes those records alongside the source redistribution
  records.

The lock commits to the complete deterministic transformation, not only its source
and target ends. That includes lossless manifest parsing, source adapters,
dependency parsing and closure, the target adapter and configuration, and final
packaging. Each toolchain component has the same kind of complete input boundary
and canonical digest as a resource, including the shared code it executes. The
lock bundle retains those content-addressed inputs and configurations, or a
retrievable hermetic executable that contains them; input names and hashes alone
cannot repeat a build after the consumer repository changes. The
target lock defines and records canonical digests for the final installable tree
and the deterministic adapter report, plus the independently retained
projection-diff validator that checks the report's completeness. `check` repeats
the locked transformation, compares its resolved sources, closure, installable
tree, and report, independently recomputes closure from retained selection and
source contracts, and validates every reported envelope difference independently.
Changing any transformation input or downstream file makes the checked output
stale.

Repetition also fixes the execution semantics that can change those outputs. The
host-independent resolver, independent validators, and every target adapter and
packager run through a retained content-addressed hermetic runtime or
self-contained executable. A versioned normalization contract inside that runtime
fixes its platform and path rules, locale, and collation; the contract describes
execution but cannot replace something capable of executing the retained
transformation. Discovery order and generated paths follow that environment
rather than the checking machine's ambient settings.

### R5. Adapters report what they did, and stop there

A target adapter can state precisely what it changed: it omitted a model field,
expanded a tool group, mapped a group to an empty list, placed a stance in a
different directory, or could not represent a resource at all. Those statements
are facts about the host envelope, and recording them is what makes a binding
inspectable rather than silent.

Each reported fact names the affected resources by their source-qualified
identities. The report spans the target, so it can contain resources from several
authorities and facts, such as a host-name collision, that exist between them.
Its independently validated format version establishes the active,
reference-only, unrepresentable, locator, and applied-fact grammar before the
report is interpreted.

The report maps every active projection and reference-only resource identity to
its host-visible output locator, whether or not adapting it required a change. A
locator names the path and, when several resources share a consolidated host
file, the target-native member within that file. Together, the active,
reference-only, and unrepresentable sections account for every identity in the
resolved set. The final tree digest can then prove the bytes while the report
preserves which canonical resource produced each output and whether the host can
activate it. When a partition status results from availability propagation, the
entry also carries a structured cause: requirement kind, source-qualified resource
identity or capability-contract identity, locked dependency edge, and observed
target status. A resource cause points to the exact versioned normalized edge in
the lock, whose digest and source-metadata locator are independently rederived by
the reviewed closure validator. A prose reason can explain that record but cannot
replace it.

The target name alone is not a capability contract. Each report also records the
host version, relevant platform rules, and adapter version used to produce it, or
one versioned capability-contract identifier that determines all three. Structural
facts are interpreted against that contract; a later host release does not silently
inherit claims established against an older one.

Reproducibility does not establish completeness. `check` therefore runs a
separately retained, independently implemented projection-diff validator over the
locked canonical input boundaries, target configuration, emitted installable, and
adapter report. Its versioned envelope rules derive every host-visible addition,
omission, and rewrite and require exactly one matching locator, partition entry,
or `applied` fact. The validator is not shared adapter code and its inputs and
runtime are locked independently. The externally authenticated consumer review
record pins the expected validator, envelope rules, and runtime for every target;
the lock producer cannot choose an agreeing validator alongside the adapter. An
adapter and report that reproducibly omit the same transformation still fail this
check.

This applies to what the build **already** drops, not only to anything selection
introduces. Codex packages no active hooks or instructions and carries agents as
reference material; those target limitations should appear in a report today.
Selection raises the stakes rather than creating the obligation: a consumer who
deliberately adopts a hook and silently receives a package without it has been told
something false about what it holds.

An adapter cannot reliably say what those changes *mean* for behavior. That is a
separate question, and answering it may require exercising the resource. So the
report should not carry a verdict it is not positioned to make.

Two consequences:

- **An empty `notRepresented` list means every identity produced an output.** It
  does not mean every output is active, or that behavior was preserved;
  reference-only status and preservation evidence answer those separate
  questions.
- **Not every host-specific mapping is loss, and not every mapping is a binding.**
  Resolving the abstract role `auxiliary` to a concrete model is a legitimate
  binding when it is declared and inspectable. Mapping a model role to `null`
  delegates the choice to the host default, which is neither an explicit binding
  nor automatically a loss. A tool group that resolves to an empty list is a
  structural omission the adapter should record, and whether the resource still
  behaves as authored is a question for evidence, not for the adapter.

### R6. Unknown preservation is stated plainly

Where the consumer cannot tell whether the result still carries the authored
behavior, the correct output is to say so. The principle already prefers an
explicit description of loss over simulated equivalence; the same preference
applies to uncertainty. Silence reads as a guarantee that nothing here can make.
That uncertainty belongs to a retained evidence artifact, not the deterministic
adapter report. The artifact binds its observations to the locked resolved set
(identities plus complete-resource digests), installable tree, adapter report,
retained content-addressed evidence definition and executable harness, and runtime
contract. The evidence definition preserves the stimuli, assertions, and outcome
semantics that say what an observation establishes; its harness is an input to
that claim, not an ambient implementation identified only by a revision label.
Their complete digest records are target evidence inputs in the externally
authenticated consumer review record, so the evidence producer cannot substitute
a trivial definition or harness.
The resolved-set binding
keeps an omitted resource from changing underneath evidence whose target bytes
remain identical. Each observation has a stable identifier and names one resource,
the exact evidence-definition case and assertions it exercised, its outcome, and
the complete execution environment that produced it. That environment includes
the immutable host build or retained content-addressed executable that assembled
prompts, enforced permissions, and dispatched tools; a version string alone does
not distinguish patched or reissued builds. A provider statement authenticates
that identity under the build-identity authority, signer, and trust policy pinned
by the externally reviewed target configuration, and the retained policy path
keeps its authorization rules available to later checks. The artifact requires
the observed build identity and complete platform-contract digest record to equal
the adapter report's locked runtime contract, or binds both contracts to an
explicit retained compatibility proof. It also includes effective host defaults
such as the concrete model and tool settings. A model
observation records the immutable provider authority and model version or
deployment identity for every model invocation that contributed to the outcome,
including delegated agents and model-backed host facilities. Its ordered trace
retains the prompts and context each invocation received, the responses and errors
it produced, and its links to tool calls. Invocation and parent identifiers connect
that interaction to the canonical resource or role that caused each use. A
host-selected alias remains useful context, but cannot identify the model after a
provider remaps it. Tools
receive the same treatment: an observation
records immutable provider and implementation or deployment identities plus the
schema that governed the invocation, including an independently validated schema
format and dialect version, or retains a content-addressed implementation. A
schema digest preserves bytes but does not define whether they use JSON Schema,
OpenAPI, or a provider-specific grammar. The observation also retains an ordered,
content-addressed trace of every tool
input, output, and error with invocation and parent identifiers, because remote or
stateful responses are part of what the model observed. Public evidence uses
hermetic, secret-free fixtures and applies its credential scan to every retained
publication input and part of the observation environment, including evidence
definitions, fixtures, traces, effective settings, host configuration, and other
environment records. A failed scan is failed validation.
The evidence retains the scan result together with the scanner, rules, and
hermetic runtime needed to reproduce it; a bare passing assertion cannot make an
environment record publishable. Their complete digest records must equal the
credential-scan policy in the externally authenticated reviewed selection; the
evidence producer cannot supply a weaker scanner or empty rules and call the
result passing. When an observation must use private data, every
affected trace or environment record is encrypted in immutable access-controlled
storage. The evidence binds each ciphertext, encryption policy, and access
policy, and requires both policies to equal the approved authority-qualified
records in reviewed intent. The release index publishes content-addressed
commitments and marks the evidence restricted. Redaction that changes what the
model observed cannot establish preservation. A
display name such as `Bash` or an MCP tool name does not fix the behavior exercised
by the run. A default the run cannot observe cannot support a
verified behavioral claim.
Permissions, system prompts, feature flags, and other effective settings are
retained as a content-addressed canonical record, with a versioned serialization
and digest contract, under the same secret-free scan or encrypted-access-controlled
retention mode as the rest of the observation environment. A hash of live settings
that can no longer be recovered does not preserve the observation environment.

The artifact accounts for the whole resolved resource set and for every case the
retained evidence definition designates as required. A case-coverage table maps
each required case and assertion to one observation or marks it unrun. Case
observations aggregate into a resource-level outcome only under the definition's
retained aggregation rule and only after every required case is accounted for; a
producer cannot omit a failed or unrun case and still move the identity out of
`unverified`. The artifact retains the reviewed aggregation validator, rules, and
runtime and binds every populated resource outcome to those exact inputs. Resource
outcomes and unverified identities are disjoint and
exhaustive, so absence cannot be mistaken for preservation or uncertainty that was
never recorded.

The observation needs provenance of its own. The complete evidence artifact is
canonically digested, and an immutable reviewed record or signed CI attestation
retains that digest outside the mutable artifact. A signed attestation also names
the immutable signer identity and retains the content-addressed versioned trust
policy that authorizes that repository, issuer, workflow, and identity to
establish preservation claims; a valid signature from an unrelated CI identity
is not sufficient. The reviewed selection pins the expected signer and complete
versioned policy digest record outside the evidence bundle, and the signed
statement covers the artifact digest, signer, and that policy digest record
together. Keeping the policy bytes or an immutable durable locator makes those
authorization rules available when `check` later evaluates the signature.
Its independently validated format version establishes the observation and
partition grammar before either is interpreted; the digest-algorithm version
establishes serialization and hashing, not field meaning.
`check` verifies the content address and bindings without rerunning a model-backed
or live-host test. A new evidence run produces a new artifact rather than changing
the reproducible build.

## Worked example

`tildeio/daily-skills` consumes from this repository while authoring its own
resources. Under these requirements its shape is:

- **Its own layer**, authored and canonically its own, sitting alongside the
  adopted subset and never merged into it.
- **An adopted subset**, named as canonical identities carrying their source (R1),
  independent of any host (R2), arriving with everything those resources require
  (R3), taken from one resolved source snapshot with every post-closure resource
  digested (R4).
- **A projection per supported host**, each reporting what its adapter did (R5),
  plus a separate retained evidence artifact saying plainly where preservation is
  unverified (R6).

Appendix A shows the selection, Appendix B the lock it resolves to, and
Appendix C the adapter report for one host. Appendix D shows the separately
retained preservation evidence.

## Responsibilities to prove

The point of the list below is not to choose a package home or publish an API. It
is to name responsibilities precisely enough that they can be demonstrated in the
existing three-target build. What deserves to become reusable should follow from
that evidence.

| Responsibility | What proving it looks like |
| --- | --- |
| Identity is extractable and unique per section | A commit-authenticated exhaustive inventory enumerates selected and unselected identities, declared names, and canonical locators for agents, instructions, hooks, skills, and stances; duplicate identities within one source and section fail validation without requiring unrelated resource bodies to be retained |
| Identity has an unambiguous encoding | Qualified identities round-trip source, section, and name; invalid or ambiguous components fail validation before selection or locking |
| Every interpreted document preserves reviewed intent | Duplicate members and other lossy or ambiguous forms fail before source manifests, resource and capability contracts, dependency metadata, selections, locks, ref-resolution evidence, target configurations, adapter reports, preservation bundles and artifacts, evidence definitions, settings records, or trust policies become ordinary maps |
| Source manifest, resource and capability contract, dependency metadata, selection, lock, ref-resolution evidence, target configuration, adapter report, and preservation-evidence formats are explicit | Each document names an independently validated format version that establishes its grammar and field semantics before interpretation |
| Identity preserves source authority | Selection intent pins the expected immutable authenticated authority behind each source locator; updates reject a different authority, and two sources supplying the same `<section>/<name>` resolve unambiguously even after a repository rename or transfer |
| Consumer resources use the same identity model | The reserved `consumer` source locates one confined manifest and an authenticated repository locator; before reading the manifest's authority claim, the local adapter proves that the pre-established project root is a checkout of the provider-issued identity pinned by the selection. The resulting canonical tree digest must also equal the consumer revision and tree digest in the independently authenticated review record, so dirty or unreviewed consumer resources cannot enter the lock. Its resources then participate in closure, collisions, locking, and reports |
| One authority has one source declaration | Two aliases resolving to the same stable source authority are rejected before their refs can produce mixed snapshots |
| Identity survives projection | Every active or reference-only identity maps to its host-visible output locator; resources that collide after a target's name and path normalization—including case folding and reserved names—are namespaced apart or reported unrepresentable, and neither is overwritten or renamed. Runtime files shared by several resources appear once as support output with the exhaustive set of contributing source-qualified identities |
| Selection is host-independent | One selection produces all three target builds; each target's active, reference-only, and unrepresentable resources partition the resolved set exactly, while support outputs cannot introduce or advertise an unselected discoverable resource |
| Target bindings preserve source authority | A versioned canonical grammar distinguishes literal values from typed abstract references; every declared reference has one explicit applicable binding, and equal roles from independent sources bind separately unless each source assents to the same authority-qualified, versioned, content-addressed shared role contract and an independent validator fixed by the external review record binds all source and shared contract digests to a compatible result |
| Dependency metadata covers the snapshot | Before closure, a recognized schema or complete-declaration rule establishes coverage for every resource in the commit-authenticated exhaustive inventory; an older or partially annotated source fails before its closure is accepted, and later `check` can repeat that inventory comparison |
| Closure reaches the complete requirement set | An agent chosen alone arrives with its direct resource and capability requirements and those of every resource closure adds, all parsed as structured data. The lock retains every normalized resource-requirement edge with its source-metadata locator and versioned digest record, while capability contracts remain locked requirements rather than synthetic resources; an independently retained validator fixed by reviewed intent derives the same edges and fixed point from the reviewed selection and retained source contracts without sharing resolver code |
| Target capability loss propagates | Availability starts with every structurally active resource whose direct capability bindings validate, then repeatedly removes resources whose required resource is absent from the candidate set or whose required capability is unavailable. This shrinking computation yields one greatest fixed point; a requirement cycle remains active only when every member and dependency leaving the cycle remains available. Every removal is recorded with the structured locked requirement identity, dependency edge, and target status that caused it |
| Capability compatibility has independent proof | A separately retained validator or proof binds the source and native contract digests. Reviewed target intent pins the expected provider authority, signer, and trust-policy digest record; the provider's signed canonical statement binds that authority, the immutable host build, and the native-contract digest together, or an independent retained probe binds the executable and observed capability to both contracts. Replaying the adapter's own compatibility assertion is insufficient |
| Strict closure audits explicit completeness | An incomplete explicit selection fails in strict mode, while the same selection succeeds after every resource in its fixed-point requirement set is named |
| Complete-resource boundaries are explicit | Every locked resource records its resolved input boundary, including the source-manifest, resource-contract, dependency-metadata, and any declared capability-contract records that interpret it; a versioned canonical encoding distinguishes paths, types, lengths, bytes, and behavior-relevant metadata before hashing |
| Source and retained paths are confined | The consumer manifest is confined to a pre-established project root before it is read; source-declared paths remain inside their resolved snapshot, while every retained path and archive member remains lexically and after resolution beneath the lock bundle; absolute paths, traversal, escaping symlinks, and colliding normalized archive members fail before any input is read or projected |
| Redistribution terms are established | Every resource in the resolved post-closure set and every retained source-proof object, archive member, independently sourced shared-contract byte, third-party target output, or evidence-specific tool and runtime is covered by a non-conflicting redistribution contract and passes secret-safety validation. Each source scan's scanner, rules, and runtime equal the reviewed source-retention policy; each authority retains those inputs and the result needed to reproduce the decision. Notice generation consumes every source, shared-contract, target, and evidence redistribution record, and each target preserves every source's attribution without destination collisions |
| The complete transformation is reproducible | One lock retains the reviewed selection and binds it, the consumer-source revision and canonical tree digest, every target configuration, and every independent validator whose result permits acceptance to an independently authenticated consumer commit, release statement, or review record supplied outside the lock bundle. It retains a minimal redistribution-safe source-control proof with a versioned proof grammar and explicit Git object format, derives a commit-authenticated exhaustive resource inventory for global validation, authenticates each selected boundary, binds a consumer-owned archive to its recomputed canonical resolved-tree digest, retains every other content-addressed transformation input, and supplies a hermetic runtime or self-contained executable for every replayed component. It records all three supported targets and supplies the canonical locator, format, and freshness authority of their mandatory release-evidence index; it digests the resolver and closure toolchain plus each target's execution semantics, adapter, configuration, packager, final installable tree, and adapter report, so mutating any transformation input or downstream file makes `check` fail until the package and report are regenerated |
| Adapters report what they did | The proof corpus includes agents, an instruction, and a hook; each target carries every identity through its report and evidence as active, reference-only, or unrepresentable, with output locators where files exist and no behavioral verdict. An independently implemented projection-diff validator whose identity, envelope rules, and runtime are fixed by the external review record requires every emitted addition, omission, and rewrite to have a matching report fact |
| Reports identify the runtime contract | Repeating a report names the same immutable host build identity, host version, complete versioned platform-contract digest record, and adapter version or a single versioned capability-contract identifier that fixes them. Preservation evidence authenticates that build under the authority, signer, and retained trust-policy record pinned by externally reviewed target intent and requires both the build and platform contract to equal the report |
| Preservation evidence is retained separately | The lock locates a checked release index with exactly one current evidence bundle for every locked target. The index is a signed generation in an authenticated append-only sequence; a current check compares it with the latest checkpoint from the freshness authority pinned by the selection, while an offline check states the retained checkpoint's as-of boundary. Resource outcomes and unverified entries form a disjoint, exhaustive partition of the resolved resource set. Each observation has a stable ID that binds its outcome to the exact retained definition case and assertions, and an exhaustive coverage table accounts for every required case; a resource outcome is valid only after the definition's retained aggregation rule evaluates complete coverage through the retained reviewed validator, rules, and runtime. The externally authenticated review record pins the accepted evidence definition and harness for each target. The artifact binds those inputs to the lock's complete versioned digest records for the resolved set, installable tree, and adapter report, plus the immutable host build and platform contract, every model invocation and its ordered interaction, the ordered tool I/O trace, tool/deployment identities, independently validated tool-schema format and dialect versions, and retained execution settings. Every public retained evidence input, including definitions and fixtures, uses the approved reproducible credential-scan policy; private records use encryption and access-control policies whose authorities, algorithms, and complete digest records equal approved reviewed intent, and are represented publicly by a content-addressed commitment. A versioned canonical encoding gives the artifact a reproducible content address, while an attestation signs that complete digest record together with the signer and complete trust-policy digest record pinned by the reviewed selection; `check` verifies those bindings without rerunning live evidence |
| Uncertainty is stated | A projection whose preservation is unverified says so rather than passing silently |

Consumer-local by nature, and not framework material: the specific list of adopted
resources. That is data.

## Open questions

1. **`requires-resources` placement.** Frontmatter on each resource, or a separate
   manifest? Frontmatter keeps the requirement next to the thing that has it;
   a manifest avoids touching every canonical file.

## Appendix A: selection

Intent only (R4). Canonical identities carrying their source (R1), an intended ref
per source, and no host anywhere in the file (R2).

```jsonc
{
  "formatVersion": "<selection-format version>",

  // Sources participating in this build. Upstream aliases are LOCAL to this
  // consumer:
  // canonical resource files never see it, because they name same-source
  // requirements unqualified and cross-source requirements use the stable source
  // authority. The resolver maps that authority to the alias below (R1).
  "sources": {
    // The consumer's canonical resources are discovered from this root. The
    // `resources` list below still names which of those available identities are
    // part of this reviewed selection.
    "consumer": {
      // Hand-authored intent, checked against the authority declared by the
      // consumer manifest and against the authenticated repository containing the
      // pre-established project root before an update can relock consumer:*.
      "repo": "<authenticated consumer repository locator>",
      "expectedAuthority": {
        "provider": "github",
        "kind": "repository-id",
        "id": "<provider-issued immutable consumer repository id>"
      },
      // Resolved beneath the consumer project root established by the build,
      // then included in the canonical source tree it declares. The referenced
      // document begins with its independently validated formatVersion.
      "manifest": "source-manifest.json"
    },
    "wycats-plugin": {
      "repo": "wycats/vscode-ai-plugin",
      // The locator may move; the authority this selection intends to trust may
      // not. An update fails if the locator resolves to another repository ID.
      "expectedAuthority": {
        "provider": "github",
        "kind": "repository-id",
        "id": "<provider-issued immutable repository id>"
      },
      // Source-relative and confined after the selected ref resolves. A source
      // adapter convention may replace this field only when its version is part
      // of the selection format and yields exactly one path.
      "manifest": "source-manifest.json",
      // A mutable ref is an update selector. The lock keeps its exact resolution
      // until an explicit update resolves it again.
      "ref": "refs/heads/main",
      // Hand-authored trust root for the signed ref-resolution statement. The
      // generated lock cannot authorize a replacement signer or policy.
      "resolutionAuthority": {
        "signer": "<immutable authorized ref-resolution signer>",
        "trustPolicy": {
          "id": "<versioned ref-resolution trust policy>",
          "digestAlgorithm": "<canonical-trust-policy-digest version>",
          "digest": "sha256:…"
        }
      }
    }
  },

  // Optional host-neutral contracts through which independent sources explicitly
  // agree to share one role meaning. Each contributing source contract must name
  // this exact identity and complete digest record.
  "sharedRoleContracts": {
    "shared-contracts.example:model-role/auxiliary": {
      "locator": "<authenticated shared role-contract locator>",
      "expectedAuthority": {
        "provider": "<contract provider>",
        "kind": "<provider-issued contract authority kind>",
        "id": "<immutable contract authority id>"
      },
      "contractVersion": "<shared role-contract semantic version>",
      "digestAlgorithm": "<canonical-shared-role-contract-digest version>",
      "digest": "sha256:…"
    }
  },

  // Hand-authored authorization root for evidence attestations. A bundle cannot
  // make a new signer trusted by replacing its own policy.
  "evidenceAuthority": {
    "signer": "<immutable authorized CI signer identity>",
    "trustPolicy": {
      "id": "<versioned evidence-attestation trust policy>",
      "digestAlgorithm": "<canonical-trust-policy-digest version>",
      "digest": "sha256:…"
    },
    "releaseIndexFreshness": {
      "kind": "authenticated-append-only-log",
      "logIdentity": "<immutable evidence-index log identity>",
      "checkpointLocator": "<authenticated current-checkpoint locator>",
      "checkpointSigner": "<immutable authorized checkpoint signer>",
      "trustPolicy": {
        "id": "<versioned checkpoint trust policy>",
        "digestAlgorithm": "<canonical-checkpoint-trust-policy-digest version>",
        "digest": "sha256:…"
      }
    },
    // Reviewed publication policy. Evidence producers may retain these exact
    // inputs and their execution environment, but cannot choose what counts as
    // an adequate credential scan.
    "credentialScanPolicy": {
      "id": "<versioned approved credential-scan policy>",
      "scanner": {
        "digestAlgorithm": "<canonical-credential-scanner-digest version>",
        "digest": "sha256:…"
      },
      "rules": {
        "formatVersion": "<credential-scan-rules-format version>",
        "digestAlgorithm": "<canonical-credential-scan-rules-digest version>",
        "digest": "sha256:…"
      },
      "executionEnvironment": {
        "digestAlgorithm": "<canonical-credential-scanner-runtime-digest version>",
        "digest": "sha256:…"
      }
    },
    "privateEvidencePolicy": {
      "encryption": {
        "authority": "<immutable approved encryption-policy authority>",
        "policyId": "<versioned approved encryption policy>",
        "algorithm": "<approved authenticated-encryption algorithm and parameter profile>",
        "digestAlgorithm": "<canonical-encryption-policy-digest version>",
        "digest": "sha256:…"
      },
      "accessControl": {
        "authority": "<immutable approved access-policy authority>",
        "policyId": "<versioned approved access policy and minimum audience rules>",
        "digestAlgorithm": "<canonical-access-policy-digest version>",
        "digest": "sha256:…"
      }
    }
  },

  // Reviewed acquisition policy for retained source proofs and archives. A
  // generated lock may retain and replay these exact inputs, but cannot define a
  // weaker scan policy for the bytes it intends to redistribute.
  "sourceRetentionPolicy": {
    "credentialScan": {
      "id": "<versioned approved source credential-scan policy>",
      "scanner": {
        "digestAlgorithm": "<canonical-source-scanner-digest version>",
        "digest": "sha256:…"
      },
      "rules": {
        "formatVersion": "<source-secret-scan-rules-format version>",
        "digestAlgorithm": "<canonical-source-scan-rules-digest version>",
        "digest": "sha256:…"
      },
      "executionEnvironment": {
        "digestAlgorithm": "<canonical-source-scanner-runtime-digest version>",
        "digest": "sha256:…"
      }
    }
  },

  // Selected canonical identities, "<source>:<section>/<name>". This includes
  // consumer-owned and upstream identities, so adding either kind of resource to
  // a source does not silently change reviewed selection intent. No target appears
  // here: which host is being built is build configuration, so one selection
  // yields three honest presentations rather than three subtly different corpora.
  "resources": [
    "consumer:skills/housekeeping",
    "wycats-plugin:agents/slop-linter",
    "wycats-plugin:agents/recon",
    "wycats-plugin:skills/gh-write-pr-description",
    "wycats-plugin:skills/dangling-thread-review",
    "wycats-plugin:instructions/environment",
    "wycats-plugin:hooks/native-ts-enforcement"
  ],

  // Availability closure (R3), resolved from `requires-resources`, which may name
  // any canonical identity—skills as well as stances—and
  // `requires-capabilities`, which names source-owned semantic contracts that
  // every target must bind or report unavailable. "strict" fails when a resource
  // selection is incomplete; "resolve" adds the missing resources. Both modes
  // carry the same capability requirement set into the lock.
  "closure": "resolve"
}
```

## Appendix B: lock

Resolution (R4). One commit and one redistribution account per source, the closure
that was computed, and a digest per complete resource across the whole
post-closure set.

**The snapshot has to establish the contracts this lock relies on.** An earlier
draft pinned a real commit from before this proposal, whose resources carry no
structured resource or capability requirements—so the `closureAdded` set below
claimed to be derived
from metadata that was not there, and a resolver honoring the lock exactly could
not have reproduced it. The placeholder is deliberate: this example is only
coherent at a snapshot that establishes dependency metadata, complete-resource
boundaries, and redistribution terms.

That exposes a requirement worth stating outright, though it is not quite the one
it first appears to be. An empty closure is a legitimate result — a resource can
genuinely require nothing. What a resolver cannot do is tell which case it is in.

So the check belongs one step earlier, on compatibility rather than on output.
Before resolving closure, the consumer must establish that the snapshot
implements a dependency metadata contract the resolver understands — a schema
version, or a requirement that every resource declare both `requires-resources`
and `requires-capabilities` even when the lists are empty. **If it cannot establish
that, resolution fails.** Once
it can, an empty closure is a valid result and is recorded as one.

Locating the failure here rather than at "no dependencies found" matters for two
cases that would otherwise be judged wrongly. A snapshot predating the field and
a snapshot whose resources genuinely need nothing produce identical output, so
failing on absence rejects the second along with the first. And a **partially
annotated** source — some resources declaring, others silent — would pass an
absence check while still yielding a closure that is quietly incomplete.

```jsonc
{
  "formatVersion": "<lock-format version>",

  // The reviewed intent is retained outside every source snapshot. `check`
  // verifies this record before interpreting the resolution it governs.
  "selection": {
    "path": "selection/curated-upstream-subset.json",
    "formatVersion": "<selection-format version>",
    "digestAlgorithm": "<canonical-selection-digest version>",
    "digest": "sha256:…",
    // This retained copy must match the independently authenticated review
    // record supplied to `check`; it is not itself the trust root.
    "reviewBinding": {
      "kind": "external-consumer-review-record",
      "consumerAuthority": "<same immutable consumer authority supplied outside the lock bundle>",
      "recordIdentity": "<same immutable consumer commit or signed release identity supplied outside the lock bundle>",
      "selectionPath": "<path or member locator in that reviewed record>",
      "selectionDigest": {
        "digestAlgorithm": "<same canonical-selection-digest version>",
        "digest": "<same selection digest>"
      },
      // The independently authenticated review record names the host-neutral
      // selection and each host-specific intent input without moving those
      // target bindings into the selection itself.
      "targetConfigurations": {
        "vscode": "<complete versioned VS Code configuration digest record>",
        "claude-code": "<complete versioned Claude Code configuration digest record>",
        "codex": "<complete versioned Codex configuration digest record>"
      },
      "projectionDiffValidators": {
        "vscode": "<complete reviewed validator, envelope-rules, and runtime digest records>",
        "claude-code": "<complete reviewed validator, envelope-rules, and runtime digest records>",
        "codex": "<complete reviewed validator, envelope-rules, and runtime digest records>"
      },
      // Every independent validator whose result permits acceptance has one
      // reviewed identity here; the named examples are not an allowlist that can
      // leave another acceptance validator producer-selected.
      "independentValidators": {
        "requireExhaustiveBinding": true,
        "records": {
          "closure": "<complete reviewed validator, semantics, and runtime digest records>",
          "shared-role-compatibility": "<complete reviewed validator, rules, and runtime digest records>",
          "capability-contract-compatibility": "<complete reviewed validator, rules, and runtime digest records>",
          "runtime-capability": "<complete reviewed validator, probe contract, and runtime digest records>",
          "evidence-aggregation": "<complete reviewed aggregation validator, rules, and runtime digest records>"
        }
      },
      "preservationEvidence": {
        "vscode": "<reviewed definition, harness, and target evidence-policy digest records>",
        "claude-code": {
          "definition": "<complete reviewed evidence-definition digest record>",
          "harness": "<complete reviewed evidence-harness digest record>",
          "privateEvidencePolicy": "<same complete encryption and access-policy records pinned by the selection>"
        },
        "codex": "<reviewed definition, harness, and target evidence-policy digest records>"
      },
      "consumerSource": {
        "authority": "<same immutable consumer repository authority named by the selection>",
        "revisionIdentity": "<immutable reviewed consumer commit or release identity>",
        "canonicalTreeDigest": {
          "digestAlgorithm": "<canonical-source-tree-digest version>",
          "digest": "sha256:…"
        }
      },
      "authentication": "<provider inclusion proof or signed review statement verified against the external consumer authority>"
    }
  },

  // Canonical locator only: live evidence is not a transformation input, but a
  // check that starts from this lock always knows where the mandatory release
  // evidence index must exist.
  "releaseEvidenceIndex": {
    "path": "evidence/release-index.json",
    "formatVersion": "<release-evidence-index-envelope-format version>",
    "freshnessAuthority": {
      "selectionBinding": "<same log identity, checkpoint signer, and complete trust-policy digest record pinned by the selection>",
      "trustPolicy": {
        "id": "<same versioned checkpoint trust policy pinned by the selection>",
        "path": "policies/evidence-index-checkpoint.json",
        "digestAlgorithm": "<same canonical-checkpoint-trust-policy-digest version>",
        "digest": "<same checkpoint trust-policy digest>"
      }
    }
  },

  // The source, shared-contract, and target records expanded below supply the
  // common cases. This table also covers retained adapters, validators,
  // packagers, build runtimes, policies, and any other independently sourced
  // lock-bundle input so an omitted class cannot hide between examples.
  "redistributionCoverage": {
    "requireExhaustiveCoverage": true,
    "records": "<every authority-qualified redistribution record referenced by this lock>",
    "coverage": "<one exact non-conflicting redistribution-record reference for every retained lock-bundle path and inline byte record>"
  },

  "sources": {
    "wycats-plugin": {
      "repo": "wycats/vscode-ai-plugin",
      "manifest": "source-manifest.json",
      "ref": "refs/heads/main",
      // Stable identity resolved by the source adapter. Another alias resolving
      // to this authority would make the selection invalid.
      "authority": {
        "provider": "github",
        "kind": "repository-id",
        "id": "<provider-issued immutable repository id>"
      },
      // One snapshot, no per-resource refs. Must be a commit whose dependency
      // metadata contract the resolver recognises, or closure is unreproducible.
      "resolved": {
        "kind": "git-commit",
        "objectFormat": "<Git object format, such as sha1 or sha256>",
        "commit": "<commit sha>",
        "tree": "<tree object id read from the retained commit object>"
      },
      "snapshot": {
        "kind": "retained-git-resolution",
        // Contains the commit and the minimal object proof needed to authenticate
        // every path in the canonical selected-closure boundary. Unrelated blobs
        // and history are excluded; every retained object is independently checked
        // for redistribution coverage and secrets.
        "objectProof": {
          "kind": "canonical-git-path-inclusion-proof",
          "formatVersion": "<git-path-inclusion-proof-format version>",
          "gitObjectFormat": "<same Git object format as sources.wycats-plugin.resolved>",
          "path": "sources/wycats-plugin.git-path-proof.tar.zst",
          "digestAlgorithm": "<canonical-retained-git-path-proof-digest version>",
          "digest": "sha256:…"
        },
        // Derived from the commit-authenticated resource-section trees and
        // declaration fragments. Covers selected and unselected identities without
        // retaining unrelated resource bodies.
        "resourceInventory": {
          "path": "sources/wycats-plugin.resource-inventory.json",
          "formatVersion": "<exhaustive-resource-inventory-format version>",
          "gitObjectFormat": "<same Git object format as resolved and objectProof>",
          "sourceCommit": "<same resolved commit>",
          "contents": "every resource section entry, identity, declared name, canonical locator, and dependency-metadata coverage record",
          "digestAlgorithm": "<canonical-resource-inventory-digest version>",
          "digest": "sha256:…"
        },
        // Contains only selected-closure inputs and their interpreting contracts,
        // licenses, and notices. Deterministically derived again from the retained
        // proof and source-boundary rules, then compared with this content address.
        "canonicalTreeArchive": {
          "path": "sources/wycats-plugin.tar.zst",
          "digestAlgorithm": "<canonical-source-tree-archive-digest version>",
          "digest": "sha256:…"
        }
      },
      // Retained outside the mutable ref, so a later check can establish that
      // this commit was the reviewed resolution of refs/heads/main.
      "resolutionEvidence": {
        "formatVersion": "<ref-resolution-evidence-format version>",
        // The statement is retained in the lock bundle, not represented only by
        // a digest or an ambient URL that may disappear.
        "statement": {
          "formatVersion": "<ref-resolution-statement-format version>",
          "authority": "<immutable authenticated repository authority>",
          "ref": "refs/heads/main",
          "commit": "<commit sha>",
          "observedAt": "<timestamp>",
          // Fresh, single-use challenge created by this explicit update and
          // recorded in its reviewed update request. Historical `check` verifies
          // the retained binding; only update-time validation consumes the nonce.
          "updateChallenge": "<authenticated single-use update nonce>"
        },
        // Computed before the attestation. The signature covers this complete
        // versioned digest record, not only its digest value.
        "statementDigest": {
          "digestAlgorithm": "<canonical-ref-resolution-statement-digest version>",
          "digest": "sha256:…"
        },
        "attestation": {
          "signs": {
            "digestAlgorithm": "<same canonical-ref-resolution-statement-digest version>",
            "digest": "<same statement digest>"
          },
          "signature": "<detached signature over the complete statementDigest record>",
          "signer": "<immutable signer identity>",
          "trustPolicy": {
            "id": "<versioned ref-resolution trust policy>",
            "path": "policies/ref-resolution.json",
            "digestAlgorithm": "<canonical-trust-policy-digest version>",
            "digest": "sha256:…"
          },
          "authorizationBinding": {
            "selectionSigner": "<same signer pinned by sources.wycats-plugin.resolutionAuthority>",
            "selectionTrustPolicy": {
              "digestAlgorithm": "<same canonical-trust-policy-digest version pinned by the selection>",
              "digest": "<same policy digest pinned by sources.wycats-plugin.resolutionAuthority>"
            }
          }
        },
        // Content address of the retained attestation bytes only. Kept beside
        // the attestation so the addressed record never contains its own digest.
        "retainedAttestation": {
          "path": "attestations/wycats-plugin-ref-resolution.dsse.json",
          "digestAlgorithm": "<canonical-attestation-record-digest version>",
          "digest": "sha256:…"
        }
      },
      "redistribution": [{
        "appliesTo": "*",
        "retainedObjectClasses": ["git-path-inclusion-proof", "exhaustive-resource-inventory", "canonical-source-archive"],
        "license": { "path": "LICENSE", "digest": "sha256:…" },
        "notices": [],
        "secretSafety": {
          "policyBinding": {
            "selectionMember": "/sourceRetentionPolicy/credentialScan",
            "scanner": "<same complete scanner digest record pinned by the selection>",
            "rules": "<same complete rules digest record pinned by the selection>",
            "executionEnvironment": "<same complete runtime digest record pinned by the selection>",
            "result": "equal"
          },
          "result": {
            "path": "sources/wycats-plugin.secret-scan.result.json",
            "formatVersion": "<source-secret-scan-result-format version>",
            "digestAlgorithm": "<canonical-source-secret-scan-result-digest version>",
            "digest": "sha256:…",
            "outcome": "passed"
          },
          "scanner": "<retained content-addressed source scanner record>",
          "rules": "<retained versioned content-addressed source scan rules>",
          "executionEnvironment": "<retained content-addressed hermetic scanner runtime>"
        }
      }]
    },
    "consumer": {
      "repo": "<authenticated consumer repository locator>",
      "authority": {
        "provider": "github",
        "kind": "repository-id",
        "id": "<provider-issued immutable repository id>"
      },
      "authorityResolution": {
        "formatVersion": "<authenticated-local-source-resolution-format version>",
        "adapter": "<versioned authenticated local-source adapter>",
        "projectRootBinding": "<provider-authenticated proof that the pre-established root is a checkout of repo>",
        "resolvedAuthority": "<same provider-issued repository id>",
        "reviewBinding": {
          "recordIdentity": "<same external consumer review record identity as selection.reviewBinding>",
          "reviewedInput": "/selection/reviewBinding/consumerSource",
          "resolvedTreeDigest": "<same complete canonical tree-digest record as sources.consumer.resolved>",
          "result": "equal"
        }
      },
      "resolved": {
        "kind": "canonical-tree-digest",
        "digestAlgorithm": "<canonical-source-tree-digest version>",
        "digest": "sha256:…"
      },
      "snapshot": {
        "kind": "retained-canonical-tree-archive",
        "path": "sources/consumer.tar.zst",
        "digestAlgorithm": "<canonical-source-tree-archive-digest version>",
        "digest": "sha256:…",
        // `check` extracts this archive under the canonical tree rules and
        // recomputes this value; it must equal sources.consumer.resolved.
        "derivedTreeDigest": {
          "digestAlgorithm": "<same canonical-source-tree-digest version as resolved>",
          "digest": "<same digest as sources.consumer.resolved>"
        }
      },
      "redistribution": [{
        "appliesTo": "*",
        "retainedObjectClasses": ["canonical-source-archive"],
        "license": { "path": "LICENSE", "digest": "sha256:…" },
        "notices": [],
        "secretSafety": {
          "policyBinding": {
            "selectionMember": "/sourceRetentionPolicy/credentialScan",
            "scanner": "<same complete scanner digest record pinned by the selection>",
            "rules": "<same complete rules digest record pinned by the selection>",
            "executionEnvironment": "<same complete runtime digest record pinned by the selection>",
            "result": "equal"
          },
          "result": {
            "path": "sources/consumer.secret-scan.result.json",
            "formatVersion": "<source-secret-scan-result-format version>",
            "digestAlgorithm": "<canonical-source-secret-scan-result-digest version>",
            "digest": "sha256:…",
            "outcome": "passed"
          },
          "scanner": "<retained content-addressed source scanner record>",
          "rules": "<retained versioned content-addressed source scan rules>",
          "executionEnvironment": "<retained content-addressed hermetic scanner runtime>"
        }
      }]
    }
  },

  // Complete input boundaries and canonical digests for the machinery that
  // produced the resolved identities and closure recorded by this lock.
  "resolutionToolchain": {
    "inputs": ["<source adapters and transitive resolver inputs>"],
    "retainedInputs": {
      "kind": "content-addressed-archive",
      "path": "toolchain/resolution.tar.zst",
      "digestAlgorithm": "<canonical-retained-input-archive-digest version>",
      "digest": "sha256:…"
    },
    // Resolution is host-independent only when the machinery that produced it is
    // independent of ambient Node, Git, OS, locale, and path behavior.
    "executionEnvironment": {
      "kind": "retained-hermetic-runtime",
      "path": "toolchain/resolution-runtime.tar.zst",
      "digestAlgorithm": "<canonical-resolution-runtime-digest version>",
      "digest": "sha256:…",
      "platformContract": "<versioned platform and path-normalization contract>",
      "locale": "C.UTF-8"
    },
    "digestAlgorithm": "<canonical-toolchain-digest version>",
    "digest": "sha256:…"
  },

  // Independently derives the fixed-point resource and capability requirement
  // sets from the retained selection, source contracts, and dependency metadata.
  // It shares no resolver implementation, so a deterministic resolver omission
  // cannot validate itself by replay.
  "closureValidator": {
    "kind": "independently-retained-closure-validator",
    "inputs": ["<validator, closure semantics, and transitive inputs>"],
    "retainedInputs": {
      "path": "toolchain/closure-validator.tar.zst",
      "digestAlgorithm": "<canonical-retained-input-archive-digest version>",
      "digest": "sha256:…"
    },
    "executionEnvironment": "<independently retained hermetic validator runtime>",
    "digestAlgorithm": "<canonical-closure-validator-digest version>",
    "digest": "sha256:…",
    "reviewBinding": {
      "reviewedInput": "/selection/reviewBinding/independentValidators/records/closure",
      "result": "equal"
    }
  },

  // Shared records are stored once, then expanded into every resource digest
  // that names them. Each interpreting document includes its own formatVersion.
  "sourceInputs": {
    "consumer:source-manifest": {
      "inputs": ["source-manifest.json"],
      "digestAlgorithm": "<canonical-shared-input-digest version>",
      "digest": "sha256:…"
    },
    "consumer:resource-contract": {
      "inputs": ["<consumer canonical-resource-contract path>"],
      "digestAlgorithm": "<canonical-shared-input-digest version>",
      "digest": "sha256:…"
    },
    "consumer:dependency-metadata": {
      "inputs": ["<consumer dependency metadata path>"],
      "digestAlgorithm": "<canonical-shared-input-digest version>",
      "digest": "sha256:…"
    },
    "wycats-plugin:source-manifest": {
      "inputs": ["<versioned source-manifest path>"],
      "digestAlgorithm": "<canonical-shared-input-digest version>",
      "digest": "sha256:…"
    },
    "wycats-plugin:resource-contract": {
      "inputs": ["<versioned canonical-resource-contract path>"],
      "digestAlgorithm": "<canonical-shared-input-digest version>",
      "digest": "sha256:…"
    },
    "wycats-plugin:dependency-metadata": {
      "inputs": ["<complete dependency metadata path>"],
      "digestAlgorithm": "<canonical-shared-input-digest version>",
      "digest": "sha256:…"
    },
    "wycats-plugin:capability-contract/parallel-exploration": {
      "inputs": ["capabilities/parallel-exploration.contract.json"],
      "formatVersion": "<capability-contract-format version>",
      "digestAlgorithm": "<canonical-capability-contract-digest version>",
      "digest": "sha256:…"
    },
    "wycats-plugin:capability-contract/native-typescript-hook-runtime": {
      "inputs": ["capabilities/native-typescript-hook-runtime.contract.json"],
      "formatVersion": "<capability-contract-format version>",
      "digestAlgorithm": "<canonical-capability-contract-digest version>",
      "digest": "sha256:…"
    },
    "shared-contracts.example:model-role/auxiliary": {
      "authority": {
        "provider": "<contract provider>",
        "kind": "<provider-issued contract authority kind>",
        "id": "<same immutable authority pinned by the selection>"
      },
      "locator": "<same authenticated locator pinned by the selection>",
      "inputs": ["contracts/auxiliary-model.role-contract.json"],
      "formatVersion": "<shared-role-contract-format version>",
      "contractVersion": "<shared role-contract semantic version>",
      "digestAlgorithm": "<canonical-shared-role-contract-digest version>",
      "digest": "sha256:…",
      "selectionBinding": "<same identity and complete digest record pinned by selection.sharedRoleContracts>",
      "sourceAssent": {
        "consumer": "<complete versioned digest record of the consumer source contract naming this exact record>",
        "wycats-plugin": "<complete versioned digest record of the upstream source contract naming this exact record>"
      },
      "redistribution": {
        "license": "<retained content-addressed license record covering the contract bytes>",
        "notices": ["<every retained content-addressed notice required by the contract authority>"],
        "secretSafety": {
          "result": "<retained versioned content-addressed passing scan result over the contract bytes>",
          "scanner": "<retained content-addressed scanner record>",
          "rules": "<retained versioned content-addressed scan rules>",
          "executionEnvironment": "<retained content-addressed hermetic scanner runtime>"
        }
      }
    }
  },

  // Produced by an implementation independent of the target binding machinery.
  // It compares each source-local role contract with the shared contract and
  // binds all of their complete digest records to its result.
  "sharedRoleContractCompatibility": {
    "shared-contracts.example:model-role/auxiliary": {
      "validator": {
        "inputs": "<independently retained validator, rules, runtime, and digest records>",
        "reviewBinding": {
          "reviewedInput": "/selection/reviewBinding/independentValidators/records/shared-role-compatibility",
          "result": "equal"
        }
      },
      "sourceContracts": [
        "<complete consumer role-contract digest record>",
        "<complete wycats-plugin role-contract digest record>"
      ],
      "sharedContract": "<complete shared role-contract digest record>",
      "result": "compatible"
    }
  },

  // What closure added on top of the selected `resources`, recorded so it is
  // reviewable.
  "closureAdded": [
    "wycats-plugin:skills/recon",
    "wycats-plugin:agents/recon-worker",
    "wycats-plugin:stances/interpretive-synthesis",
    "wycats-plugin:stances/gap-reading",
    "wycats-plugin:stances/diagnostic-questioning",
    "wycats-plugin:stances/collaborative-grounding",
    "wycats-plugin:stances/relational-continuity",
    "wycats-plugin:stances/authorial-continuity",
    "wycats-plugin:stances/public-design-reasoning",
    "wycats-plugin:stances/observational-grounding"
  ],

  // Exhaustive normalized resource-requirement edges rederived by the reviewed
  // closure validator. Reports reference these records rather than supplying an
  // unauthenticated digest as their own explanation.
  "resourceRequirements": {
    "formatVersion": "<normalized-resource-requirement-edge-format version>",
    "edgeDigestAlgorithm": "<canonical-resource-requirement-edge-digest version>",
    "edges": {
      "wycats-plugin:skills/recon -> wycats-plugin:agents/recon-worker": {
        "from": "wycats-plugin:skills/recon",
        "to": "wycats-plugin:agents/recon-worker",
        "sourceMetadata": {
          "sourceInputRef": "wycats-plugin:dependency-metadata",
          "locator": {
            "kind": "json-pointer",
            "value": "<pointer to the exact requires-resources entry>"
          }
        },
        "digestAlgorithm": "<same canonical-resource-requirement-edge-digest version>",
        "digest": "sha256:…"
      }
      // … exactly one entry for every normalized resource-requirement edge in
      // the post-closure set.
    }
  },

  // Capability requirements do not add canonical files. They remain attached to
  // the resource that declared them so every target can validate a native binding
  // before classifying that resource as active.
  "capabilityRequirements": {
    "wycats-plugin:skills/recon": [
      {
        "identity": {
          "source": "wycats-plugin",
          "kind": "capability-contract",
          "name": "parallel-exploration",
          "version": "<parallel-exploration contract version>",
          "digestAlgorithm": "<canonical-capability-contract-digest version>",
          "digest": "sha256:…",
          "sourceInputRef": "wycats-plugin:capability-contract/parallel-exploration"
        }
      }
    ],
    "wycats-plugin:hooks/native-ts-enforcement": [
      {
        "identity": {
          "source": "wycats-plugin",
          "kind": "capability-contract",
          "name": "native-typescript-hook-runtime",
          "version": "<native TypeScript hook runtime contract version>",
          "digestAlgorithm": "<canonical-capability-contract-digest version>",
          "digest": "sha256:…",
          "sourceInputRef": "wycats-plugin:capability-contract/native-typescript-hook-runtime"
        }
      }
    ]
  },

  // Every entry records the source's resolved machine-readable input boundary,
  // even when it contains only the entry file. Paths are normalized, source-
  // relative, and confined to the resolved snapshot. The digest covers entry
  // files, supporting files, shared runtime inputs, and the expanded source-input
  // records that interpret the resource, so changes cannot hide behind an
  // unchanged entry file.
  "resources": {
    "consumer:skills/housekeeping": {
      "inputs": ["skills/housekeeping/SKILL.md"],
      "sharedInputRefs": [
        "consumer:source-manifest",
        "consumer:resource-contract",
        "consumer:dependency-metadata"
      ],
      "digestAlgorithm": "<canonical-resource-digest version>",
      "digest": "sha256:…"
    },
    "wycats-plugin:agents/slop-linter": {
      "inputs": ["agents/slop-linter.agent.md"],
      "sharedInputRefs": [
        "wycats-plugin:source-manifest",
        "wycats-plugin:resource-contract",
        "wycats-plugin:dependency-metadata"
      ],
      "digestAlgorithm": "<canonical-resource-digest version>",
      "digest": "sha256:…"
    },
    "wycats-plugin:agents/recon": {
      "inputs": ["agents/recon.agent.md"],
      "sharedInputRefs": [
        "wycats-plugin:source-manifest",
        "wycats-plugin:resource-contract",
        "wycats-plugin:dependency-metadata"
      ],
      "digestAlgorithm": "<canonical-resource-digest version>",
      "digest": "sha256:…"
    },
    "wycats-plugin:skills/recon": {
      "inputs": ["skills/recon/SKILL.md"],
      "sharedInputRefs": [
        "wycats-plugin:source-manifest",
        "wycats-plugin:resource-contract",
        "wycats-plugin:dependency-metadata",
        "wycats-plugin:capability-contract/parallel-exploration"
      ],
      "digestAlgorithm": "<canonical-resource-digest version>",
      "digest": "sha256:…"
    },
    "wycats-plugin:agents/recon-worker": {
      "inputs": ["agents/recon-worker.agent.md"],
      "sharedInputRefs": [
        "wycats-plugin:source-manifest",
        "wycats-plugin:resource-contract",
        "wycats-plugin:dependency-metadata"
      ],
      "digestAlgorithm": "<canonical-resource-digest version>",
      "digest": "sha256:…"
    },
    "wycats-plugin:skills/dangling-thread-review": {
      "inputs": ["skills/dangling-thread-review/SKILL.md"],
      "sharedInputRefs": [
        "wycats-plugin:source-manifest",
        "wycats-plugin:resource-contract",
        "wycats-plugin:dependency-metadata"
      ],
      "digestAlgorithm": "<canonical-resource-digest version>",
      "digest": "sha256:…"
    },
    "wycats-plugin:instructions/environment": {
      "inputs": ["instructions/environment.instructions.md"],
      "sharedInputRefs": [
        "wycats-plugin:source-manifest",
        "wycats-plugin:resource-contract",
        "wycats-plugin:dependency-metadata"
      ],
      "digestAlgorithm": "<canonical-resource-digest version>",
      "digest": "sha256:…"
    },
    "wycats-plugin:hooks/native-ts-enforcement": {
      "inputs": [
        "hooks/native-ts-enforcement.json",
        "scripts/hooks/enforce-native-ts.ts",
        "packages/agent-hooks/package.json",
        "packages/agent-hooks/src/index.ts",
        "packages/agent-hooks/tools.json"
      ],
      "sharedInputRefs": [
        "wycats-plugin:source-manifest",
        "wycats-plugin:resource-contract",
        "wycats-plugin:dependency-metadata",
        "wycats-plugin:capability-contract/native-typescript-hook-runtime"
      ],
      "digestAlgorithm": "<canonical-resource-digest version>",
      "digest": "sha256:…"
    },
    "wycats-plugin:stances/gap-reading": {
      "inputs": ["stances/gap-reading/SKILL.md"],
      "sharedInputRefs": [
        "wycats-plugin:source-manifest",
        "wycats-plugin:resource-contract",
        "wycats-plugin:dependency-metadata"
      ],
      "digestAlgorithm": "<canonical-resource-digest version>",
      "digest": "sha256:…"
    },
    // … one entry per resource in the resolved set
  },

  // Versioned framing and ordering over every source-qualified identity and its
  // complete-resource digest. Evidence binds to this locked record.
  "resolvedSet": {
    "digestAlgorithm": "<canonical-resolved-set-digest version>",
    "digest": "sha256:…"
  },

  "targets": {
    "vscode": {
      "adapter": "<complete retained adapter input and digest record>",
      "configuration": "<complete retained configuration input and digest record bound to selection.reviewBinding.targetConfigurations.vscode>",
      "executionEnvironment": "<retained content-addressed hermetic runtime or self-contained executable, including its versioned normalization contract>",
      "packager": "<complete retained packager input and digest record>",
      "projectionDiffValidator": "<independently retained validator, rules, runtime, and digest record bound to selection.reviewBinding.projectionDiffValidators.vscode>",
      "installable": "<canonical final-tree digest record>",
      "adapterReport": "<canonical report digest record>"
    },
    "claude-code": {
      "adapter": {
        "id": "<adapter identity and version>",
        "inputs": ["<adapter and transitive transformation inputs>"],
        "retainedInputs": {
          "kind": "content-addressed-archive",
          "path": "toolchain/claude-code-adapter.tar.zst",
          "digestAlgorithm": "<canonical-retained-input-archive-digest version>",
          "digest": "sha256:…"
        },
        "digestAlgorithm": "<canonical-toolchain-digest version>",
        "digest": "sha256:…"
      },
      "configuration": {
        "inputs": ["<resolved target configuration inputs>"],
        "retainedInputs": {
          "kind": "content-addressed-archive",
          "path": "configuration/claude-code.tar.zst",
          "digestAlgorithm": "<canonical-retained-input-archive-digest version>",
          "digest": "sha256:…"
        },
        "digestAlgorithm": "<canonical-configuration-digest version>",
        "digest": "sha256:…",
        "reviewBinding": {
          "recordIdentity": "<same external consumer review record identity as selection.reviewBinding>",
          "reviewedInput": "/selection/reviewBinding/targetConfigurations/claude-code",
          "result": "equal"
        }
      },
      "executionEnvironment": {
        "kind": "hermetic-runtime",
        "retainedExecutable": {
          "kind": "content-addressed-artifact",
          "path": "runtime/claude-code-build-runtime",
          "digestAlgorithm": "<canonical-retained-executable-digest version>",
          "digest": "sha256:…"
        },
        "digestAlgorithm": "<canonical-runtime-environment-digest version>",
        "digest": "sha256:…"
      },
      // Redistribution coverage for third-party bytes added by this target,
      // rather than inherited from either resource source.
      "redistribution": [{
        "appliesTo": ["runtime/node"],
        "authority": {
          "provider": "<runtime distribution provider>",
          "kind": "<provider-issued immutable release identity kind>",
          "id": "<immutable runtime release identity>"
        },
        "artifact": {
          "path": "runtime/node",
          "digestAlgorithm": "<canonical-retained-executable-digest version>",
          "digest": "sha256:…"
        },
        "license": "<retained content-addressed runtime license record>",
        "notices": ["<every retained content-addressed notice required by the runtime authority>"],
        "secretSafety": {
          "result": "<retained versioned content-addressed passing scan result over the packaged runtime>",
          "scanner": "<retained content-addressed scanner record>",
          "rules": "<retained versioned content-addressed scan rules>",
          "executionEnvironment": "<retained content-addressed hermetic scanner runtime>"
        }
      }],
      "packager": {
        "inputs": ["<packager and transitive packaging inputs>"],
        "retainedInputs": {
          "kind": "content-addressed-archive",
          "path": "toolchain/claude-code-packager.tar.zst",
          "digestAlgorithm": "<canonical-retained-input-archive-digest version>",
          "digest": "sha256:…"
        },
        "digestAlgorithm": "<canonical-toolchain-digest version>",
        "digest": "sha256:…"
      },
      "projectionDiffValidator": {
        "id": "<independent projection-diff validator identity and version>",
        "inputs": ["<validator, envelope rules, and transitive inputs>"],
        "retainedInputs": {
          "kind": "content-addressed-archive",
          "path": "toolchain/claude-code-projection-diff-validator.tar.zst",
          "digestAlgorithm": "<canonical-retained-input-archive-digest version>",
          "digest": "sha256:…"
        },
        "executionEnvironment": "<independently retained hermetic validator runtime>",
        "digestAlgorithm": "<canonical-toolchain-digest version>",
        "digest": "sha256:…",
        "reviewBinding": {
          "recordIdentity": "<same external consumer review record identity as selection.reviewBinding>",
          "reviewedInput": "/selection/reviewBinding/projectionDiffValidators/claude-code",
          "result": "equal"
        }
      },
      "installable": {
        // Canonical final tree users install, after source-attributed notices and
        // host manifests are placed.
        "digestAlgorithm": "<canonical-installable-digest version>",
        "digest": "sha256:…"
      },
      "adapterReport": {
        "digestAlgorithm": "<canonical-report-digest version>",
        "digest": "sha256:…"
      }
    },
    "codex": {
      "adapter": "<complete retained adapter input and digest record>",
      "configuration": "<complete retained configuration input and digest record bound to selection.reviewBinding.targetConfigurations.codex>",
      "executionEnvironment": "<retained content-addressed hermetic runtime or self-contained executable, including its versioned normalization contract>",
      "packager": "<complete retained packager input and digest record>",
      "projectionDiffValidator": "<independently retained validator, rules, runtime, and digest record bound to selection.reviewBinding.projectionDiffValidators.codex>",
      "installable": "<canonical final-tree digest record>",
      "adapterReport": "<canonical report digest record>"
    }
  }
}
```

The abbreviated VS Code and Codex entries carry the same complete record expanded
for Claude Code. A complete lock cannot omit a supported target; a separate
per-target lock design would instead need each lock to bind itself to the same
selection and resolved set.

## Appendix C: adapter report

What one target adapter did, and what it could not represent. It carries no
verdict about behavior (R5).

The output list below assumes selection-aware copying across every resource
section. Filtering discovery is not enough while the current build still copies
the entire `skills/` tree for every target, the entire `stances/` and
`instructions/` trees for VS Code, and the entire `scripts/hooks/` tree whenever
one hook is present. Extra skills and instructions are host-discoverable resources
and cannot be reclassified as support output. The proof must replace those
directory copies with copies derived from the resolved resources' locked input
boundaries. An adapter that still emits the two unselected hook scripts must list
them as support outputs and would still fail the exact-subset responsibility.
Generated metadata is part of the same proof. The current full-corpus Codex
manifest legitimately advertises implementation-quality, walkthrough, and recon
workflows. Reusing those descriptions and default prompts unchanged for this
subset would advertise skills outside its active projection. A selection-aware
packager must derive the fields from the resolved active set or reject the
dangling references before it can emit the locked support output.

```jsonc
{
  "formatVersion": "<adapter-report-format version>",
  "target": "claude-code",
  "runtimeContract": {
    "host": "claude-code",
    "hostVersion": "<version>",
    "hostBuildIdentity": "<immutable provider build identity>",
    "platform": {
      "id": "<versioned relevant platform contract>",
      "digestAlgorithm": "<canonical-platform-contract-digest version>",
      "digest": "sha256:…"
    },
    "adapterVersion": "<adapter version>"
  },

  // Every capability required by the locked resources has one explicit target
  // result. A missing or invalid binding participates in the same fixed-point
  // availability propagation as a missing resource requirement.
  "capabilityBindings": [
    {
      "contract": {
        "source": "wycats-plugin",
        "kind": "capability-contract",
        "name": "parallel-exploration",
        "version": "<parallel-exploration contract version>",
        "digestAlgorithm": "<canonical-capability-contract-digest version>",
        "digest": "sha256:…"
      },
      "status": "represented",
      "nativeIdentity": {
        "host": "claude-code",
        "kind": "native-capability",
        "name": "agent-delegation"
      },
      "nativeContract": {
        "formatVersion": "<native-capability-contract-document-format version>",
        "version": "<host capability-contract version>",
        "path": "capabilities/claude-code-agent-delegation.json",
        "digestAlgorithm": "<canonical-capability-contract-digest version>",
        "digest": "sha256:…",
        // Retained beside the native-contract document; it is not part of the
        // bytes whose digest it signs.
        "providerAttestation": {
          "formatVersion": "<provider-native-contract-attestation-format version>",
          "providerAuthority": "<same immutable provider authority as statement.contents.providerAuthority>",
          "hostBuildIdentity": "<same immutable build identity as statement.contents.hostBuildIdentity and runtimeContract.hostBuildIdentity>",
          "statement": {
            "path": "attestations/claude-code-agent-delegation.statement.json",
            "contents": {
              "providerAuthority": "<immutable Claude Code provider authority>",
              "hostBuildIdentity": "<immutable Claude Code build identity>",
              "nativeContract": {
                "digestAlgorithm": "<same canonical-capability-contract-digest version as nativeContract>",
                "digest": "<same nativeContract digest>"
              }
            },
            "digestAlgorithm": "<canonical-provider-attestation-statement-digest version>",
            "digest": "sha256:…"
          },
          "signer": "<immutable authorized provider signer>",
          "trustPolicy": {
            "id": "<versioned provider trust policy>",
            "path": "policies/claude-code-provider.json",
            "digestAlgorithm": "<canonical-provider-trust-policy-digest version>",
            "digest": "sha256:…"
          },
          "authorizationBinding": {
            "targetConfigurationPointer": "/providerAuthorities/claude-code-native-contracts",
            "providerAuthority": "<same immutable provider authority pinned there>",
            "signer": "<same native-contract signer pinned there>",
            "trustPolicy": "<same complete trust-policy digest record pinned there>"
          },
          "signature": "<detached signature over the complete canonical statement, including providerAuthority, hostBuildIdentity, and nativeContract digest>"
        }
      },
      "validation": {
        "requiredContract": {
          "digestAlgorithm": "<canonical-capability-contract-digest version>",
          "digest": "sha256:…"
        },
        "nativeContract": {
          "digestAlgorithm": "<canonical-capability-contract-digest version>",
          "digest": "sha256:…"
        },
        "validator": {
          "kind": "independently-retained-capability-contract-validator",
          "path": "toolchain/capability-contract-validator.tar.zst",
          "digestAlgorithm": "<canonical-capability-validator-digest version>",
          "digest": "sha256:…",
          "executionEnvironment": {
            "kind": "retained-hermetic-runtime",
            "path": "toolchain/capability-validator-runtime.tar.zst",
            "digestAlgorithm": "<canonical-capability-validator-runtime-digest version>",
            "digest": "sha256:…"
          },
          "reviewBinding": {
            "reviewedInput": "/selection/reviewBinding/independentValidators/records/capability-contract-compatibility",
            "result": "equal"
          }
        },
        "proof": {
          "path": "proofs/claude-code-parallel-exploration.json",
          "formatVersion": "<capability-compatibility-proof-format version>",
          "digestAlgorithm": "<canonical-capability-compatibility-proof-digest version>",
          "digest": "sha256:…",
          "verificationContract": "<versioned capability-proof verification contract>"
        },
        "result": "compatible"
      }
    },
    {
      "contract": {
        "source": "wycats-plugin",
        "kind": "capability-contract",
        "name": "native-typescript-hook-runtime",
        "version": "<native TypeScript hook runtime contract version>",
        "digestAlgorithm": "<canonical-capability-contract-digest version>",
        "digest": "sha256:…"
      },
      "status": "represented",
      "nativeIdentity": {
        "kind": "retained-runtime-capability",
        "name": "packaged-node-typescript-execution"
      },
      "nativeContract": {
        "formatVersion": "<native-capability-contract-document-format version>",
        "path": "capabilities/packaged-node-typescript-execution.json",
        "digestAlgorithm": "<canonical-capability-contract-digest version>",
        "digest": "sha256:…",
        "runtimeExecutable": {
          "path": "runtime/node",
          "digestAlgorithm": "<canonical-retained-executable-digest version>",
          "digest": "sha256:…",
          "redistributionRef": "/targets/claude-code/redistribution/0"
        }
      },
      "validation": {
        "validator": {
          "path": "toolchain/runtime-capability-validator.tar.zst",
          "digestAlgorithm": "<canonical-capability-validator-digest version>",
          "digest": "sha256:…",
          "executionEnvironment": "<retained content-addressed hermetic validator runtime>",
          "reviewBinding": {
            "reviewedInput": "/selection/reviewBinding/independentValidators/records/runtime-capability",
            "result": "equal"
          }
        },
        "probe": {
          "path": "proofs/packaged-node-typescript-execution.json",
          "formatVersion": "<runtime-capability-probe-format version>",
          "digestAlgorithm": "<canonical-runtime-capability-probe-digest version>",
          "digest": "sha256:…",
          "bindings": "<runtime executable and complete required/native contract digest records>",
          "result": "passed"
        },
        "result": "compatible"
      }
    }
  ],

  // Facts name source-qualified resources, allowing one report to cover
  // consumer-authored resources, adopted resources, and facts involving both.
  // Source snapshots remain in the lock.

  // Complete identity-to-output mapping for every active resource. A
  // locator can also name a target-native member when several resources share a
  // consolidated host file.
  "projected": {
    "consumer:skills/housekeeping": [
      { "path": "skills/housekeeping/SKILL.md" }
    ],
    "wycats-plugin:agents/slop-linter": [
      { "path": "agents/slop-linter.agent.md" }
    ],
    "wycats-plugin:agents/recon": [
      { "path": "agents/recon.agent.md" }
    ],
    "wycats-plugin:agents/recon-worker": [
      { "path": "agents/recon-worker.agent.md" }
    ],
    "wycats-plugin:skills/recon": [
      { "path": "skills/recon/SKILL.md" }
    ],
    "wycats-plugin:skills/gh-write-pr-description": [
      { "path": "skills/gh-write-pr-description/SKILL.md" }
    ],
    "wycats-plugin:skills/dangling-thread-review": [
      { "path": "skills/dangling-thread-review/SKILL.md" }
    ],
    "wycats-plugin:hooks/native-ts-enforcement": [
      {
        "path": "hooks/hooks.json",
        "member": {
          "kind": "json-pointer",
          "value": "/hooks/PreToolUse/0"
        }
      },
      { "path": "scripts/hooks/enforce-native-ts.ts" }
    ],
    "wycats-plugin:stances/interpretive-synthesis": [
      { "path": "skills/interpretive-synthesis/SKILL.md" }
    ],
    "wycats-plugin:stances/gap-reading": [
      { "path": "skills/gap-reading/SKILL.md" }
    ],
    "wycats-plugin:stances/diagnostic-questioning": [
      { "path": "skills/diagnostic-questioning/SKILL.md" }
    ],
    "wycats-plugin:stances/collaborative-grounding": [
      { "path": "skills/collaborative-grounding/SKILL.md" }
    ],
    "wycats-plugin:stances/relational-continuity": [
      { "path": "skills/relational-continuity/SKILL.md" }
    ],
    "wycats-plugin:stances/authorial-continuity": [
      { "path": "skills/authorial-continuity/SKILL.md" }
    ],
    "wycats-plugin:stances/public-design-reasoning": [
      { "path": "skills/public-design-reasoning/SKILL.md" }
    ],
    "wycats-plugin:stances/observational-grounding": [
      { "path": "skills/observational-grounding/SKILL.md" }
    ]
  },

  // Resources copied into the installable without host discovery or activation.
  // Claude Code activates all three resolved agents, so this target has none.
  "referenceOnly": {},

  // Complete list of non-resource files. They are attributed separately and
  // cannot add another host-discoverable resource. A shared support file appears
  // exactly once with the exhaustive set of active resources that contributed
  // to it, so one emitted addition never acquires several competing locators.
  "supportOutputs": [
    {
      "path": ".claude-plugin/plugin.json",
      "provenance": "generated by the locked Claude Code adapter from locked plugin metadata"
    },
    {
      "path": "package.json",
      "provenance": "generated by the locked Claude Code adapter for hook script module semantics"
    },
    {
      "path": "runtime/node",
      "kind": "shared-hook-runtime",
      "contributors": ["wycats-plugin:hooks/native-ts-enforcement"],
      "provenance": "one packaged runtime shared by every contributing active hook that requires the locked native TypeScript runtime capability"
    },
    {
      "path": "node_modules/@wycats/agent-hooks/package.json",
      "kind": "shared-hook-runtime",
      "contributors": ["wycats-plugin:hooks/native-ts-enforcement"],
      "provenance": "shared package metadata derived from the complete locked inputs of every contributing active hook"
    },
    {
      "path": "node_modules/@wycats/agent-hooks/tools.json",
      "kind": "shared-hook-runtime",
      "contributors": ["wycats-plugin:hooks/native-ts-enforcement"],
      "provenance": "shared tool metadata derived from the complete locked inputs of every contributing active hook"
    },
    {
      "path": "node_modules/@wycats/agent-hooks/src/index.js",
      "kind": "shared-hook-runtime",
      "contributors": ["wycats-plugin:hooks/native-ts-enforcement"],
      "provenance": "one transpiled shared package implementation for every contributing active hook"
    },
    {
      "path": "THIRD_PARTY_NOTICES.md",
      "provenance": "generated from every locked source, shared-contract, and target-runtime redistribution artifact"
    }
  ],

  // What the adapter DID. Declared and inspectable, which is what distinguishes
  // these from a silent rewrite.
  "applied": [
    {
      // The canonical agent declares the abstract role `auxiliary`. The concrete
      // model comes from the configuration used for THIS build, so this is the
      // adapter's applied binding, not an override of some canonical default:
      // upstream's example config is a comparator, not an inherited value.
      "resources": ["wycats-plugin:agents/slop-linter"],
      "kind": "model-role",
      "from": "auxiliary",
      "to": "sonnet",
      "source": {
        "kind": "json-pointer",
        "document": "target-configuration",
        "value": "/sharedRoleContracts/shared-contracts.example:model-role~1auxiliary/model"
      }
    },
    {
      "resources": ["wycats-plugin:agents/recon"],
      "kind": "model-role",
      "from": "fast",
      "to": "opus",
      "source": {
        "kind": "json-pointer",
        "document": "target-configuration",
        "value": "/resources/wycats-plugin:agents~1recon/models/fast"
      }
    },
    {
      "resources": ["wycats-plugin:agents/recon"],
      "kind": "frontmatter-name",
      "from": "absent",
      "to": "recon",
      "detail": "derived from the canonical filename for this host's required name field"
    },
    {
      "resources": ["wycats-plugin:agents/recon"],
      "kind": "tool-groups",
      "from": ["core", "agent", "browser", "memory", "exo", "terminal", "testing"],
      "to": ["Read", "Grep", "Glob", "WebFetch", "WebSearch", "TodoWrite", "Agent", "Write", "Bash", "BashOutput", "KillShell"],
      "source": {
        "kind": "json-pointer",
        "document": "target-configuration",
        "value": "/sources/wycats-plugin/toolGroups"
      }
    },
    {
      "resources": ["wycats-plugin:agents/recon"],
      "kind": "tool-group-omission",
      "from": "exo",
      "to": [],
      "source": {
        "kind": "json-pointer",
        "document": "target-configuration",
        "value": "/sources/wycats-plugin/toolGroups/exo"
      }
    },
    {
      "resources": ["wycats-plugin:hooks/native-ts-enforcement"],
      "kind": "hook-event-envelope-mapping",
      "from": {
        "field": "events",
        "value": ["PreToolUse"]
      },
      "to": {
        "objectKey": "PreToolUse",
        "member": {
          "kind": "json-pointer",
          "value": "/hooks/PreToolUse/0"
        }
      },
      "detail": "the canonical event list becomes the Claude Code hook-map key and array membership"
    },
    {
      "resources": ["wycats-plugin:hooks/native-ts-enforcement"],
      "kind": "hook-timeout-relocation",
      "from": {
        "field": "timeout",
        "value": 5
      },
      "to": {
        "field": "timeout",
        "value": 5,
        "member": {
          "kind": "json-pointer",
          "value": "/hooks/PreToolUse/0/hooks/0/timeout"
        }
      },
      "detail": "the canonical hook timeout moves into the generated Claude Code command handler"
    },
    {
      "resources": ["wycats-plugin:hooks/native-ts-enforcement"],
      "kind": "hook-matcher-role",
      "from": "terminal",
      "to": "Bash",
      "source": {
        "kind": "json-pointer",
        "document": "target-configuration",
        "value": "/sources/wycats-plugin/hookMatchers/terminal"
      }
    },
    {
      "resources": ["wycats-plugin:hooks/native-ts-enforcement"],
      "kind": "canonical-classification-omission",
      "field": "type",
      "from": "policy",
      "reason": "this host's executable hook handler does not carry the canonical policy/observer classification"
    },
    {
      "resources": ["wycats-plugin:hooks/native-ts-enforcement"],
      "kind": "host-envelope-field-insertion",
      "field": "type",
      "to": "command",
      "detail": "the Claude Code hook envelope classifies this generated handler as an executable command; this does not preserve the omitted canonical policy classification"
    },
    {
      "resources": ["wycats-plugin:hooks/native-ts-enforcement"],
      "kind": "canonical-name-omission",
      "field": "name",
      "from": "native-ts-enforcement",
      "reason": "this host identifies the consolidated hook only by event and array position; the adapter report retains the source-qualified identity and output locator"
    },
    {
      "resources": ["wycats-plugin:hooks/native-ts-enforcement"],
      "kind": "hook-command-construction",
      "from": "enforce-native-ts.ts",
      "to": "\"$CLAUDE_PLUGIN_ROOT/runtime/node\" \"$CLAUDE_PLUGIN_ROOT/scripts/hooks/enforce-native-ts.ts\"",
      "detail": "constructed from the canonical script field and the validated retained runtime capability for this host's plugin-root command form"
    },
    {
      "resources": ["wycats-plugin:hooks/native-ts-enforcement"],
      "kind": "runtime-package-manifest",
      "from": "./src/index.ts",
      "to": "./src/index.js",
      "source": {
        "path": "packages/agent-hooks/package.json",
        "member": {
          "kind": "json-pointer",
          "value": "/exports/."
        }
      },
      "output": {
        "path": "node_modules/@wycats/agent-hooks/package.json",
        "member": {
          "kind": "json-pointer",
          "value": "/exports/."
        }
      },
      "detail": "rewrote exports to ./src/index.js while preserving the locked source package metadata"
    },
    {
      "resources": ["wycats-plugin:hooks/native-ts-enforcement"],
      "kind": "runtime-transpilation",
      "from": "packages/agent-hooks/src/index.ts",
      "to": "node_modules/@wycats/agent-hooks/src/index.js",
      "detail": "transpiled to the locked target and module settings"
    },
    {
      "resources": ["wycats-plugin:agents/recon-worker"],
      "kind": "model-role",
      "from": "fast",
      "to": "opus",
      "source": {
        "kind": "json-pointer",
        "document": "target-configuration",
        "value": "/sources/wycats-plugin/models/fast"
      }
    },
    {
      "resources": ["wycats-plugin:agents/recon-worker"],
      "kind": "frontmatter-name",
      "from": "absent",
      "to": "recon-worker",
      "detail": "derived from the canonical filename for this host's required name field"
    },
    {
      "resources": ["wycats-plugin:agents/recon-worker"],
      "kind": "tool-groups",
      "from": ["core", "browser", "memory", "exo", "terminal-minimal", "github"],
      "to": ["Read", "Grep", "Glob", "WebFetch", "WebSearch", "TodoWrite", "Write", "Bash"],
      "source": {
        "kind": "json-pointer",
        "document": "target-configuration",
        "value": "/sources/wycats-plugin/toolGroups"
      }
    },
    {
      "resources": ["wycats-plugin:agents/recon-worker"],
      "kind": "tool-group-omission",
      "from": "exo",
      "to": [],
      "source": {
        "kind": "json-pointer",
        "document": "target-configuration",
        "value": "/sources/wycats-plugin/toolGroups/exo"
      }
    },
    {
      "resources": ["wycats-plugin:agents/recon-worker"],
      "kind": "frontmatter-omission",
      "field": "user-invocable",
      "from": false,
      "reason": "this host does not consume the VS Code-specific field"
    },
    {
      // Every resource the change applied to, not a representative one. This
      // build's Claude Code adapter materializes ALL closure-added stances under
      // skills/, so naming only the first would leave seven placements
      // uninspectable — which is the silence R5 exists to prevent.
      //
      // An entry MAY cover a class rather than a single resource, but it must
      // name every member, so "what happened to X" stays answerable for each X.
      "resources": [
        "wycats-plugin:stances/interpretive-synthesis",
        "wycats-plugin:stances/gap-reading",
        "wycats-plugin:stances/diagnostic-questioning",
        "wycats-plugin:stances/collaborative-grounding",
        "wycats-plugin:stances/relational-continuity",
        "wycats-plugin:stances/authorial-continuity",
        "wycats-plugin:stances/public-design-reasoning",
        "wycats-plugin:stances/observational-grounding"
      ],
      "kind": "placement",
      "detail": "materialized into skills/ (this host discovers skills, not stances)"
    }
  ],

  // What the host could not represent. Structural facts only. Includes what the
  // build already drops per target, not just anything selection introduced.
  // An empty list means every identity produced an output. It does NOT mean every
  // output is active or behavior was preserved: reference-only status and evidence
  // answer those separate questions.
  "notRepresented": [
    {
      "resource": "wycats-plugin:instructions/environment",
      "reason": "this host has no active instruction projection"
    }
  ]
}
```

The complete VS Code and Codex reports have the same shape. Their entries for the
instruction and hook make the target boundary concrete:

| Target | `instructions/environment` | `hooks/native-ts-enforcement` |
| --- | --- | --- |
| VS Code | projected to `instructions/environment.instructions.md` | projected to `hooks/native-ts-enforcement.json` |
| Claude Code | unrepresentable | projected to `hooks/hooks.json`, JSON Pointer `/hooks/PreToolUse/0` |
| Codex | unrepresentable | unrepresentable |

For each target, these entries sit inside a complete report that partitions the
same resolved set recorded by the lock.

A checked release index sits outside the reproducible target transformation and
enumerates exactly one current preservation-evidence bundle for each locked
target. The lock supplies its canonical relative locator and format version, so a
check beginning from the lock fails if the index is absent; it does not digest the
mutable index as a transformation input. Each entry carries the target, retained
bundle path, bundle format version, and canonical bundle digest record. `check`
requires the index to cover the lock's target set exactly and verifies each
bundle's bindings, so deleting an evidence artifact cannot silently remove the
target's exhaustive `unverified` disclosure.

The index is also one signed generation in the append-only sequence whose identity,
checkpoint locator, signer, and trust policy are pinned by the reviewed selection.
The lock bundle retains the versioned checkpoint trust-policy bytes under the
selection's complete digest record, so later and offline checks can still evaluate
the signer and authorization rules.
Each generation binds the previous generation's complete digest record. A current
check resolves the latest authenticated checkpoint and requires its sequence and
index digest to match; restoring an older, still-valid bundle therefore fails the
freshness check. A retained checkpoint supports an explicit "fresh as of" result
when the current checkpoint is unavailable, not a claim that the retained index is
still current. Producing new live evidence appends a reviewed generation without
making the model-backed run part of the deterministic build.

```jsonc
{
  "envelopeFormatVersion": "<release-evidence-index-envelope-format version>",
  "index": {
    "formatVersion": "<release-evidence-index-format version>",
    "sequence": 42,
    "previousIndexDigest": {
      "digestAlgorithm": "<canonical-release-evidence-index-digest version>",
      "digest": "sha256:…"
    },
    "targets": {
      "vscode": "<one retained preservation-evidence bundle record>",
      "claude-code": {
        "path": "evidence/claude-code.bundle.json",
        "bundleFormatVersion": "<preservation-evidence-bundle-format version>",
        "digestAlgorithm": "<canonical-preservation-evidence-bundle-digest version>",
        "digest": "sha256:…"
      },
      "codex": "<one retained preservation-evidence bundle record>"
    }
  },
  // Complete digest record computed over the canonical `index` value above.
  "indexDigest": {
    "digestAlgorithm": "<canonical-release-evidence-index-digest version>",
    "digest": "sha256:…"
  },
  "retainedCheckpoint": {
    "formatVersion": "<evidence-index-checkpoint-format version>",
    "logIdentity": "<same immutable log identity pinned by the selection>",
    "sequence": 42,
    "indexDigest": {
      "digestAlgorithm": "<same canonical-release-evidence-index-digest version>",
      "digest": "<same index digest>"
    },
    "signer": "<same immutable checkpoint signer pinned by the selection>",
    "trustPolicy": {
      "id": "<same versioned checkpoint trust policy>",
      "path": "policies/evidence-index-checkpoint.json",
      "digestAlgorithm": "<same canonical-checkpoint-trust-policy-digest version>",
      "digest": "<same checkpoint trust-policy digest>"
    },
    "signature": "<signature over the canonical checkpoint statement above>"
  }
}
```

The Codex report also maps `agents/slop-linter`, `agents/recon`, and
`agents/recon-worker` under `referenceOnly`, each to its copied
`agents/*.agent.md` path with the reason that this host packages agents as source
material but does not discover or activate them. The files remain attributable
without presenting them as active behavior.

That limitation propagates to `skills/recon`, which dispatches
`agents/recon-worker`. The current Codex adapter cannot report the skill as active
while its required worker is reference-only. Its honest report places
`skills/recon` under `notRepresented` with this machine-checkable cause:

```jsonc
{
  "resource": "wycats-plugin:skills/recon",
  "reason": "a required worker is not active on this target",
  "causes": [{
    "kind": "resource-requirement",
    "requirement": "wycats-plugin:agents/recon-worker",
    "dependencyEdge": {
      "lockPointer": "/resourceRequirements/edges/wycats-plugin:skills~1recon -> wycats-plugin:agents~1recon-worker",
      "digestAlgorithm": "<same canonical-resource-requirement-edge-digest version as the lock>",
      "digest": "<same locked edge digest>"
    },
    "targetStatus": "reference-only"
  }]
}
```

A future
adapter could instead provide a validated target-native worker projection; only
then could the skill move into the active set.

## Appendix D: preservation evidence

Observed evidence is retained separately from the deterministic adapter report. It
is bound to the exact resolved identities and complete-resource digests,
installable tree, report, runtime contract, retained evidence definition and
executable harness, and per-observation execution environments it describes (R6).
The definition and harness preserve what the observations meant after the original
implementation changes or disappears. The complete artifact
carries a versioned digest-algorithm identifier that defines its canonical
serialization and hashing. That identifier, the resulting digest, and the producer
identity are kept in an immutable reviewed record or signed CI attestation. The
outer bundle names the authorized immutable signer identity and versioned trust
policy. Its detached attestation signs a canonical statement containing the
already computed artifact digest and the authorization values pinned by the
reviewed selection, and is then retained beside it, so neither content address
depends on the other and the bundle cannot choose its own trust root. This
example records that no selection-aware smoke has run, so every resolved resource
remains unverified.

```jsonc
{
  "bundleFormatVersion": "<preservation-evidence-bundle-format version>",
  "artifact": {
    "formatVersion": "<preservation-evidence-format version>",
    "target": "claude-code",
    "artifactDigestAlgorithm": "<canonical-preservation-evidence-digest version>",
    "resolvedSet": {
      "digestAlgorithm": "<same canonical-resolved-set-digest version as the lock>",
      "digest": "<locked resolved-set digest>"
    },
    "installable": {
      "digestAlgorithm": "<same canonical-installable-digest version as the lock>",
      "digest": "<locked installable digest>"
    },
    "adapterReport": {
      "digestAlgorithm": "<same canonical-report-digest version as the lock>",
      "digest": "<locked adapter report digest>"
    },
    // Exhaustive redistribution map for bytes retained specifically by this
    // evidence artifact. Source and target-package records remain in the lock.
    "redistribution": {
      "requireExhaustiveCoverage": true,
      "records": {
        "consumer-evidence": {
          "authority": "<authenticated consumer evidence authority>",
          "appliesTo": [
            "evidence-definition",
            "observation-trace",
            "settings-record",
            "scan-result",
            "provider-attestation"
          ],
          "license": "<retained content-addressed consumer evidence license>",
          "notices": [],
          "confidentiality": {
            "requireExhaustiveCoverage": true,
            "credentialScanPolicy": "<same complete approved policy at /evidenceAuthority/credentialScanPolicy>",
            "privateEvidencePolicy": "<same complete approved policy at /evidenceAuthority/privateEvidencePolicy>",
            "coverage": "<every retained path in appliesTo is either scanned with a passing result or stored under the approved encrypted-access-controlled mode>"
          }
        },
        // One record per independently sourced evidence dependency. The harness,
        // scanner, scanner runtime, and each retained tool implementation may
        // resolve to different authority-qualified records.
        "<authority-qualified evidence dependency>": {
          "authority": "<immutable dependency authority and release identity>",
          "appliesTo": ["<every retained path supplied by this authority>"],
          "license": "<retained content-addressed dependency license>",
          "notices": ["<every retained content-addressed required notice>"],
          "secretSafety": "<passing result bound to the reviewed acquisition or credential-scan policy>"
        }
      },
      "coverage": "<one exact redistribution-record reference for every retained evidence path and inline byte record>"
    },
    "privateEvidencePolicyBinding": {
      "selectionMember": "/evidenceAuthority/privateEvidencePolicy",
      "reviewedInput": "/selection/reviewBinding/preservationEvidence/claude-code/privateEvidencePolicy",
      "encryption": "<same complete approved encryption-policy record>",
      "accessControl": "<same complete approved access-policy record>",
      "result": "equal"
    },
    "runtimeContract": {
      "host": "claude-code",
      "hostVersion": "<version>",
      "hostExecutable": {
        "providerAuthority": "<same immutable provider authority as identityAttestation.statement.contents.providerAuthority>",
        "buildIdentity": "<same immutable build identity as identityAttestation.statement.contents.hostBuildIdentity>",
        // The host executable is not copied into the evidence bundle. Its
        // immutable identity is authenticated against the provider instead.
        "identityAttestation": {
          "kind": "authenticated-provider-build-identity",
          "statement": {
            "formatVersion": "<provider-host-build-statement-format version>",
            "contents": {
              "providerAuthority": "<immutable Claude Code provider authority>",
              "hostBuildIdentity": "<immutable Claude Code build identity>"
            },
            "digestAlgorithm": "<canonical-provider-host-build-statement-digest version>",
            "digest": "sha256:…"
          },
          "signer": "<immutable authorized host-build identity signer>",
          "trustPolicy": {
            "id": "<same versioned host-build identity trust policy pinned by target configuration>",
            "path": "policies/claude-code-host-build-identity.json",
            "digestAlgorithm": "<same canonical-provider-trust-policy-digest version>",
            "digest": "<same trust-policy digest>"
          },
          "authorizationBinding": {
            "targetConfigurationPointer": "/providerAuthorities/claude-code-build-identities",
            "providerAuthority": "<same immutable provider authority pinned there>",
            "signer": "<same host-build signer pinned there>",
            "trustPolicy": "<same complete trust-policy digest record pinned there>",
            "result": "equal"
          },
          "signature": "<detached signature over the complete canonical statement>"
        }
      },
      "adapterReportRuntimeBinding": {
        "kind": "exact-runtime-contract",
        "hostBuildMember": {
          "kind": "json-pointer",
          "value": "/runtimeContract/hostBuildIdentity"
        },
        "observedBuildIdentity": "<same immutable host build identity as hostExecutable.buildIdentity>",
        "platformMember": {
          "kind": "json-pointer",
          "value": "/runtimeContract/platform"
        },
        "observedPlatform": "<same complete versioned platform-contract digest record as runtimeContract.platform>",
        "result": "equal"
      },
      "platform": {
        "id": "<same versioned relevant platform contract as the adapter report>",
        "digestAlgorithm": "<same canonical-platform-contract-digest version>",
        "digest": "<same platform-contract digest>"
      },
      "adapterVersion": "<adapter version>"
    },
    "evidence": {
      "definition": {
        "kind": "retained-canonical-evidence-definition",
        "path": "evidence/selection-aware-smoke.definition.json",
        "formatVersion": "<evidence-definition-format version>",
        "digestAlgorithm": "<canonical-evidence-definition-digest version>",
        "digest": "sha256:…",
        "redistributionRef": "/artifact/redistribution/records/consumer-evidence",
        "confidentialityRef": "/artifact/redistribution/records/consumer-evidence/confidentiality",
        "reviewBinding": {
          "reviewedInput": "/selection/reviewBinding/preservationEvidence/claude-code/definition",
          "result": "equal"
        }
      },
      "harness": {
        "kind": "retained-hermetic-executable",
        "path": "evidence/selection-aware-smoke-harness.tar.zst",
        "digestAlgorithm": "<canonical-evidence-harness-digest version>",
        "digest": "sha256:…",
        "redistributionRef": "/artifact/redistribution/records/<authority-qualified evidence dependency>",
        "reviewBinding": {
          "reviewedInput": "/selection/reviewBinding/preservationEvidence/claude-code/harness",
          "result": "equal"
        }
      },
      "aggregation": {
        "validator": {
          "path": "evidence/resource-outcome-aggregation-validator.tar.zst",
          "digestAlgorithm": "<canonical-evidence-aggregation-validator-digest version>",
          "digest": "sha256:…"
        },
        "rules": {
          "path": "evidence/resource-outcome-aggregation-rules.json",
          "formatVersion": "<resource-outcome-aggregation-rules-format version>",
          "digestAlgorithm": "<canonical-evidence-aggregation-rules-digest version>",
          "digest": "sha256:…"
        },
        "executionEnvironment": {
          "path": "evidence/resource-outcome-aggregation-runtime.tar.zst",
          "digestAlgorithm": "<canonical-evidence-aggregation-runtime-digest version>",
          "digest": "sha256:…"
        },
        "reviewBinding": {
          "reviewedInput": "/selection/reviewBinding/independentValidators/records/evidence-aggregation",
          "result": "equal"
        },
        "redistributionRef": "/artifact/redistribution/records/<authority-qualified evidence dependency>"
      },
      "status": "not-run",
      // One entry per exercised definition case. Several observations may support
      // one resource outcome; each retains the environment of that execution.
      // Empty here because this example records that the smoke was not run.
      "observations": [
        // {
        //   "observationId": "<stable id within this evidence artifact>",
        //   "resource": "<source-qualified identity>",
        //   "definitionCase": {
        //     "caseId": "<stable case id in the retained evidence definition>",
        //     "assertionIds": ["<every retained assertion this outcome evaluates>"],
        //     "definitionDigest": "<same complete evidence-definition digest record bound above>"
        //   },
        //   "outcome": "<supported preservation claim, degradation, or inconclusive observation>",
        //   "effectiveEnvironment": {
        //     "modelInvocations": [
        //       {
        //         "invocationId": "<stable id within this observation>",
        //         "parentInvocationId": null,
        //         "resourceOrRole": "<source-qualified resource or typed role>",
        //         "selector": "<host-selected alias, if one was used>",
        //         "providerAuthority": "<immutable provider authority>",
        //         "identity": "<immutable model version or deployment identity>"
        //       },
        //       {
        //         "invocationId": "<delegated invocation id>",
        //         "parentInvocationId": "<parent invocation id>",
        //         "resourceOrRole": "wycats-plugin:agents/slop-linter",
        //         "selector": "sonnet",
        //         "providerAuthority": "<immutable provider authority>",
        //         "identity": "<immutable model version or deployment identity>"
        //       }
        //     ],
        //     "modelInteractionTrace": {
        //       "path": "environments/<observation id>.model-interactions.jsonl",
        //       "formatVersion": "<ordered-model-interaction-trace-format version>",
        //       "digestAlgorithm": "<canonical-model-interaction-trace-digest version>",
        //       "digest": "sha256:…",
        //       "contents": "every invocation id, parent id, ordered prompts and context, response, error, and linked tool invocation id"
        //     },
        //     "tools": [
        //       {
        //         "displayName": "Bash",
        //         "providerAuthority": "<immutable tool provider authority>",
        //         "identity": "<immutable implementation or deployment identity>",
        //         "schema": {
        //           "path": "environments/<observation id>.tools/bash.schema.json",
        //           "formatVersion": "<retained-tool-schema-record-format version>",
        //           "dialect": {
        //             "id": "<schema grammar or provider dialect>",
        //             "version": "<independently validated dialect version>"
        //           },
        //           "digestAlgorithm": "<canonical-tool-schema-digest version>",
        //           "digest": "sha256:…"
        //         },
        //         "implementation": {
        //           "kind": "retained-content-addressed-tool",
        //           "path": "environments/<observation id>.tools/bash.tar.zst",
        //           "digestAlgorithm": "<canonical-tool-implementation-digest version>",
        //           "digest": "sha256:…",
        //           "redistributionRef": "/artifact/redistribution/records/<authority-qualified tool identity>"
        //         }
        //       }
        //     ],
        //     "toolInvocationTrace": {
        //       "path": "environments/<observation id>.tool-invocations.jsonl",
        //       "formatVersion": "<ordered-tool-invocation-trace-format version>",
        //       "digestAlgorithm": "<canonical-tool-invocation-trace-digest version>",
        //       "digest": "sha256:…",
        //       "contents": "every invocation id, parent id, tool identity, ordered input, output, and error received by the model"
        //     },
        //     "traceRetention": {
        //       "mode": "hermetic-secret-free",
        //       "credentialScan": {
        //         "kind": "retained-reproducible-credential-scan",
        //         "path": "environments/<observation id>.credential-scan.result.json",
        //         "formatVersion": "<credential-scan-result-format version>",
        //         "digestAlgorithm": "<canonical-credential-scan-result-digest version>",
        //         "digest": "sha256:…",
        //         "outcome": "passed",
        //         "policyBinding": {
        //           "selectionMember": "/evidenceAuthority/credentialScanPolicy",
        //           "scanner": "<same complete scanner digest record pinned by the selection>",
        //           "rules": "<same complete rules digest record pinned by the selection>",
        //           "executionEnvironment": "<same complete runtime digest record pinned by the selection>",
        //           "result": "equal"
        //         },
        //         "scanner": {
        //           "path": "evidence/credential-scanner.tar.zst",
        //           "digestAlgorithm": "<canonical-credential-scanner-digest version>",
        //           "digest": "sha256:…",
        //           "redistributionRef": "/artifact/redistribution/records/<authority-qualified scanner identity>"
        //         },
        //         "rules": {
        //           "path": "evidence/credential-scan-rules.json",
        //           "formatVersion": "<credential-scan-rules-format version>",
        //           "digestAlgorithm": "<canonical-credential-scan-rules-digest version>",
        //           "digest": "sha256:…",
        //           "redistributionRef": "/artifact/redistribution/records/consumer-evidence"
        //         },
        //         "executionEnvironment": {
        //           "path": "evidence/credential-scanner-runtime.tar.zst",
        //           "digestAlgorithm": "<canonical-credential-scanner-runtime-digest version>",
        //           "digest": "sha256:…",
        //           "redistributionRef": "/artifact/redistribution/records/<authority-qualified scanner-runtime identity>"
        //         }
        //       }
        //       // When a secret-free observation cannot establish the claim,
        //       // mode is "encrypted-access-controlled" instead. The record then
        //       // binds the ciphertext digest and immutable locator, versioned
        //       // encryption-policy and access-policy digest records equal to
        //       // /artifact/privateEvidencePolicyBinding, and a separately
        //       // publishable commitment to the retained trace.
        //     },
        //     "settings": {
        //       "retention": {
        //         "mode": "hermetic-secret-free",
        //         "record": {
        //           "kind": "retained-canonical-settings-record",
        //           "path": "environments/<observation id>.settings.json",
        //           "formatVersion": "<effective-settings-record-format version>",
        //           "digestAlgorithm": "<canonical-effective-settings-digest version>",
        //           "digest": "sha256:…"
        //         },
        //         "credentialScan": {
        //           "kind": "retained-reproducible-credential-scan",
        //           "path": "environments/<observation id>.settings-credential-scan.result.json",
        //           "formatVersion": "<credential-scan-result-format version>",
        //           "digestAlgorithm": "<canonical-credential-scan-result-digest version>",
        //           "digest": "sha256:…",
        //           "outcome": "passed",
        //           "policyBinding": "<same exact selection policy binding as traceRetention>",
        //           "scanner": "<same retained scanner record bound by traceRetention>",
        //           "rules": "<same retained rules record bound by traceRetention>",
        //           "executionEnvironment": "<same retained scanner runtime bound by traceRetention>"
        //         }
        //         // When settings or another environment record requires private
        //         // data, mode is "encrypted-access-controlled" instead. `record`
        //         // then binds the ciphertext digest and immutable locator, the
        //         // complete versioned encryption-policy and access-policy digest
        //         // records equal to /artifact/privateEvidencePolicyBinding, and
        //         // a separately publishable content commitment.
        //       }
        //     }
        //   }
        // }
      ],
      "caseCoverage": {
        "definitionDigest": "<same complete evidence-definition digest record bound above>",
        "entries": [
          {
            "resource": "<source-qualified identity>",
            "caseId": "<one required case from the retained definition>",
            "assertionIds": ["<every required assertion in that case>"],
            "status": "unrun",
            "observationId": null
          }
          // … exactly one entry for every required case of every resolved resource;
          // all are unrun in this example.
        ]
      }
    },
    // Empty because no resource has complete required-case coverage. A populated
    // entry has this shape, binding the result to the retained reviewed
    // aggregation implementation rather than only naming an outcome.
    "resourceOutcomes": [
      // {
      //   "resource": "<source-qualified identity>",
      //   "observationIds": ["<every supporting observation id>"],
      //   "caseCoverageDigest": "<complete versioned coverage digest record>",
      //   "aggregation": {
      //     "artifactPointer": "/artifact/evidence/aggregation",
      //     "validatorDigest": "<same complete retained validator digest record>",
      //     "rulesDigest": "<same complete retained rules digest record>",
      //     "result": "passed"
      //   },
      //   "outcome": "<resource-level preservation outcome>"
      // }
    ],
    "unverified": [
      {
        "resources": [
          "wycats-plugin:agents/slop-linter",
          "wycats-plugin:agents/recon",
          "wycats-plugin:agents/recon-worker"
        ],
        "reason": "abstract model roles bound to concrete models by this build's configuration; whether the resources behave as authored under those bindings was not exercised"
      },
      {
        "resources": [
          "consumer:skills/housekeeping",
          "wycats-plugin:skills/recon",
          "wycats-plugin:skills/gh-write-pr-description",
          "wycats-plugin:skills/dangling-thread-review",
          "wycats-plugin:hooks/native-ts-enforcement"
        ],
        "reason": "projected into this host's discovery surfaces; no qualifying smoke run exercised it"
      },
      {
        "resources": ["wycats-plugin:instructions/environment"],
        "reason": "this host could not represent the instruction; no behavioral preservation claim was made"
      },
      {
        "resources": [
          "wycats-plugin:stances/interpretive-synthesis",
          "wycats-plugin:stances/gap-reading",
          "wycats-plugin:stances/diagnostic-questioning",
          "wycats-plugin:stances/collaborative-grounding",
          "wycats-plugin:stances/relational-continuity",
          "wycats-plugin:stances/authorial-continuity",
          "wycats-plugin:stances/public-design-reasoning",
          "wycats-plugin:stances/observational-grounding"
        ],
        "reason": "materialized as skills because this host does not discover stances; whether that placement preserves their activation and behavior was not exercised"
      }
    ]
  },
  "artifactDigest": {
    "digestAlgorithm": "<canonical-preservation-evidence-digest version>",
    "digest": "sha256:…"
  },
  "attestation": {
    // The signature covers the artifact and the authorization context. `check`
    // also requires signer and the complete trust-policy digest record to match
    // the reviewed selection's evidenceAuthority; the bundle cannot authorize a
    // replacement signer or choose a different digest contract.
    "statement": {
      "formatVersion": "<preservation-attestation-statement-format version>",
      "artifactDigest": {
        "digestAlgorithm": "<same canonical-preservation-evidence-digest version as the outer record>",
        "digest": "sha256:…"
      },
      "signer": "<same immutable signer identity pinned by the selection>",
      "trustPolicy": {
        "digestAlgorithm": "<same canonical-trust-policy-digest version pinned by the selection>",
        "digest": "<same trust-policy digest pinned by the selection>"
      }
    },
    "signature": "<detached signature over the canonical statement>",
    "signer": "<immutable authorized CI signer identity>",
    "trustPolicy": {
      "id": "<versioned evidence-attestation trust policy>",
      "path": "policies/evidence-attestation.json",
      "digestAlgorithm": "<canonical-trust-policy-digest version>",
      "digest": "sha256:…"
    },
    "retainedRecord": {
      "path": "attestations/preservation-evidence.dsse.json",
      "digestAlgorithm": "<canonical-attestation-record-digest version>",
      "digest": "sha256:…"
    }
  }
}
```

The VS Code and Codex evidence artifacts use the same exhaustive partition. With
the smoke still marked `not-run`, VS Code records both resources as represented
but unverified; Claude Code records the hook as represented but unverified and
the instruction as unrepresentable; Codex records both as unrepresentable. The
structural outcome comes from the target report, while the evidence artifact
states that preservation has not been established.
