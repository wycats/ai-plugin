# README reader pilot

These are frozen artifacts from the 22 October 2026 README reading that informed
Editorial Reader. The request gave the reader the audience and source material
before the coordinating writer's prior editorial rationale. The reader retained
useful passages, investigated the repository's resources, asked which purpose
the opening should prioritize, and proposed an opening after the writer replied.
`accepted-opening.md` preserves the coordinator's reconciled opening. It does
not establish an independent test of actual readers or the author's preference.

The exchange records a fresh Codex subagent using GPT-6.1 Sol with high reasoning.
This invocation did not exercise the role's abstract `auxiliary` mapping or the
Claude Code CLI evaluation transport. It was one development pilot, not a
comparative ranking or evidence of consistency across runs.

[archive.json](archive.json) maps every frozen file to its repository-relative
source path and SHA-256 digest. `inputs.json` is the pilot's original record of
input hashes. The README, role, Reader Orientation, and Authorial Continuity
snapshots match those hashes. The manifest describes the preserved files; it is
not a claim that all source material read during the pilot was snapshotted.

Frozen Markdown links retain their original bytes. Resolve links in `reading.md`
and `request.md` from the original `.runtime/editorial-rethink/reader-pilot/`
source directory. Links in `readme-before.md`, `proposed-opening.md`, and
`accepted-opening.md` were written for the repository root. Composition links in
`role.agent.md` were written for `.runtime/editorial-rethink/`; stance links were
written for their original `skills/stances/<name>/` directories. Consult the
manifest when tracing these links. The files in this directory are evidence,
not active resources or source templates for a new run.
