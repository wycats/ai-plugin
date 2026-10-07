# Behavioral evaluations

The cases in this directory describe what a canonical resource should do. They
do not describe how a particular host invokes it. Runtime adapters project the
same request into each host and report the target, transport, model mapping,
selected launcher model role and target model, source revision, raw response,
and grade.

The Claude Code adapter resolves resource addresses from the build's
`projection-resources.json`. Reports include the captured map's path and digest
alongside the projected resource digest. Invocation evidence and the canonical
behavioral protocol remain independent of the generated file's location.

Every suite declares the behavioral protocol it exercises. Version one supports
`document-review/v1`: the resource evaluates a document and returns structured
findings plus the complete rewritten document. A resource with a different task
needs another explicit protocol and grader rather than inheriting this response
shape implicitly.

Finding actions are part of that protocol. Every action removes its exact quote
from the rewrite. Each `TODO` action also adds one new `TODO(MISSING)` marker to
the rewritten document.

Each positive case should have a nearby counterexample. A phrase can be a useful
clue without being a defect in every context. The paired case keeps the
evaluation attached to the judgment the resource is meant to make.

The slop-linter cases diagnose prose. They do not infer whether a person or a
model wrote it. Sources such as Wikipedia's [Signs of AI
writing](https://en.wikipedia.org/w/index.php?title=Wikipedia:Signs_of_AI_writing&oldid=1369699198)
can suggest cases, but each case needs to name the underlying prose failure and
include a counterexample where the same surface feature is doing real work.

A required finding names one unique exact passage in the document, and each
passage appears once in the required findings. Every returned quote
must also identify one occurrence. One finding can quote the complete passage,
or several disjoint exact quotes can cover it together. Repeated and overlapping
diagnoses fail. Add accepted labels when the classification itself is part of
the contract; leave them out when the case is only about whether the passage
receives a finding.
Use `maximumFindings` when finding count is itself meaningful, including when
the suite leaves the particular findings open. A zero limit requires an empty
set of required findings. `rewriteExcludes` verifies that
a diagnosed defect was removed; its case- and whitespace-normalized form must
identify one input span. `rewritePreserves` keeps an exact span unchanged inside
a larger rewrite; the span must identify one occurrence in the input.
`rewriteEquals` names the complete expected result when the
rewrite must remove a defect without changing or adding anything else, while
`rewriteEqualsInput` protects a clean document as a whole.

Suite and response JSON reject repeated object member names before schema
validation, so one value cannot silently replace another. Responses also reject
undeclared fields rather than hiding output-contract drift during grading.

## Running the suite

The deterministic tests exercise fixture validation, response parsing, and
grading without calling a model:

```sh
pnpm test:eval
```

Inspect each canonical request beside the target's projected prompt:

```sh
pnpm eval -- --adapter claude-code-cli --dry-run
```

Run the suite through an authenticated Claude Code CLI:

```sh
pnpm eval -- --adapter claude-code-cli
```

This adapter targets Claude Code through its standalone CLI transport. A Claude
Code session running only as a VS Code extension does not provide that
executable; it needs a different adapter, not different evaluation cases.

Live results are written under `.runtime/evals/`, which is ignored by git.
Custom output paths select a new file inside `.runtime/evals/`. Existing files
and paths redirected through symlinks are rejected, keeping source files and
previous results intact.
