# Persistent guidance

[Building together](../instructions/building-together.instructions.md) gives the
plugin's skills and stances a shared account of how work develops. Its complete
text, diagram, and further reading have one canonical home under `instructions/`.
The linked resources remain available for consultation as particular questions
arise. Making the story persistent does not activate every resource it references.

## Authoring and projection

An instruction declares `metadata.wycats.context: persistent` to request delivery
without relevance-based selection. It must not also declare `applyTo`: file
matching and persistent context are different activation mechanisms. Existing
file-scoped instructions retain their VS Code projection.

Links to canonical resources use `composition:reference`, so validation and
projection follow the same resource graph as skills and agents. The build keeps
the instruction file at `instructions/<name>.instructions.md` and generates a
context payload from its body. It preserves all prose, including the bibliography.
The payload separates link destinations from text. At execution, the loader
resolves those destinations against the installed package's location and emits
absolute Markdown links. Installation paths with spaces remain usable.

The build collects every selected persistent instruction into one payload, in
resource order. A shared renderer resolves its links and returns the complete
prose. Adding or renaming an instruction requires no document-specific adapter
change. Building together is currently the collection's only member.

The projection plan selects those resources and their delivery mechanism.
Persistent packaging produces the payload and runtime files. Hook projection
assembles authored hooks and generated context delivery into a single manifest.
These are independent choices: Codex includes the context hook without authored
policy hooks; Claude includes authored hooks while delivering persistent prose
through its project import. A package with no selected persistent instructions
has no persistent-delivery runtime or registration.

Delivery adapters consume that prose. Codex and VS Code register a
`persistent-context-hook.mjs` wrapper on `SessionStart`, alongside existing host
hooks. The wrapper owns the hook envelope and output budget. Claude's
`claude-guidance.mjs` installer calls the renderer directly and exports the
prose to a named project. Each target owns its delivery mechanism, lifecycle,
and instruction priority; the source declares persistent availability.

The build bundles these runtime entry points and their dependencies with esbuild.
Installed packages need Node.js but do not require a separate dependency install.
The Claude installer validates its saved installation record with a Zod schema
before checking that the managed files still match it.

## Delivery by target

| Target | Package entry | Delivery and limits |
| --- | --- | --- |
| Codex | `hooks/hooks.json`, discovered by the compatibility plugin manifest | `SessionStart` adds developer context on startup, clear, and after root-session compaction. Resume retains the earlier context. The matcher excludes resume and fork to avoid appending another copy. Plugin hooks require host trust review. |
| Claude Code | `/wycats:setup-guidance` or `scripts/claude-guidance.mjs install --project <directory>` | Explicit setup adds a project `CLAUDE.md` import of the complete generated story. Native instruction context survives resume and compaction and coexists with output styles. It is user-message context, not system-role text. Refresh the export after plugin updates; remove it separately when uninstalling. No persistent-context hook is registered. |
| VS Code Local harness | `com.github.copilot/hooks/hooks.json` | `SessionStart` adds conversation context on the first prompt. Restoration after compaction is not established. The persistent document is excluded from native rule discovery to avoid a second activation path. |
| Pi Recon profile | Omitted | The current profile supports a bounded Recon workflow. Its capability report records the omission. Adding the full story needs a deliberate profile expansion and verification of its linked workflows. |

These mappings follow the [Codex plugin contract](https://developers.openai.com/plugins/build/plugins#bundled-mcp-servers-and-lifecycle-hooks),
[Codex hook reference](https://learn.chatgpt.com/docs/hooks#sessionstart),
[Claude instruction reference](https://code.claude.com/docs/en/memory),
and [VS Code Local hook reference](https://code.visualstudio.com/docs/agents/reference/hooks-reference#sessionstart).
Provider-hosted sessions inside VS Code have their own contracts. A file being
present in a package does not establish that a particular host delivered it.

Codex's default hook-output threshold can spill a long document to a file. This
hook sets `additionalContextLimit: 16000` and rejects an expanded payload over
48 KB with an error. The full prose is intended to reach the model. A runtime
error, disabled hook, or pending trust review means that delivery has failed.

Revisit these mappings when a host gains a native plugin instruction surface,
changes its lifecycle behavior, or changes its output limits. Native delivery
would let us remove corresponding loading machinery while preserving the source.

## Verification

Package tests run the generated loaders after relocating the package and compare
their output with the complete canonical body, allowing only link destination
rewrites. They check that destinations exist, existing hooks survive, and Codex
does not accidentally acquire the other targets' policy hooks.

Native qualification must separately observe the story in a fresh host's model
context and after supported continuation/compaction events. Do not infer this
from a reader recognizing the title or from the presence of a hook manifest.
No cross-host subagent inheritance guarantee is made by this mapping.

Codex retains the injected message when a chat resumes or forks. Installing or
updating the plugin in an existing chat takes effect on a fresh start, clear,
or compaction. A resumed chat continues with the guidance it already received.

Native checks on October 17, 2026 verified complete delivery in Codex 0.160.1
at startup and after manual compaction, with one retained copy after resume
and fork. VS Code 1.141.1 Local included the complete story in its exported
model request. Claude Code 2.1.236 included the complete imported story once in
startup, resume, and post-manual-compaction requests. Refreshing the export from
a relocated installation updated all links in the next resumed request.
These observations establish delivery, not an improvement in the agent's work.

October 18 checks repeated Codex startup and compaction against the shared
renderer and verified one complete copy in the active context. Claude's generated
`/wycats:setup-guidance` command installed the project import, which remained
complete after resume and compaction. Its removal command restored the original
project instructions, and the next resumed request omitted the story. The
selected output style remained active throughout.

## Claude installation contract

The generated command requires an explicit project. It appends one marked import
to `CLAUDE.md` and writes `.claude/wycats/persistent-instructions.md` plus an ownership
record. Updates preserve the import and surrounding user prose while refreshing
the complete export and installed link destinations. Removal preserves unrelated
content and removes a newly created `CLAUDE.md` only if it has no other content.
Edited or unowned managed content requires explicit `repair`, which saves the
current files under `.claude/wycats/recovery/` before refreshing the export and
an unambiguous marked import. Incomplete, duplicate, or out-of-order markers
require manual reconciliation. Recovery copies remain after removal.

The installer exclusively creates `.claude/wycats/operation.lock` before
recovering an interrupted operation or reading the files for the requested
change. It retains ownership through planning, any repair backup, and the
requested write. A competing installer reports the owner and lock path. Normal
completion or an ordinary error releases the lock.

Before changing managed files, the installer records their old and intended
contents in `.claude/wycats/pending.json`. A later invocation can finish an
interrupted operation if every file still matches either version. It stops if
an intervening edit matches neither version, preserving the files and journal
for reconciliation.

Abrupt termination can leave the lock behind. The installer reports whether its
recorded process may still be running, has exited, or cannot be identified. It
keeps the lock even when the recorded process has exited: checking a PID does
not safely transfer ownership between competing recovery attempts. Verify that
no guidance installer is running for this project, then remove only the reported
`operation.lock` file and rerun the command. Keep `pending.json`; it contains the
bytes needed to resume the interrupted write. An incomplete lock record needs
the same manual verification before removal.

A pending operation blocks `--dry-run`; the command reports that finishing it
requires a write. Dry-run also refuses an existing lock, performs validation,
and reports destinations without creating directories, a lock, or a journal.
It is a preview rather than ownership of a later write. The installer does not
follow symlinks at its managed paths. See [setup](setup.md#claude-code-persistent-guidance)
for commands, local-state handling, and instruction-discovery considerations.

This explicit installation is necessary because a plugin-root `CLAUDE.md` is
[not automatically loaded](https://code.claude.com/docs/en/plugins-reference#plugin-directory-structure).
Claude's hook output cap truncates the full story, while independent section
hooks cannot guarantee document order. A native output style can deliver it in
the system prompt, but occupies the user's style selection. A project import
preserves that choice at the cost of a separate setup, update, and removal step.
The generated export remains active if the plugin is disabled until explicitly
removed, and its installed links require the selected package to remain present.

The Claude projection also generates the explicit-only `setup-guidance` skill.
It is delivery support, so it is omitted from other targets and from packages
without persistent instructions. Claude reserves that skill name while persistent
delivery is enabled. Its body delegates project changes to the packaged installer;
it does not duplicate the installation algorithm or the persistent prose.
