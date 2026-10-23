# Editorial readings

The current evaluation contract is `editorial-reading/v1`, exercised by the
[Editorial Reader development suite](editorial-reader/cases.json). It supplies a
draft, its audience and purpose, the assignment's scope, and supporting context.
The reader returns what helps the writer continue. That can be a supported
revision, a consequential question, an investigation that changes the account,
or evidence for retaining effective prose.

The harness captures a **first encounter**. A nonempty response with a successful
resource invocation is recorded as **awaiting human review**. This establishes
that a reading was captured; it does not establish its editorial quality.
Questions are a useful continuation point. The standalone CLI call cannot supply
the writer's answer or assess the ensuing exchange.

The protocol imposes no findings table, labels, deletion requirement, complete
rewrite, or JSON response schema. Assessment questions accompany each case in
the report and stay out of the model's prompt. There is no numeric quality score
or automatic editorial pass/fail decision. Execution and empty-response failures
remain visible separately, with raw responses and transport output preserved.

## Reading the evidence

Read proposed prose before its explanation. Describe what the intended readers
would understand, which implications or authorial judgments changed, whether the
revision added unsupported material, and what consequential correction remains.
Check source fidelity against the supplied material; bring choices about the
writer's intent or relationship with readers back to the writer. Keep ties and
uncertainty visible. An intervention earns its place through what it contributes.

For a continuation, preserve the writer's exact feedback, the reader's response,
and the revised passage alongside the first reading. Examine whether the reader
carries the reason for a correction into other affected passages. The current
runner captures only the first encounter; it makes no claim about this later
exchange or the understanding of actual readers.

The small constructed cases are development probes, with inlined context for
bounded source-grounded reading. They are not a held-out test of transfer. The
[README pilot](editorial-reader/pilot/README.md) preserves a real reading and
exchange that informed the role. Neither artifact establishes a ranking against
other editorial methods.

## Running a capture

Deterministic tests check the suite contract, hidden assessment notes, capture
status, invocation handling, and the legacy parser without calling a model:

```sh
pnpm test:eval
```

Inspect canonical requests and target projections without invoking the target:

```sh
pnpm eval -- --adapter claude-code-cli --dry-run
```

Capture readings through an authenticated standalone Claude Code CLI:

```sh
pnpm eval -- --adapter claude-code-cli
```

The adapter selects the role directly with `--agent wycats:editorial-reader`.
The role remains marked `user-invocable: false` for discovery. This invocation
route has deterministic coverage, with live transport qualification still pending. Each editorial capture permits at most 12 CLI
turns, including source and stance reads, with a 120-second process timeout.
This bounded transport does not reproduce an open-ended editorial conversation.

Reports record the protocol, prompts, suite and role digests, source revision
and dirty status, runtime and model mappings, projection map and role digests,
turn allowance, invocation evidence, raw output, and pending assessment questions.
These receipts describe the observed run. They do not snapshot every piece of
ambient runtime context or prove that every linked stance was loaded.

Results go under `.runtime/evals/`, which is ignored by git. Custom output paths
select a new file there. Existing files and paths redirected through symlinks are
rejected, preserving sources and previous reports. The CLI's exit status reports
capture failures; editorial judgment remains pending after a successful capture.

## Historical document review

The [Slop Linter suite and role](slop-linter/README.md) preserve the retired
`document-review/v1` contract. Its deterministic parser and grader tests remain
useful historical coverage. Its required deletion actions and exact rewrites do
not apply to Editorial Reader.
