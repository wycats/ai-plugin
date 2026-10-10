---
name: implementation-quality
description: "Improve how existing code, types, names, file organization, and local documentation express the system's concepts. Use for implementation quality passes or holistic review of confusing details, from a single operation to a systematic codebase pass."
---

# Implementation Quality

Follow a real use of the code, identify what the reader has to reconstruct,
and make the implementation express that relationship directly. Establish a
coherent improvement on a representative path, carry it through the selected
scope, then check the assembled result.

For review-only requests, investigate and propose the coherent change without
editing. Include source locations and validation needs in the resulting plan.

Load [reader-orientation](../../stances/reader-orientation/SKILL.md "composition:load")
for the central judgment: what can someone understand where they encounter the
work, and what becomes available when they investigate further?

An improvement may add documentation, remove an abstraction, strengthen a type,
or leave complicated internals alone. A clear contract can contain imperfect
internals when the relationship between the two remains understandable.

## Follow a real use

Start with the user's concern and repository guidance. Follow someone authoring
a definition, calling an operation, tracing a lifecycle, or learning how the
components fit together. Inspect the relevant callers, types, implementation,
tests, and documentation to establish the promises being made and the behavior
that fulfills them. Use
[recon](../recon/SKILL.md "composition:reference") when that understanding needs
substantial investigation.

For a broad pass, group related files and track which have been examined.
Combine systematic coverage with complete paths: details need attention, and
relationships often cross file boundaries. Scale this work to the selected scope.

Read annotations as observations and design constraints whose combined thrust
needs interpretation. When the user wants discussion, bring back a concrete
reading and the consequential choices before editing. Use
[joint reading](../../stances/joint-reading/SKILL.md "composition:reference")
to examine the material together and
[collaborative grounding](../../stances/collaborative-grounding/SKILL.md "composition:reference")
where the right direction depends on the user's intent.

## Express the relationship the reader has to reconstruct

At a concrete point in that path, establish what the reader can already
understand and where that understanding breaks down. Preserve boundaries that
already support the task; a useful pass can conclude that no change is warranted.
Where there is a gap, ask:

> What relationship must the reader reconstruct that the implementation could
> express directly?

Determine whether that relationship is already represented elsewhere, exists
only as a convention people maintain, or becomes obscured by the detail around
it. This determines what needs to change. Use
[interpretive synthesis](../../stances/interpretive-synthesis/SKILL.md "composition:reference")
as each detail revises the larger model and that model changes what nearby
details mean.

### Let the caller rely on a meaningful operation

A function should read from top to bottom at approximately one mental level of
abstraction. Shape checks and decoding can obscure an identity comparison; a
parser with a precise contract can let the caller express that comparison
directly. Its validation, failure behavior, and limits remain available inside
the parser.

An extraction helps when the caller can reason from its name and contract.
Opening every helper to understand the caller means the split has not supplied
that understanding. A cryptic but trivial callback may expose an unnecessary
authoring step or a missing shared guarantee.

### Make the representation carry the guarantee

Repeated operation identities, schemas paired with handwritten types, and flags
whose valid combinations live in people's heads make authors maintain the model
manually. Give the relationship an owner: one definition can drive construction
and lookup; a discriminated union can express the actual states. Preserve
meaningful variation while removing repeated ceremony.

Check the real use site. Moving a generic signature into a helper improves the
contract only if authors can use it without reconstructing those relationships.
Verify that concrete types survive inference and specialization.

Inspect existing shared and upstream facilities before refining local machinery.
An upstream owner may already supply the information a local state table tracks.
Verify the installed dependency's guarantees and the integration's obligations
before relying on it. Eliminating duplicated ownership removes work that merely
organizing the table would retain.

### Put the explanation where it becomes useful

Names, file organization, and documentation orient the reader before they inspect
mechanics. A small file can hold a complete concept; a forwarding remnant can
suggest ownership that has moved. Place code and tests with their conceptual
owners, using repository conventions to make that organization recognizable.

Read a comment at its consumption site: a hover, signature, caller, or docs page.
Use established vocabulary and explain why nearby concepts differ where that
distinction matters. A true statement may explain nothing from that file's
perspective. An obvious implementation can still need hover documentation
because the caller encounters the explanation without the implementation.

Connect executable examples to source and type checking where supported. Retain
useful reasoning and references from intermediate plans as documentation that
stands without the originating chat. Editorial reminders belong on the authoring
surface where they guide the work.

For substantial public prose, compose
[public design reasoning](../../stances/public-design-reasoning/SKILL.md "composition:reference").
When writing in the user's voice, compose
[authorial continuity](../../stances/authorial-continuity/SKILL.md "composition:reference")
and establish a representative passage before carrying its approach across a
larger body of text.

## Carry a coherent change through its dependents

Show the proposed improvement on the representative path: the caller can follow
the operation, the author declares a relationship once, or the reader can explain
why two types differ. Let that concrete result guide the remaining changes.

Choose scope around the relationship. A local reading problem can require an
API redesign. When historical mechanisms obscure the learned model, compose
[architectural distillation](../architectural-distillation/SKILL.md "composition:reference")
to recover the meaningful constraints and simplify their expression. Follow the
relationship across file and layer boundaries when that makes the change coherent.

Preserve meaningful behavior and contracts. Changes to validation order, errors,
compatibility, or product semantics are design decisions to resolve within the
user's authorized scope before treating the remaining work as mechanical.

Once the approach is clear, implement it across the chosen scope. For authorized
delegation, give each worker related files and callers, the chosen conceptual
model, guarantees to preserve, a representative result, and relevant validation.
Choose a worker's LLM for the remaining uncertainty; clearer specification can
make a less expensive model sufficient. The coordinator reviews discoveries,
adjusts the work, and owns the assembled result.

For a systematic pass, record each group's disposition: changed, already
coherent, or deferred with a reason. Keep temporary coverage notes in the
repository's local working area; publish the explanations future work needs.

## Review the assembled result

Switch from producing the change to testing its claims. Follow the same path
through callers, types, implementation, and documentation. Use
[hypothesis evaluating](../../stances/hypothesis-evaluating/SKILL.md "composition:reference")
to compare the promised improvement with what the result actually supports.

Use relevant checks to verify behavior, concrete authoring examples to verify
inference, and rendered documentation to verify claims about its presentation.
Inspect the reading experience directly: can the operation be followed without
simulating its machinery, and does opening the machinery explain the contract?

```text
repeat:
  Read the assembled path and check the improvement's claims.
  If understanding breaks down, revise the approach and update its dependents.
  If behavior checks fail, resolve the failure before declaring completion.
  Otherwise, finish the selected scope and name any justified follow-up.
```

Finish when the selected scope is coherent, meaningful behavior is verified, and
remaining complexity has an understandable home. The user's personal review
should begin from a complete baseline. Further polish needs a concrete benefit
to understanding or use.

Report the important changes, evidence, and consequential uncertainties or
deferred work.
