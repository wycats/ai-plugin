# Archived PER Arc — Plugin pipeline hardening

> Historical dashboard snapshot, last updated 2026-05-24. It is not the
> project's current orientation or a source of project selection. Current work
> can follow Thread Coordinator to
> [recover its scope and current state](skills/workflows/thread-coordinator/SKILL.md#establish-the-scope-and-recover-current-state).
> This file remains as evidence of the earlier pipeline-hardening arc.

## Arc

At the time of this snapshot, the arc was hardening the plugin pipeline by making source truths explicit and reducing drift between build, validation, publish, and resource discovery. Recent work had stabilized the namespace (`wycats:*`), local install targeting, hidden stance resources, and the PER arc concept itself. The contemplated next phase was to make the machinery that ships those concepts less duplicative and less dependent on implicit state.

The arc framed the project as moving from "local toolkit that works" toward "self-consistent plugin system whose build, validation, publish, and documentation paths reinforce each other."

## Current phase / position

Four hardening cycles had landed: publish/build source-truth cleanup, validation/resource-discovery hardening, setup registration outcome UX, and YAML/frontmatter serialization hardening. The snapshot recorded a decision point: pause and let the pipeline changes settle under real use, or return the evidence to project-level selection.

## Hypothesis / current move

The YAML/frontmatter cycle tested whether the manual serialization in `scripts/build.ts` could be made safer without widening into a full build rewrite or adding unnecessary ceremony.

Resulting calibration:

- The risky surface is localized to frontmatter serialization for generated agent files.
- The sharp edge is string quoting/escaping, especially arrays and model/tool values that contain quotes, backslashes, colons, commas, or brackets.
- A small targeted formatter made generated frontmatter safer while preserving the current output shape.
- Parser-backed plain-scalar round-trip checking was useful for YAML's less obvious ambiguous scalars, including dates and alternate numeric forms.
- This stayed separate from broader generated-artifact, publish, or config-schema work.

Calibration at the snapshot:

- The pipeline hardening arc has handled the obvious sharp edges that were producing drift or misleading success states.
- Remaining work is more architectural than corrective.
- The next decision should be situated: continue because there is active momentum on packaging/source-truth cleanup, or pause because the current improvements are coherent enough to observe in real use.

## Evidence

Original read-only review found these hardening opportunities:

- Local publish scripts derive metadata from built manifests, while CI workflows hardcode metadata and shell-copy artifacts.
- `scripts/publish-vscode.ts` and `scripts/publish-cc.ts` temporarily overwrite `config.json` and restore it afterward.
- `scripts/build.ts` hard-required `config.json`, which made automation mutate local state.
- Publish workflows installed and built but did not run `pnpm validate` or `pnpm check` before publishing.
- `scripts/target-output.ts` centralized target output mapping, but `publish-cc` still had hardcoded Claude output paths.
- Stances had become hidden skill resources, making hiddenness a validation boundary.
- Resource discovery tolerated missing sections by swallowing broad filesystem errors.

Completed hardening cycles found:

- `scripts/build.ts` now accepts `--config <path>`, `--config=<path>`, and `VSCODE_AI_PLUGIN_CONFIG_PATH`, while preserving default `config.json` behavior.
- `scripts/publish-vscode.ts` and `scripts/publish-cc.ts` now build from example configs without rewriting local `config.json`.
- `scripts/publish-cc.ts` now uses shared target-output helpers for Claude Code output paths.
- Both publish workflows now run `pnpm validate` and `pnpm check` before building/publishing.
- Both publish workflows now derive marketplace name/version/description from built manifests rather than hardcoding stale metadata.
- `scripts/build.ts` accepts both direct package-script arguments (`pnpm build --config ...`) and the common npm/pnpm separator form (`pnpm build -- --config ...`).
- `scripts/validate.ts` now enforces hidden stance resources with `user-invocable: false`.
- `scripts/resource-discovery.ts` now tolerates only missing top-level optional resource directories and surfaces other filesystem errors.
- `scripts/setup.ts` now reports VS Code registration outcomes accurately instead of always ending with reload guidance.
- `scripts/build.ts` now quotes/escapes generated YAML frontmatter strings through a shared formatter for scalar strings and array items.
- `docs/per-arc.md` now records the arc maintenance lesson: the dashboard is a rolling calibration artifact, not an accumulating narrative.

Snapshot slice state:

- Active slice: none; PR #31 has landed.
- Recorded decision: pause the hardening arc or return its evidence to project-level selection.
- Generated build output may exist under ignored `out/` from validation runs; published artifacts under `dist/wycats/` are not part of this slice.

## Divergences

The major divergence from earlier assumptions is that session lifecycle artifacts are no longer the only continuity mechanism worth improving. GPT 5.5 and better repo/tool perception reduce the need for full session reconstruction, but not the need for project-level continuity. The PER arc should preserve calibrated motion across cycles while session lifecycle skills remain responsible for time-bound handoff.

Another divergence: stances have moved from plain copied markdown into hidden skill resources. That increases composability, but it also makes visibility/hiddenness a validation concern rather than just a documentation convention.

## Live tensions

- **Shared source truth vs. operational convenience:** publish scripts and workflows are easier to write separately, but separate logic creates invisible drift.
- **Explicit config vs. local ergonomics:** requiring `config.json` is simple for local iteration, but publish/build automation needs explicit config inputs that do not mutate local state.
- **Validation as protection vs. validation as drag:** publish workflows should fail before shipping bad artifacts, but the added gates should not make routine publishing ceremonial.
- **Hidden resources vs. accidental user surface:** stances are useful to agents as hidden resources, but a missing `user-invocable: false` could leak cognitive scaffolding into user-facing skills.
- **Arc dashboard vs. backlog:** this file should preserve calibrated project motion, not become an inventory of every possible cleanup.

## Historical next move

At the time of the snapshot, the next decision was whether to continue the hardening arc or pause it. The candidate bounded moves were:

1. Resolve whether TypeScript output and published plugin artifacts should both live under top-level `dist/`.
2. Extract safer non-publishing package-artifact helpers from the inline workflow logic.
3. Pause the hardening arc and let the current improvements settle under real use.

## Kept-warm arcs at the time of the snapshot

- **Generated-output layout:** consider whether TypeScript `dist` output and published plugin `dist/wycats` should remain under the same top-level directory. Return signal: repeated confusion or release defects caused by the shared location.
- **Package-artifact helpers:** consider extracting shared helpers so workflows and local publish scripts can share more logic without sharing credential or branch semantics. Return signal: the next concrete drift between local and workflow packaging.

## Cycle log

### 2026-05-23 — Arc setup

Prepare context:

- The repo now has a design note at `docs/per-arc.md` describing this artifact shape.
- A read-only review identified build/publish/resource validation hardening as the next coherent arc.

Execution result:

- Created this `PER-ARC.md` as the project instrument panel for the hardening arc.

Review calibration:

- Confirmed. The next PER verified that publish/build source-of-truth cleanup was the right first bounded cycle.

### 2026-05-23 — Publish/build source-truth cleanup

Prepare hypothesis:

- Add explicit config selection to `scripts/build.ts`.
- Remove local `config.json` mutation from publish scripts.
- Use shared target-output helpers consistently in publish code.
- Add `pnpm validate` / `pnpm check` gates to publish workflows.
- Reduce hardcoded workflow metadata where practical without redesigning credentials or branch semantics.

Execution result:

- Implemented explicit build config selection through CLI/env.
- Updated local publish scripts to build from example configs.
- Updated workflows with validation gates and manifest-derived marketplace metadata.
- Kept workflows' inline publish logic to avoid expanding into credential and branch-semantics redesign.

Review calibration:

- Initial review found a concrete workflow invocation bug: `pnpm build -- --config ...` forwards a literal `--` and fails.
- Targeted fix changed workflow commands to `pnpm build --config ...`.
- Copilot review correctly generalized that `scripts/build.ts` should also tolerate the common separator form.
- Targeted fix made standalone `--` a no-op in build argument parsing and documented both invocation styles in usage text.

### 2026-05-23 — Validation/resource discovery hardening

Prepare hypothesis:

- Stance hiddenness belongs in `scripts/validate.ts`, specifically under stance validation.
- Resource discovery should tolerate missing optional top-level resource directories but surface other filesystem errors.
- Build output behavior should remain unchanged when discovery succeeds.

Execution result:

- `scripts/validate.ts` now enforces `user-invocable: false` for every `stances/*/SKILL.md`.
- `scripts/resource-discovery.ts` now lets traversal errors surface and only treats top-level `ENOENT` as an empty optional section.
- Copilot review improved validation by reusing already-parsed stance frontmatter instead of re-reading stance files.

Review calibration:

- The two-file implementation stayed within scope and merged in PR #29.
- Source validation still reports 8 skills, 8 stances, 7 agents, 1 instruction, and 3 hook manifests.
- Claude Code still emits one consolidated hooks file; that is expected build-reporting semantics, not a discovery regression.

### 2026-05-24 — Setup registration outcome UX

Prepare hypothesis:

- The setup wizard's final message should reflect whether VS Code registration succeeded, was skipped, was cancelled, or failed.
- Registration failure should remain recoverable rather than aborting after config/build succeed.
- Captured installer output should be surfaced so the user can recover.

Execution result:

- `scripts/setup.ts` now tracks VS Code registration outcome explicitly.
- Final setup messaging distinguishes registered, skipped, registration-cancelled, custom-cancelled, and failed states.
- Copilot review refined recovery commands, cancellation language, and Stable/Insiders labels.

Review calibration:

- The UX slice merged in PR #30 without changing registration mechanics or exit-code policy.
- The arc needs current-position maintenance after merges; this prompted an update to `docs/per-arc.md` clarifying that the dashboard is a rolling calibration artifact, not an accumulating narrative.

### 2026-05-24 — YAML/frontmatter serialization hardening

Prepare hypothesis:

- The risky serialization surface is localized to generated agent frontmatter in `scripts/build.ts`.
- Array item quoting is the main sharp edge, but scalar strings should share the same safe formatter.
- The output shape should stay close to the current hand-written frontmatter rather than switching to `matter.stringify()`.

Execution result:

- Added shared YAML string formatting for scalar strings and array items.
- Preserved the current generated frontmatter shape and avoided broad build rewrites.
- Added a parser-backed plain-scalar round-trip guard so YAML-sensitive strings are quoted before generation.
- Updated `docs/per-arc.md` with the dashboard-current maintenance principle.

Review calibration:

- Initial review found missing YAML hazards such as leading `!`, `%`, dash-space prefixes, date-like strings, hex numerics, and underscore numerics.
- Targeted fix expanded the quoting predicate and added gray-matter round-trip detection for ambiguous plain scalars.
- Validation passed for normal VS Code and Claude Code builds plus an extended fixture covering quotes, backslashes, punctuation, booleans, numbers, tags, directives, dates, hex, and underscore numerics.
- The slice merged in PR #31 with no tracked `dist/wycats` churn.
