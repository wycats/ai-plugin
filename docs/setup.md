# Setup

This plugin provides a set of AI agents, skills, and workflow tools. It works with VS Code (via Copilot), Claude Code, and Codex — you configure it for your environment once, and a build step produces the files your platform needs.

## Quick start

```sh
git clone https://github.com/wycats/ai-plugin.git
cd ai-plugin
pnpm install
pnpm run setup
```

The setup wizard asks which platform and model provider you use, writes your `config.json`, builds the plugin, and (for VS Code) asks whether to register Stable, Insiders, a custom settings path, or skip registration. Reload the selected VS Code channel and you're done.

If you prefer to configure manually, copy `config.example.json` to `config.json`, edit it, and run `pnpm build` followed by an explicit local registration command such as `pnpm install-local -- --vscode-channel insiders` or `pnpm install-local -- --settings <path>`.

## How it works

[Building together](../instructions/building-together.instructions.md) is delivered
through a generated session-start hook in the Codex and VS Code Local packages.
Claude Code uses the [explicit project import](#claude-code-persistent-guidance)
below. Codex requires reviewing and trusting the hook before it runs;
use `/hooks` in the CLI to inspect its status. Installation alone does not grant
that trust. Start a fresh chat after installing or updating the plugin and
trusting its hook. Existing Codex chats retain their earlier guidance until cleared
or compacted.

See [persistent guidance](persistent-guidance.md) for context priority,
compaction behavior, and the Pi profile's current limitation.

Agent source files (in `agents/`) use abstract names for models and tools instead of hardcoded provider-specific values. For example, an agent says `model: fast` rather than naming a specific model.

Your `config.json` maps those abstract names to concrete values for your environment. The build reads the source files and your config, resolves the names, and writes ready-to-use files to the platform output directory: `out/wycats/` for VS Code, `out/claude-code/` for Claude Code, or `out/codex/` for Codex.

The target projection adapts these definitions to the discovery and execution
surfaces each host supports. See the [projection contract](runtime-projection-contract.md)
for differences in resource availability and invocation.

## Pi Recon profile

Pi has a bounded Recon profile. Build it with `pnpm build:pi`, then follow
`out/pi/README.md` to install the generated package. This profile includes Recon
and its selected supporting stances. The setup wizard currently offers the
other three targets.

## VS Code local registration

For VS Code, the build writes the plugin to `out/wycats/`. Local registration adds that output directory to `chat.pluginLocations` in the selected VS Code `settings.json` file. The Agent Plugins 1.0 package discovers its Copilot hooks through `com.github.copilot/hooks/hooks.json`; separate hook registration is unnecessary. The installer removes this checkout's older plugin and hook registrations while preserving unrelated entries.

The registration target is explicit. The installer does not default to Stable VS Code, because many local development sessions run in VS Code Insiders.

### Choose Stable or Insiders

```sh
pnpm install-local -- --vscode-channel stable
pnpm install-local -- --vscode-channel insiders
```

The standard settings paths are:

| OS      | Stable                                                                 | Insiders                                                                            |
| ------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| macOS   | `~/Library/Application Support/Code/User/settings.json`                | `~/Library/Application Support/Code - Insiders/User/settings.json`                  |
| Linux   | `${XDG_CONFIG_HOME:-~/.config}/Code/User/settings.json`                | `${XDG_CONFIG_HOME:-~/.config}/Code - Insiders/User/settings.json`                  |
| Windows | `${APPDATA:-~/AppData/Roaming}/Code/User/settings.json`                | `${APPDATA:-~/AppData/Roaming}/Code - Insiders/User/settings.json`                  |

### Use an exact settings path

Use `--settings` when you want full control, including temp fixtures or nonstandard VS Code profiles:

```sh
pnpm install-local -- --settings "~/Library/Application Support/Code - Insiders/User/settings.json"
```

Direct `--settings` and direct `--vscode-channel` are mutually exclusive. If both environment fallbacks and CLI flags are present, precedence is: `--settings`, `VSCODE_SETTINGS_PATH`, `--vscode-channel`, `VSCODE_CHANNEL`.

### Preview without writing

`--dry-run` runs the build, resolves the settings target, and reports stale registrations, already-enabled entries, and entries that would be added. It does not create directories, create settings files, or write changes.

```sh
pnpm install-local -- --dry-run --vscode-channel insiders
pnpm install-local -- --dry-run --settings /tmp/vscode-settings.json
```

Running `pnpm install-local` with no explicit target exits with a helpful error instead of guessing.

## Claude Code persistent guidance

After installing the plugin, run `/wycats:setup-guidance` in the project to
install or refresh its persistent instructions. The command previews the change
and then runs the packaged installer. Use `/wycats:setup-guidance remove` before
uninstalling, or `/wycats:setup-guidance repair` to preserve edited generated
files and refresh the installation. You can also supply a project directory.
The command is available only through explicit invocation.

For direct terminal use, a local build is:

```sh
node scripts/build.ts --config config.claude-code.example.json
node out/claude-code/scripts/claude-guidance.mjs install --project /path/to/project --dry-run
node out/claude-code/scripts/claude-guidance.mjs install --project /path/to/project
```

For a marketplace installation, run `scripts/claude-guidance.mjs` from the
installed plugin directory instead of `out/claude-code`. Choose the package
version you intend to use; the command resolves links against its own location.
It requires an explicit project directory and does not change user-wide settings.

The command appends a marked import to the project's `CLAUDE.md`, preserving
existing text, and writes the complete prose to
`.claude/wycats/persistent-instructions.md`. An adjacent `installation.json` records
ownership so updates and removal can detect edits. Treat `.claude/wycats/` as
local installation state and exclude it from version control according to your
project's conventions. It may also contain a pending
operation or recovery copies. Their contents include local installation paths.
The command does not edit Git ignore rules. A shared `CLAUDE.md` import requires
each collaborator to install the corresponding generated file.

Restart or resume Claude with project instructions enabled. The story loads as
persistent instruction context and leaves the selected output style intact.
Creating `CLAUDE.md` can change automatic `AGENTS.md` discovery in newer Claude
versions; if the project relies on `AGENTS.md`, retain it through Claude's
[documented import or instruction-selection configuration](https://code.claude.com/docs/en/memory#agentsmd).

After every plugin update or relocation, rerun `install` from the current package.
This refreshes the generated prose and its links without changing the import or
surrounding instructions. An already running Claude process is not guaranteed to
reload it; restart or resume after refreshing. `pnpm launch-claude` loads the
plugin but does not opt projects into persistent guidance or refresh their files.

Before removing the plugin, remove its companion instructions:

```sh
node /path/to/installed/plugin/scripts/claude-guidance.mjs remove --project /path/to/project --dry-run
node /path/to/installed/plugin/scripts/claude-guidance.mjs remove --project /path/to/project
```

Removal deletes the managed import and generated files. It preserves later user
additions, unrelated files, and any preexisting `CLAUDE.md`. If the command created
`CLAUDE.md` and nothing else was added, it removes that file too. Both operations
refuse edited imports, edited exports, and unowned destination files. Use `repair`
to preserve recovery copies before refreshing those files. Incomplete or duplicate
import markers require reconciliation in `CLAUDE.md` before repair. All operations
refuse symlinks at managed paths. Disabling the plugin alone leaves this
independent import active.

## Codex local marketplace

Codex consumes a `.codex-plugin/plugin.json` manifest and discovers skills from the plugin's `skills/` directory. To build just the Codex target:

```sh
pnpm build:codex
```

To package the generated plugin into an ignored local marketplace artifact:

```sh
pnpm package-codex
```

That command writes:

- `out/codex-marketplace/plugin/` — the Codex plugin package
- `out/codex-marketplace/.agents/plugins/marketplace.json` — a local Codex marketplace pointing at `./plugin`

Add the local marketplace and install:

```sh
codex plugin marketplace add ./out/codex-marketplace
codex plugin add wycats@wycats
```

Published Codex artifacts are generated from `main` and force-pushed to the
`codex-plugin` branch. Install the remote marketplace from that branch:

```sh
codex plugin marketplace add wycats/ai-plugin --ref codex-plugin
codex plugin add wycats@wycats
```

To refresh the configured Git marketplace after updates:

```sh
codex plugin marketplace upgrade wycats
```

Then restart Codex. If the installed plugin cache appears stale, remove and
re-add the plugin after upgrading the marketplace.

## Renaming an existing installation

The public plugin and marketplace name is `wycats`; the repository is
`wycats/ai-plugin`. Host-qualified references now use `wycats:`, such as
`wycats:recon`. Update any saved references or enablement settings that name the
old plugin. The old and new identities should not both remain enabled.

For published installations, run this migration after the renamed artifacts
are available on the target's publication branch.

### Codex

Remove the old plugin and marketplace, then register the generated marketplace:

```sh
codex plugin remove wycats-ai-plugin@wycats-ai-plugin
codex plugin marketplace remove wycats-ai-plugin
codex plugin marketplace add wycats/ai-plugin --ref codex-plugin
codex plugin add wycats@wycats
```

Restart Codex. This also migrates installations that used the earlier
main-branch marketplace. For a local build, use `./out/codex-marketplace`
in the marketplace-add command instead of the Git source and `--ref`.

### Claude Code

For the repository's dedicated marketplace, remove the old registration and
install from the generated branch:

```sh
claude plugin marketplace remove wycats-ai-plugin
claude plugin marketplace add wycats/ai-plugin#cc-plugin
claude plugin install wycats@wycats
```

[Removing a Claude marketplace also uninstalls its plugins](https://code.claude.com/docs/en/plugin-marketplaces#remove-the-marketplace-to-start-over).
Preserve the installation scope if you previously installed at project or local
scope. A local `--plugin-dir` launch instead needs a rebuilt package and a new
session.

### VS Code

A local `chat.pluginLocations` registration points to the package directory,
so rebuild and reload the window; its path stays the same. For a marketplace
installation, [uninstall the old plugin](https://code.visualstudio.com/docs/agent-customization/agent-plugins),
refresh the repository marketplace, and install `wycats`.
The publication workflow regenerates both `dist/wycats/` and the root
`marketplace.json` together from the new manifest.

### Pi

The Git source and `wycats-recon` agent profile stay the same. Update the package
from `pi-plugin` and reload Pi as described in the generated package README;
the generated package manifest now takes its name from the canonical plugin
manifest.

## Configuring `config.json`

The file has a JSON Schema (`config.schema.json`) that provides validation and autocomplete in VS Code and other editors. The `$schema` line at the top enables this. The build uses the same contract at runtime: edit `scripts/build-config.ts` and run `pnpm generate:config-schema` to update the editor schema. Checks detect a stale generated schema.

Model and thinking-level mappings accept custom role names. The familiar roles are editor suggestions; an omitted model mapping or `null` uses the host default. Unknown top-level configuration fields are rejected so misspelled settings are caught before building.

### `target`

Which platform you're building for. This determines the output format and platform output directory.

- `"vscode"` — for VS Code with GitHub Copilot; builds to `out/wycats/`
- `"claude-code"` — for Claude Code; builds to `out/claude-code/`
- `"codex"` — for Codex; builds to `out/codex/`
- `"pi"` — bounded Recon profile; builds to `out/pi/`

### `models`

Three roles that agents use, mapped to model strings for your provider:

| Role        | What it's for                   | Which agents use it                   |
| ----------- | ------------------------------- | ------------------------------------- |
| `fast`      | Strong reasoning, complex tasks | recon, recon-worker                   |
| `balanced`  | Mid-tier model role             | Available for custom agent definitions |
| `auxiliary` | Delegated editorial reading    | editorial-reader                      |

Set a role to `null` to leave the model unspecified — the platform picks its default.

**Examples by provider:**

Copilot (no specific models needed):

```json
"models": {
  "fast": null,
  "balanced": null,
  "auxiliary": null
}
```

Vercel AI Gateway:

```json
"models": {
  "fast": "Claude Opus 4.6 Fast (vercel)",
  "balanced": "Gemini 3.1 Pro Preview (vercel)",
  "auxiliary": "GPT 5.4 (vercel)"
}
```

Claude Code:

```json
"models": {
  "fast": "opus",
  "balanced": "sonnet",
  "auxiliary": "haiku"
}
```

### `toolGroups`

Named sets of tool identifiers that agents reference. The defaults in `config.example.json` work for VS Code — you generally don't need to change these unless you're targeting a different platform or want to add/remove specific tools.

Each agent's source file lists the groups it needs (e.g., `tools: [core, agent, browser, memory]`). The build expands group names into concrete tool lists. If an agent lists a name that isn't a group, it passes through unchanged — so agents can mix groups and individual tools.

The `communication` group is optional for existing configurations. If its mapping
is absent, it contributes no tools. This lets agents request messaging without
emitting an unknown tool name when built with an older configuration.

The default groups:

| Group              | What it provides                                                       |
| ------------------ | ---------------------------------------------------------------------- |
| `core`             | Basic capabilities: workspace access, file reading, search, web, todos |
| `agent`            | Dispatching subagents                                                  |
| `communication`    | Messaging existing agents, including continuation where supported     |
| `browser`          | Browser interaction                                                    |
| `edit`             | File editing for agents assigned to change artifacts                  |
| `memory`           | Persistent memory across sessions                                      |
| `exo`              | Exosuit context tools                                                  |
| `terminal`         | Full terminal: run commands, await output, kill processes              |
| `terminal-minimal` | Just running commands and reading output                               |
| `testing`          | Running tests and inspecting failures                                  |
| `tasks`            | Creating and running VS Code tasks                                     |
| `github`           | GitHub PRs, issues, search, code review                                |

The Claude example maps `communication` to `SendMessage` for both Recon and its
worker. Recon also receives `Agent` and `TaskStop` through the `agent` group.
This lets workers exchange findings without granting them new-agent creation or
the `TaskStop` tool. `SendMessage` can resume an existing agent, and `TaskStop`
controls background tasks more broadly than child agents. The mapping does not
restrict messages to a particular recipient or stops to a particular owner.
See Claude's [subagent documentation](https://code.claude.com/docs/en/sub-agents#resume-subagents)
and [tools reference](https://code.claude.com/docs/en/tools-reference) for runtime
availability and permissions. Other shipped profiles leave `communication`
empty pending qualification of their mappings.

## Keeping up to date

```sh
git pull
pnpm build
```

Then reload VS Code. Your `config.json` is gitignored, so pulls won't overwrite it. If `config.example.json` adds new fields, you may want to merge them into your config.

## Development

To rebuild automatically when source files or config change:

```sh
pnpm watch
```

To validate the plugin structure:

```sh
pnpm validate
```
